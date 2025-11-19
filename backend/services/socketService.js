const { Server } = require('socket.io');
const { Device, Log } = require('../models');
const { resolveCampaignForJingle } = require('../utils/logAttribution');
const {
	getActiveCampaignsForDevice,
	syncCampaignStatuses,
} = require('./scheduleService');

class SocketService {
	constructor() {
		this.io = null;
		this.deviceSockets = new Map();
		this.devicePlaybackInfo = new Map(); // Store current playback info for each device
	}

	init(httpServer) {
		const allowedOrigins = process.env.CLIENT_ORIGIN
			? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
			: ['http://localhost:5173'];
		
		this.io = new Server(httpServer, {
			cors: {
				origin: function (origin, callback) {
					// Allow requests with no origin (like mobile apps or curl requests)
					if (!origin) return callback(null, true);
					
					if (allowedOrigins.indexOf(origin) !== -1) {
						callback(null, true);
					} else {
						callback(new Error('Not allowed by CORS'));
					}
				},
				credentials: true,
			},
		});

		this.io.on('connection', (socket) => {
		socket.on('device:register', async (payload, ack) => {
			try {
				const device = await this.registerDevice(socket, payload);
				const playlistData = await getActiveCampaignsForDevice(device.id);
				
				console.log(`[socketService] Device ${device.id} registration - playlist items: ${playlistData.length}`);
				
				// Format response with playlist and playback window
				let response = { 
					success: true, 
					deviceId: device.id, 
					deviceName: device.name, 
					playlist: playlistData.map(item => ({
						id: item.jingleId,
						title: item.title,
						filePath: `uploads/jingles/${item.filename}`,
					})),
				};
				
				// Add playback window if exists (from first item)
				if (playlistData.length > 0) {
					response.playbackWindowStart = playlistData[0].playbackWindowStart;
					response.playbackWindowEnd = playlistData[0].playbackWindowEnd;
				}
				
				console.log(`[socketService] Sending registration response:`, JSON.stringify(response, null, 2));
				
				if (typeof ack === 'function') {
					ack(response);
				}
			} catch (error) {
				console.error(`[socketService] Device registration error:`, error);
				if (typeof ack === 'function') {
					ack({ success: false, message: error.message });
				}
			}
		});			socket.on('device:heartbeat', async ({ deviceId }, ack) => {
				if (!deviceId) {
					if (typeof ack === 'function') {
						ack({ success: false, message: 'deviceId is required' });
					}
					return;
				}

				try {
					await Device.update(
						{ lastSeenAt: new Date(), status: 'online' },
						{ where: { id: deviceId } },
					);
					if (typeof ack === 'function') {
						ack({ success: true });
					}
				} catch (error) {
					if (typeof ack === 'function') {
						ack({ success: false, message: error.message });
					}
				}
			});

			socket.on('playback:log', async (payload, ack) => {
				try {
					const playbackTimestamp = payload.playbackAt ? new Date(payload.playbackAt) : new Date();
					let resolvedCampaignId = payload.campaignId ? Number(payload.campaignId) : null;

					if (!resolvedCampaignId && payload.jingleId) {
						const campaign = await resolveCampaignForJingle(Number(payload.jingleId), playbackTimestamp);
						if (campaign) {
							resolvedCampaignId = campaign.id;
						}
					}

					const log = await Log.create({
						deviceId: Number(payload.deviceId),
						campaignId: resolvedCampaignId,
						jingleId: Number(payload.jingleId),
						playbackAt: playbackTimestamp,
						durationSeconds: payload.durationSeconds ? Number(payload.durationSeconds) : null,
						status: payload.status || 'completed',
						details: payload.details || null,
					});
					console.log('[Socket] Playback log created:', { 
						logId: log.id, 
						deviceId: log.deviceId, 
						campaignId: log.campaignId || resolvedCampaignId || null,
						jingleId: log.jingleId,
						status: log.status 
					});
					if (typeof ack === 'function') {
						ack({ success: true, logId: log.id });
					}
				} catch (error) {
					console.error('[Socket] Failed to create playback log:', error);
					if (typeof ack === 'function') {
						ack({ success: false, message: error.message });
					}
				}
			});

			socket.on('device:crash', async (payload) => {
				console.error('════════════════════════════════════════');
				console.error('🔴 DEVICE CRASH DETECTED');
				console.error('════════════════════════════════════════');
				console.error(`Device ID: ${payload.deviceId}`);
				console.error(`Device Name: ${payload.deviceName}`);
				console.error(`Timestamp: ${new Date(payload.timestamp).toISOString()}`);
				console.error(`Thread: ${payload.threadName}`);
				console.error(`Exception: ${payload.exceptionType}`);
				console.error(`Message: ${payload.exceptionMessage}`);
				console.error(`Is Playback Active: ${payload.isPlaybackActive}`);
				console.error(`Is Auto Playing: ${payload.isAutoPlaying}`);
				console.error(`Current Campaign ID: ${payload.currentCampaignId}`);
				console.error(`Current Jingle ID: ${payload.currentJingleId}`);
				console.error('Stack Trace:');
				console.error(payload.stackTrace);
				console.error('════════════════════════════════════════');
				
				// Store crash log in database
				try {
					const crashPlaybackTime = payload.timestamp ? new Date(payload.timestamp) : new Date();
					let crashCampaignId = payload.currentCampaignId ? Number(payload.currentCampaignId) : null;
					const crashJingleId = payload.currentJingleId ? Number(payload.currentJingleId) : null;

					if (!crashCampaignId && Number.isInteger(crashJingleId)) {
						const campaign = await resolveCampaignForJingle(crashJingleId, crashPlaybackTime);
						if (campaign) {
							crashCampaignId = campaign.id;
						}
					}

					await Log.create({
						deviceId: Number(payload.deviceId),
						campaignId: crashCampaignId,
						jingleId: crashJingleId,
						playbackAt: crashPlaybackTime,
						status: 'crashed',
						details: JSON.stringify({
							thread: payload.threadName,
							exception: payload.exceptionType,
							message: payload.exceptionMessage,
							stackTrace: payload.stackTrace,
							isPlaybackActive: payload.isPlaybackActive,
							isAutoPlaying: payload.isAutoPlaying,
						}),
					});
				} catch (error) {
					console.error('Failed to store crash log:', error);
				}
			});

			socket.on('device:debug', async (payload) => {
				console.log(`[DEBUG] Device ${payload.deviceId} | ${payload.event} | ${payload.details} | PlaybackActive: ${payload.isPlaybackActive} | MediaPlayer: ${payload.mediaPlayerState}`);
			});

			// Live relay: device sends current playback status
			socket.on('playback:status', async (payload) => {
				const { deviceId, currentJingle, position, duration, isPlaying } = payload;
				if (deviceId) {
					this.devicePlaybackInfo.set(deviceId, {
						currentJingle,
						position,
						duration,
						isPlaying,
						timestamp: Date.now(),
					});
					console.log(`[LiveRelay] Updated playback status for device ${deviceId}:`, { 
						jingle: currentJingle?.title || 'none', 
						isPlaying,
						position: position ? `${(position/1000).toFixed(1)}s` : '0s'
					});
					
					// Broadcast status update to all connected web clients
					this.io.emit('playback:status', {
						deviceId,
						currentJingle,
						position,
						duration,
						isPlaying,
					});
				}
			});

			socket.on('disconnect', async () => {
				const deviceId = this.findDeviceIdBySocket(socket.id);
				if (deviceId) {
					this.deviceSockets.delete(deviceId);
					this.devicePlaybackInfo.delete(deviceId); // Clear playback info
					await Device.update(
						{ status: 'offline', lastSeenAt: new Date() },
						{ where: { id: deviceId } },
					);
				}
			});
		});
	}

	findDeviceIdBySocket(socketId) {
		for (const [deviceId, storedSocketId] of this.deviceSockets.entries()) {
			if (storedSocketId === socketId) {
				return deviceId;
			}
		}
		return null;
	}

	async registerDevice(socket, payload) {
		const { serialNumber, pairingCode, deviceName, ipAddress, latitude, longitude } = payload;
		const normalisedCode = (pairingCode || '').trim().toUpperCase();

		if (!serialNumber || !normalisedCode) {
			throw new Error('serialNumber and pairingCode are required');
		}

		const device = await Device.findOne({
			where: { pairingCode: normalisedCode },
		});

		if (!device) {
			throw new Error('Invalid pairing code');
		}

		const existingSerial = device.serialNumber;
		if (
			device.isPaired &&
			existingSerial &&
			existingSerial !== serialNumber
		) {
			throw new Error('Pairing code is already linked to another device. Reset it in the dashboard before pairing again.');
		}

		device.serialNumber = serialNumber || existingSerial;
		device.name = deviceName || device.name;
		device.isPaired = true;
		device.status = 'online';
		device.pairedAt = device.pairedAt || new Date();
		device.lastSeenAt = new Date();
		device.ipAddress = ipAddress || socket.handshake.address || device.ipAddress;
		
		// Save location if provided (only on first pairing or if not already set)
		if (latitude !== undefined && longitude !== undefined) {
			if (!device.latitude || !device.longitude) {
				device.latitude = latitude;
				device.longitude = longitude;
			}
		}

		await device.save();

		this.deviceSockets.set(device.id, socket.id);

		await syncCampaignStatuses();

		return device;
	}

	async emitToDevice(deviceId, event, payload) {
		if (!this.io) {
			throw new Error('Socket server has not been initialised');
		}
		const socketId = this.deviceSockets.get(deviceId);
		if (!socketId) {
			throw new Error('Target device is not online');
		}
		this.io.to(socketId).emit(event, payload);
	}

	disconnectDevice(deviceId) {
		if (!this.io) {
			return;
		}
		const socketId = this.deviceSockets.get(deviceId);
		if (socketId) {
			const socket = this.io.sockets.sockets.get(socketId);
			if (socket) {
				socket.disconnect(true);
			}
			this.deviceSockets.delete(deviceId);
		}
	}

	async broadcastScheduleUpdate() {
		if (!this.io) {
			return;
		}

		for (const [deviceId, socketId] of this.deviceSockets.entries()) {
			const playlistData = await getActiveCampaignsForDevice(deviceId);
			
			// Format update with playlist and playback window
			const update = { 
				playlist: playlistData.map(item => ({
					id: item.jingleId,
					title: item.title,
					filePath: `uploads/jingles/${item.filename}`,
				})),
			};
			
			// Add playback window if exists
			if (playlistData.length > 0) {
				update.playbackWindowStart = playlistData[0].playbackWindowStart;
				update.playbackWindowEnd = playlistData[0].playbackWindowEnd;
			}
			
			this.io.to(socketId).emit('schedule:update', update);
		}
	}

	// Get current playback info for a device
	getDevicePlaybackInfo(deviceId) {
		return this.devicePlaybackInfo.get(deviceId) || null;
	}

	// Request live playback info from device
	async requestLivePlayback(deviceId) {
		if (!this.io) {
			throw new Error('Socket server has not been initialised');
		}
		
		const socketId = this.deviceSockets.get(deviceId);
		if (!socketId) {
			throw new Error('Target device is not online');
		}

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Device did not respond in time'));
			}, 5000); // 5 second timeout

			this.io.to(socketId).emit('relay:request', {}, (response) => {
				clearTimeout(timeout);
				if (response && response.success) {
					// Update stored playback info
					this.devicePlaybackInfo.set(deviceId, {
						currentJingle: response.currentJingle,
						position: response.position,
						duration: response.duration,
						isPlaying: response.isPlaying,
						timestamp: Date.now(),
					});
					resolve(response);
				} else {
					reject(new Error(response?.message || 'Failed to get playback info'));
				}
			});
		});
	}
}

module.exports = new SocketService();
