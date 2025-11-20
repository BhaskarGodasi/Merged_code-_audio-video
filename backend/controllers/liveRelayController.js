const { Op } = require('sequelize');
const { Device, DeviceSchedule, DeviceScheduleJingle, Jingle, AudioCampaign, CampaignJingle } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const socketService = require('../services/socketService');

const resolveClientDeviceIds = async (brandId) => {
	const campaigns = await AudioCampaign.findAll({
		where: { brandId },
		attributes: ['id'],
	});

	if (campaigns.length === 0) {
		return [];
	}

	const campaignIds = campaigns.map((campaign) => campaign.id);
	const campaignJingles = await CampaignJingle.findAll({
		where: { campaignId: { [Op.in]: campaignIds } },
		attributes: ['jingleId'],
	});

	if (campaignJingles.length === 0) {
		return [];
	}

	const jingleIds = [...new Set(campaignJingles.map((item) => item.jingleId))];
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);
	const todayEnd = new Date();
	todayEnd.setHours(23, 59, 59, 999);

	const scheduleJingles = await DeviceScheduleJingle.findAll({
		where: {
			jingleId: { [Op.in]: jingleIds },
			isActive: true,
			startDate: { [Op.lte]: todayEnd },
			endDate: { [Op.gte]: todayStart },
		},
		attributes: ['deviceScheduleId'],
	});

	if (scheduleJingles.length === 0) {
		return [];
	}

	const scheduleIds = [...new Set(scheduleJingles.map((item) => item.deviceScheduleId))];
	const deviceSchedules = await DeviceSchedule.findAll({
		where: { id: { [Op.in]: scheduleIds } },
		attributes: ['deviceId'],
	});

	return [...new Set(deviceSchedules.map((schedule) => schedule.deviceId))];
};

/**
 * Get all online devices with their current playback status
 */
const getOnlineDevices = asyncHandler(async (req, res) => {
	const whereClause = {
 status: 'online',
		isPaired: true,
	};

	if (req.user?.role === 'client' && req.user.brandId) {
		const allowedDeviceIds = await resolveClientDeviceIds(req.user.brandId);
		if (allowedDeviceIds.length === 0) {
			return res.json([]);
		}
		whereClause.id = { [Op.in]: allowedDeviceIds };
	}

	const onlineDevices = await Device.findAll({
		where: whereClause,
		attributes: ['id', 'name', 'serialNumber', 'status', 'lastSeenAt', 'latitude', 'longitude', 'ipAddress'],
		order: [['name', 'ASC']],
	});

	// Get current playback info from socket service
	const devicesWithStatus = onlineDevices.map(device => {
		const deviceData = device.toJSON();
		const playbackInfo = socketService.getDevicePlaybackInfo(device.id);
		return {
			...deviceData,
			currentlyPlaying: playbackInfo?.currentJingle || null,
			playbackStatus: playbackInfo?.status || 'idle',
		};
	});

	res.json(devicesWithStatus);
});

/**
 * Get device schedule and play order for a specific online device
 */
const getDeviceSchedule = asyncHandler(async (req, res) => {
	const { deviceId } = req.params;

	// Verify device exists
	const device = await Device.findByPk(deviceId);
	if (!device) {
		const err = new Error('Device not found');
		err.status = 404;
		throw err;
	}

	if (req.user?.role === 'client' && req.user.brandId) {
		const allowedDeviceIds = await resolveClientDeviceIds(req.user.brandId);
		if (!allowedDeviceIds.includes(device.id)) {
			return res.status(403).json({ error: true, message: 'Access denied to this device' });
		}
	}

	if (req.user?.role === 'client' && req.user.brandId) {
		const allowedDeviceIds = await resolveClientDeviceIds(req.user.brandId);
		if (!allowedDeviceIds.includes(device.id)) {
			return res.status(403).json({ error: true, message: 'Access denied to this device schedule' });
		}
	}

	// Allow viewing schedule even if device is offline
	// (just won't be able to get live playback info)

	// Get device schedule with jingles
	const schedule = await DeviceSchedule.findOne({
		where: { deviceId },
		include: [
			{
				model: DeviceScheduleJingle,
				as: 'jingles',
				include: [
			{
				model: Jingle,
				as: 'jingle',
				attributes: ['id', 'title', 'fileName', 'filePath', 'durationSeconds'],
			},
			],
			attributes: ['id', 'jingleId', 'spots'],
		},
		],
	});	if (!schedule) {
		return res.json({
			deviceId,
			deviceName: device.name,
			schedule: null,
			playOrder: [],
			scheduledJingles: [],
		});
	}

	res.json({
		deviceId,
		deviceName: device.name,
		schedule: {
			playbackWindowStart: schedule.playbackWindowStart,
			playbackWindowEnd: schedule.playbackWindowEnd,
		},
		playOrder: schedule.playOrder || [],
		scheduledJingles: schedule.jingles.map((sj) => {
			const jingle = sj.jingle || {};
			const fileName = jingle.fileName || jingle.filename || null;
			const filePath = jingle.filePath || (fileName ? `uploads/jingles/${fileName}` : null);
			const durationSeconds = jingle.durationSeconds ?? jingle.duration ?? null;
			return {
				jingleId: jingle.id,
				title: jingle.title,
				filename: fileName,
				filePath,
				duration: durationSeconds,
				spots: sj.spots ?? null,
			};
		}),
	});
});

/**
 * Request live audio stream from device (triggers device to send current playing jingle)
 */
const requestLiveStream = asyncHandler(async (req, res) => {
	const { deviceId } = req.params;

	// Verify device exists
	const device = await Device.findByPk(deviceId);
	if (!device) {
		const err = new Error('Device not found');
		err.status = 404;
		throw err;
	}

	// Check if device is online before requesting live stream
	if (device.status !== 'online') {
		return res.json({
			success: false,
			deviceId,
			message: 'Device is not currently online',
			currentJingle: null,
			position: 0,
			duration: 0,
			isPlaying: false,
		});
	}

	// Request current playback info from device via socket
	try {
		const playbackInfo = await socketService.requestLivePlayback(deviceId);
		res.json({
			success: true,
			deviceId,
			currentJingle: playbackInfo.currentJingle,
			position: playbackInfo.position,
			duration: playbackInfo.duration,
			isPlaying: playbackInfo.isPlaying,
		});
	} catch (error) {
		const err = new Error(error.message || 'Failed to get live playback info');
		err.status = 500;
		throw err;
	}
});

module.exports = {
	getOnlineDevices,
	getDeviceSchedule,
	requestLiveStream,
};
