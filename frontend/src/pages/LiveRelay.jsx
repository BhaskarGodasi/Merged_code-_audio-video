import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { liveRelayApi, deviceSchedulesApi, brandsApi } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import Pagination from '../components/common/Pagination';
import PlayOrderModal from '../components/sendads/PlayOrderModal';
import './LiveRelay.css';

const API_HOST = (import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:4000').replace(/\/$/, '');

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
});

const formatDateSafe = (value) => {
	if (!value) {
		return '—';
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return '—';
	}
	return DATE_FORMATTER.format(date);
};

const formatDateRange = (start, end) => {
	if (!start && !end) {
		return '—';
	}
	if (!start) {
		return formatDateSafe(end);
	}
	if (!end) {
		return formatDateSafe(start);
	}
	return `${formatDateSafe(start)} → ${formatDateSafe(end)}`;
};

const formatDuration = (seconds) => {
	if (seconds === null || seconds === undefined) {
		return '—';
	}
	const totalSeconds = Math.max(0, Math.round(seconds));
	const minutes = Math.floor(totalSeconds / 60);
	const remaining = totalSeconds % 60;
	if (minutes === 0) {
		return `${totalSeconds}s`;
	}
	return `${minutes}m ${remaining.toString().padStart(2, '0')}s`;
};

const normaliseScheduleData = (data) => {
	if (!data) {
		return null;
	}

	const playbackWindowStart = data.playbackWindowStart || data.schedule?.playbackWindowStart || null;
	const playbackWindowEnd = data.playbackWindowEnd || data.schedule?.playbackWindowEnd || null;
	const rawPlayOrder = data.playOrder;
	let playOrderMeta = null;
	let playOrderSequence = [];

	if (rawPlayOrder) {
		if (Array.isArray(rawPlayOrder)) {
			playOrderSequence = rawPlayOrder;
			playOrderMeta = {
				playOrder: rawPlayOrder,
				totalAds: rawPlayOrder.length,
			};
		} else if (rawPlayOrder.playOrder) {
			playOrderSequence = rawPlayOrder.playOrder;
			playOrderMeta = rawPlayOrder;
		}
	}

	const rawJingles = Array.isArray(data.jingles)
		? data.jingles
		: Array.isArray(data.scheduledJingles)
			? data.scheduledJingles
			: [];

	const scheduledJingles = rawJingles.map((item) => {
		const jingle = item.jingle || {};
		const jingleId = item.jingleId ?? jingle.id ?? null;
		const filename = jingle.fileName || jingle.filename || item.filename || null;
		const filePath = item.filePath || jingle.filePath || (filename ? `uploads/jingles/${filename}` : null);
		const duration = jingle.durationSeconds ?? item.durationSeconds ?? item.duration ?? null;

		return {
			id: item.id ?? item.scheduleJingleId ?? `${jingleId || 'jingle'}-${item.startDate || 'na'}`,
			jingleId,
			title: jingle.title || item.title || 'Untitled Jingle',
			duration,
			spots: item.spots ?? item.percentage ?? null,
			startDate: item.startDate ?? null,
			endDate: item.endDate ?? null,
			isActive: item.isActive ?? true,
			filename,
			filePath,
			jingle,
		};
	});

	return {
		id: data.id ?? null,
		playbackWindowStart,
		playbackWindowEnd,
		isActive: data.isActive ?? data.schedule?.isActive ?? true,
		playOrderMeta,
		playOrder: playOrderSequence,
		scheduledJingles,
	};
};

const normalisePlaybackPayload = (payload, fallbackDeviceId) => {
	if (!payload) {
		return null;
	}

	const currentJingle = payload.currentJingle || payload.jingle || null;
	if (!currentJingle) {
		return {
			success: payload.success ?? false,
			deviceId: payload.deviceId ?? fallbackDeviceId ?? null,
			currentJingle: null,
			position: payload.position ?? payload.currentPosition ?? 0,
			duration: payload.duration ?? null,
			isPlaying: payload.isPlaying ?? (payload.status === 'playing'),
			timestamp: Date.now(),
		};
	}

	const filename = currentJingle.filename || currentJingle.fileName || currentJingle.file_path || null;
	const filePath = currentJingle.filePath || (filename ? `uploads/jingles/${filename}` : null);
	const duration = payload.duration ?? currentJingle.duration ?? currentJingle.durationSeconds ?? null;

	return {
		success: payload.success ?? true,
		deviceId: payload.deviceId ?? fallbackDeviceId ?? null,
		currentJingle: {
			...currentJingle,
			title: currentJingle.title || currentJingle.name || filename || 'Current Jingle',
			filename,
			filePath,
			duration,
		},
		position: payload.position ?? payload.currentPosition ?? 0,
		duration,
		isPlaying: payload.isPlaying ?? (payload.status === 'playing'),
		timestamp: Date.now(),
	};
};

const resolveAudioUrl = (jingle, scheduledJingles = []) => {
	if (!jingle) {
		return null;
	}

	const candidates = [
		jingle.streamUrl,
		jingle.url,
		jingle.mediaUrl,
		jingle.filePath,
		jingle.file_path,
	];

	let filename = jingle.filename || jingle.fileName || null;

	if (!filename) {
		const candidatePath = candidates.find((value) => typeof value === 'string' && value.length > 0);
		if (candidatePath) {
			const parts = candidatePath.split('/');
			filename = parts[parts.length - 1];
		}
	}

	const scheduledMatch = scheduledJingles.find((item) => {
		if (!item) {
			return false;
		}
		if (jingle.id && item.jingleId && Number(item.jingleId) === Number(jingle.id)) {
			return true;
		}
		if (filename && item.filename) {
			return item.filename === filename;
		}
		return false;
	});

	if (scheduledMatch) {
		if (!filename) {
			filename = scheduledMatch.filename;
		}
		candidates.push(scheduledMatch.filePath);
	}

	let resolved = candidates.find((value) => typeof value === 'string' && value.length > 0);

	if (!resolved && filename) {
		resolved = `uploads/jingles/${filename}`;
	}

	if (!resolved) {
		return null;
	}

	if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
		return resolved;
	}

	const trimmed = resolved.replace(/^\/+/, '');
	return `${API_HOST}/${trimmed}`;
};

const LiveRelay = () => {
	const { user, isClient } = useAuth();
	const isClientUser = isClient();

	const [onlineDevices, setOnlineDevices] = useState([]);
	const [selectedDevice, setSelectedDevice] = useState(null);
	const [deviceSchedule, setDeviceSchedule] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [currentPlayback, setCurrentPlayback] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [isPlaying, setIsPlaying] = useState(false);
	const [playOrderModalOpen, setPlayOrderModalOpen] = useState(false);
	const [playOrderModalData, setPlayOrderModalData] = useState(null);
	const [playOrderLoading, setPlayOrderLoading] = useState(false);
	const [isAudioLoading, setIsAudioLoading] = useState(false);
	const [clientAnalytics, setClientAnalytics] = useState(null);
	const [clientAnalyticsLoaded, setClientAnalyticsLoaded] = useState(!isClientUser);
	const audioRef = useRef(null);
	const hasActivePlayback = Boolean(currentPlayback?.currentJingle);
	const fetchOnlineDevices = useCallback(async () => {
		try {
			const devices = await liveRelayApi.getOnlineDevices();
			setOnlineDevices(devices);

			if (selectedDevice) {
				const updated = devices.find((device) => device.id === selectedDevice.id);
				if (updated) {
					setSelectedDevice(updated);

					if (updated.currentlyPlaying && !hasActivePlayback) {
						const normalised = normalisePlaybackPayload(
							{
								deviceId: updated.id,
								currentJingle: updated.currentlyPlaying,
								isPlaying: updated.playbackStatus === 'playing',
							},
							updated.id,
						);
						setCurrentPlayback(normalised);
					}
				} else {
					setSelectedDevice(null);
					setCurrentPlayback(null);
					setDeviceSchedule(null);
				}
			}
		} catch (err) {
			console.error('Failed to fetch online devices', err);
		}
	}, [selectedDevice, hasActivePlayback]);

	useEffect(() => {
		fetchOnlineDevices();
		const interval = setInterval(fetchOnlineDevices, 10000);
		return () => clearInterval(interval);
	}, [fetchOnlineDevices]);

	useEffect(() => {
		if (!isClientUser || !user?.brandId) {
			setClientAnalytics(null);
			setClientAnalyticsLoaded(true);
			return;
		}

		let isActive = true;
		setClientAnalyticsLoaded(false);
		const loadAnalytics = async () => {
			try {
				const analytics = await brandsApi.getAnalytics(user.brandId);
				if (isActive) {
					setClientAnalytics(analytics);
				}
			} catch (analyticsError) {
				console.error('Failed to load client analytics for live relay', analyticsError);
				if (isActive) {
					setClientAnalytics(null);
				}
			} finally {
				if (isActive) {
					setClientAnalyticsLoaded(true);
				}
			}
		};

		loadAnalytics();

		return () => {
			isActive = false;
		};
	}, [isClientUser, user?.brandId]);

	useEffect(() => {
		const socket = getSocket();
		if (!socket) {
			return undefined;
		}

		const socketHandler = (payload) => {
			console.log('[LiveRelay] Received playback:status:', payload);
			if (!selectedDevice || payload.deviceId !== selectedDevice.id) {
				console.log('[LiveRelay] Ignoring status - device mismatch or no device selected');
				return;
			}
			const normalised = normalisePlaybackPayload(payload, selectedDevice.id);
			console.log('[LiveRelay] Normalised playback payload:', normalised);
			if (normalised) {
				setCurrentPlayback(normalised);
			}
		};

		socket.on('playback:status', socketHandler);
		console.log('[LiveRelay] Socket listener registered for device:', selectedDevice?.id);

		return () => {
			socket.off('playback:status', socketHandler);
			console.log('[LiveRelay] Socket listener removed');
		};
	}, [selectedDevice]);

	useEffect(() => () => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current = null;
		}
	}, []);

	const handleDeviceSelect = async (device) => {
		if (!device) {
			return;
		}

		setSelectedDevice(device);
		setDeviceSchedule(null);
		setCurrentPlayback(null);
		setError(null);
		setLoading(true);
		setIsPlaying(false);
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current = null;
		}

		let scheduleErrorMessage = null;

		try {
			const scheduleResponse = await deviceSchedulesApi.getByDevice(device.id);
			setDeviceSchedule(normaliseScheduleData(scheduleResponse));
		} catch (scheduleErr) {
			if (scheduleErr?.response?.status === 404) {
				setDeviceSchedule(null);
			} else if (scheduleErr?.response?.status === 403) {
				setDeviceSchedule(null);
				scheduleErrorMessage = 'You do not have permission to view this device schedule.';
			} else {
				scheduleErrorMessage = scheduleErr?.response?.data?.error || scheduleErr?.response?.data?.message || scheduleErr.message || 'Unknown error';
				console.error('Device schedule error:', scheduleErr);
			}
		}

		try {
			const playbackResponse = await liveRelayApi.requestLiveStream(device.id);
			const normalisedPlayback = normalisePlaybackPayload(playbackResponse, device.id);
			if (normalisedPlayback?.currentJingle) {
				setCurrentPlayback(normalisedPlayback);
			} else if (device.currentlyPlaying) {
				const fallbackPlayback = normalisePlaybackPayload(
					{
						deviceId: device.id,
						currentJingle: device.currentlyPlaying,
						isPlaying: device.playbackStatus === 'playing',
						duration: device.currentlyPlaying?.durationSeconds,
					},
					device.id,
				);
				setCurrentPlayback(fallbackPlayback);
			} else {
				setCurrentPlayback(normalisedPlayback);
			}
		} catch (playbackErr) {
			console.warn('Could not get live playback info:', playbackErr);
			if (device.currentlyPlaying) {
				const fallbackPlayback = normalisePlaybackPayload(
					{
						deviceId: device.id,
						currentJingle: device.currentlyPlaying,
						isPlaying: device.playbackStatus === 'playing',
						duration: device.currentlyPlaying?.durationSeconds,
					},
					device.id,
				);
				setCurrentPlayback(fallbackPlayback);
			} else {
				setCurrentPlayback(normalisePlaybackPayload({ deviceId: device.id }, device.id));
			}
		}

		if (scheduleErrorMessage) {
			setError(`Failed to load device schedule: ${scheduleErrorMessage}`);
		}

		setLoading(false);
	};

	const playAudioForJingle = async (jingle, startPositionMs = 0) => {
		const playbackUrl = resolveAudioUrl(jingle, deviceSchedule?.scheduledJingles);
		if (!playbackUrl) {
			alert('Audio file not available for this jingle');
			return;
		}

		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current = null;
		}

		const audio = new Audio(playbackUrl);
		audioRef.current = audio;

		audio.onended = () => setIsPlaying(false);
		audio.onerror = () => {
			setIsPlaying(false);
			alert('Failed to load audio file');
		};

		const seekPosition = Math.max(0, startPositionMs / 1000);
		
		// Wait for audio to be ready before seeking and playing
		if (seekPosition > 0) {
			const applySeek = () => {
				try {
					audio.currentTime = seekPosition;
					console.log(`[LiveRelay] Seeked audio to ${seekPosition.toFixed(2)}s (${startPositionMs}ms)`);
				} catch (seekErr) {
					console.warn('Unable to seek audio element', seekErr);
				}
			};

			// Wait for enough data to be loaded
			audio.addEventListener('canplay', () => {
				applySeek();
			}, { once: true });
		}

		try {
			await audio.play();
			setIsPlaying(true);
		} catch (err) {
			console.error('Failed to play audio', err);
			setIsPlaying(false);
			alert('Failed to play audio');
		}
	};

	const handlePlayLiveAudio = async () => {
		if (!selectedDevice) {
			alert('Select a device first');
			return;
		}

		if (isClientUser && clientAnalyticsLoaded && !isClientAdPlaying) {
			return;
		}

		setIsAudioLoading(true);

		let playbackState = null;
		try {
			const playbackResponse = await liveRelayApi.requestLiveStream(selectedDevice.id);
			playbackState = normalisePlaybackPayload(playbackResponse, selectedDevice.id);
			if (playbackState) {
				setCurrentPlayback(playbackState);
			}
		} catch (err) {
			console.warn('Failed to refresh live playback before listening', err);
			playbackState = currentPlayback;
		}

		setIsAudioLoading(false);

		const activePlayback = playbackState || currentPlayback;
		if (isClientUser && clientAnalyticsLoaded && !isClientAdPlaying) {
			return;
		}
		if (!activePlayback?.currentJingle) {
			alert('No jingle is currently playing on this device');
			return;
		}

		await playAudioForJingle(activePlayback.currentJingle, activePlayback.position || 0);
	};

	const handlePlayJingle = async (jingle) => {
		await playAudioForJingle(jingle, 0);
	};

	const handleStopAudio = () => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			audioRef.current = null;
		}
		setIsPlaying(false);
	};

	const handleViewPlayOrder = async () => {
		if (!selectedDevice) {
			alert('Please select a device first');
			return;
		}

		setPlayOrderLoading(true);

		try {
			const playOrder = await deviceSchedulesApi.getPlayOrder(selectedDevice.id);
			setPlayOrderModalData(playOrder);
			setPlayOrderModalOpen(true);
		} catch (err) {
			console.error('Failed to load play order', err);
			alert(err?.response?.data?.message || 'Failed to load play order');
		} finally {
			setPlayOrderLoading(false);
		}
	};

	const filteredDevices = onlineDevices.filter((device) =>
		device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		device.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const totalPages = isClientUser ? 1 : Math.ceil(filteredDevices.length / itemsPerPage);
	const startIndex = isClientUser ? 0 : (currentPage - 1) * itemsPerPage;
	const paginatedDevices = isClientUser ? filteredDevices : filteredDevices.slice(startIndex, startIndex + itemsPerPage);
	const scheduledJingles = useMemo(() => deviceSchedule?.scheduledJingles || [], [deviceSchedule]);
	const playOrderSequence = useMemo(() => deviceSchedule?.playOrder || [], [deviceSchedule]);
	const playOrderMeta = deviceSchedule?.playOrderMeta;

	const clientJingleIdSet = useMemo(() => {
		if (!isClientUser || !clientAnalytics) {
			return new Set();
		}

		const collected = [];
		if (Array.isArray(clientAnalytics.campaigns)) {
			clientAnalytics.campaigns.forEach((campaign) => {
				(campaign.jingles || []).forEach((jingle) => {
					if (jingle?.id !== undefined && jingle?.id !== null) {
						const numericId = Number(jingle.id);
						if (!Number.isNaN(numericId)) {
							collected.push(numericId);
						}
					}
				});
			});
		}

		if (Array.isArray(clientAnalytics.campaignPlayStats)) {
			clientAnalytics.campaignPlayStats.forEach((stat) => {
				(stat.jingleIds || []).forEach((id) => {
					const numericId = Number(id);
					if (!Number.isNaN(numericId)) {
						collected.push(numericId);
					}
				});
			});
		}

		return new Set(collected);
	}, [isClientUser, clientAnalytics]);

	const resolvedSequence = useMemo(() => {
		if (playOrderSequence && playOrderSequence.length > 0) {
			return playOrderSequence
				.map((item) => {
					const id = item?.jingleId ?? item?.id ?? item?.jingle?.id;
					if (id === undefined || id === null) {
						return null;
					}
					return {
						jingleId: Number(id),
						title: item?.title || item?.jingle?.title || 'Untitled Jingle',
					};
				})
				.filter(Boolean);
		}

		if (scheduledJingles && scheduledJingles.length > 0) {
			const sequence = [];
			scheduledJingles.forEach((item) => {
				const id = item?.jingleId ?? item?.jingle?.id;
				if (id === undefined || id === null) {
					return;
				}
				const repeatsRaw = item?.spots ?? item?.percentage ?? 1;
				const repeats = Math.max(1, Number(repeatsRaw) || 1);
				for (let index = 0; index < repeats; index += 1) {
					sequence.push({
						jingleId: Number(id),
						title: item?.title || item?.jingle?.title || 'Untitled Jingle',
					});
				}
			});
			return sequence;
		}

		return [];
	}, [playOrderSequence, scheduledJingles]);

	const currentJingleId = useMemo(() => {
		const jingle = currentPlayback?.currentJingle;
		if (!jingle) {
			return null;
		}
		const id = jingle.id ?? jingle.jingleId ?? jingle?.jingle?.id ?? null;
		if (id === null || id === undefined) {
			return null;
		}
		const numericId = Number(id);
		return Number.isNaN(numericId) ? null : numericId;
	}, [currentPlayback]);

	const isClientAdPlaying = useMemo(() => {
		if (!isClientUser) {
			return true;
		}
		if (!currentJingleId) {
			return false;
		}
		return clientJingleIdSet.has(currentJingleId);
	}, [isClientUser, currentJingleId, clientJingleIdSet]);

	const { adsUntilClient, nextClientJingleTitle } = useMemo(() => {
		if (!isClientUser) {
			return { adsUntilClient: null, nextClientJingleTitle: null };
		}
		if (!currentJingleId || !resolvedSequence.length || clientJingleIdSet.size === 0) {
			return { adsUntilClient: null, nextClientJingleTitle: null };
		}

		const currentIndex = resolvedSequence.findIndex((item) => item && Number(item.jingleId) === currentJingleId);
		if (currentIndex === -1) {
			return { adsUntilClient: null, nextClientJingleTitle: null };
		}

		for (let offset = 1; offset <= resolvedSequence.length; offset += 1) {
			const nextIndex = (currentIndex + offset) % resolvedSequence.length;
			const entry = resolvedSequence[nextIndex];
			if (entry && clientJingleIdSet.has(Number(entry.jingleId))) {
				return { adsUntilClient: offset, nextClientJingleTitle: entry.title };
			}
		}

		return { adsUntilClient: null, nextClientJingleTitle: null };
	}, [isClientUser, currentJingleId, resolvedSequence, clientJingleIdSet]);

	if (isClientUser) {
		return (
			<div className="live-relay-container">
				<div className="live-relay-header">
					<h1>🎙️ Live Relay</h1>
					<p>Monitor live playback from your online devices</p>
				</div>

				<div className="live-relay-layout client-view">
					<div className="live-relay-left">
						<div className="devices-panel">
							<div className="panel-header">
								<h2>Online Devices ({onlineDevices.length})</h2>
								<input
									type="text"
									className="search-input"
									placeholder="Search devices..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>

							<div className="devices-list">
								{filteredDevices.length === 0 ? (
									<div className="empty-state">
										{searchTerm ? 'No devices match your search' : 'No online devices'}
									</div>
								) : (
									filteredDevices.map((device) => {
										const deviceJingleId = device.currentlyPlaying?.id ?? device.currentlyPlaying?.jingleId;
										const isClientJingle = deviceJingleId && clientAnalyticsLoaded && clientJingleIdSet.has(Number(deviceJingleId));
										
										return (
											<div
												key={device.id}
												className={`device-item ${selectedDevice?.id === device.id ? 'selected' : ''}`}
												onClick={() => handleDeviceSelect(device)}
											>
												<div className="device-info">
													<div className="device-name">
														<span className="status-dot online"></span>
														{device.name}
													</div>
													<div className="device-details">
														ID: {device.id} {device.serialNumber ? `| ${device.serialNumber}` : ''}
													</div>
													{device.currentlyPlaying && (
														<div className="currently-playing">
															▶ {clientAnalyticsLoaded && !isClientJingle ? 'Other Ads Playing' : device.currentlyPlaying.title}
														</div>
													)}
												</div>
											</div>
										);
									})
								)}
							</div>
						</div>
					</div>

					<div className="live-relay-right client-view-panel">
						{!selectedDevice ? (
							<div className="empty-state-panel">
								<div className="empty-icon">📡</div>
								<h3>Select a Device</h3>
								<p>Choose an online device from the left to view its current playback</p>
							</div>
						) : loading ? (
							<div className="loading-state">Loading current playback...</div>
						) : (
							<>
								{error ? <div className="client-inline-error">{error}</div> : null}
								<div className="current-playback-card client-current-playback">
									<h3>🎵 Current Playback</h3>
									<div className="client-device-summary">
										<div className="client-device-name">{selectedDevice.name}</div>
										<div className="client-device-meta">Device ID: {selectedDevice.id}</div>
									</div>
									{currentPlayback?.currentJingle ? (
										<>
											<div className="playback-info client-playback-info">
												<div className="jingle-title">
													{clientAnalyticsLoaded && !isClientAdPlaying
														? 'Other Ads Playing'
														: currentPlayback.currentJingle.title
													}
												</div>
												<div className="playback-status">
													{currentPlayback.isPlaying ? '▶ Playing' : '⏸ Paused'}
												</div>
												{currentPlayback.duration ? (
													<div className="playback-meta">Duration: {formatDuration(currentPlayback.duration)}</div>
												) : null}
											</div>
											{clientAnalyticsLoaded && !isClientAdPlaying && (
												<div className="client-alert-card">
													<div className="client-alert-title">Other Ads Playing</div>
													{adsUntilClient ? (
														<p>
															Your ad will play after <strong>{adsUntilClient}</strong> {adsUntilClient === 1 ? 'more ad' : 'more ads'}
															{nextClientJingleTitle ? ` (${nextClientJingleTitle})` : ''}.
														</p>
													) : (
														<p>No upcoming ads from your account are scheduled on this device.</p>
													)}
												</div>
											)}
											<div className="playback-controls client-playback-controls">
												{isPlaying ? (
													<button className="control-button stop" onClick={handleStopAudio}>
														⏹ Stop Listening
													</button>
												) : (
													<button
														className="control-button play"
														onClick={handlePlayLiveAudio}
														title={isClientUser && clientAnalyticsLoaded && !isClientAdPlaying ? 'You can only listen when your ads are playing live' : 'Listen to the live audio stream'}
														disabled={isAudioLoading || (clientAnalyticsLoaded && isClientUser && !isClientAdPlaying)}
													>
														{isAudioLoading ? '⏳ Loading…' : '🎧 Listen Live'}
													</button>
												)}
											</div>
										</>
									) : (
										<div className="no-playback">No active playback</div>
									)}
								</div>
							</>
						)}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="live-relay-container">
			<div className="live-relay-header">
				<h1>🎙️ Live Relay</h1>
				<p>Monitor and listen to live playback from online devices</p>
			</div>

			<div className="live-relay-layout">
				<div className="live-relay-left">
					<div className="devices-panel">
						<div className="panel-header">
							<h2>Online Devices ({onlineDevices.length})</h2>
							<input
								type="text"
								className="search-input"
								placeholder="Search devices..."
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									setCurrentPage(1);
								}}
							/>
						</div>

						<div className="devices-list">
							{paginatedDevices.length === 0 ? (
								<div className="empty-state">
									{searchTerm ? 'No devices match your search' : 'No online devices'}
								</div>
							) : (
								paginatedDevices.map((device) => (
									<div
										key={device.id}
										className={`device-item ${selectedDevice?.id === device.id ? 'selected' : ''}`}
										onClick={() => handleDeviceSelect(device)}
									>
										<div className="device-info">
											<div className="device-name">
												<span className="status-dot online"></span>
												{device.name}
											</div>
											<div className="device-details">
												ID: {device.id} | {device.serialNumber || 'N/A'}
											</div>
											{device.currentlyPlaying && (
												<div className="currently-playing">
													▶ {device.currentlyPlaying.title}
												</div>
											)}
										</div>
									</div>
								))
							)}
						</div>

						{totalPages > 1 && (
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={setCurrentPage}
								itemsPerPage={itemsPerPage}
								onItemsPerPageChange={(value) => {
									setItemsPerPage(value);
									setCurrentPage(1);
								}}
							/>
						)}
					</div>
				</div>

				<div className="live-relay-right">
					{!selectedDevice ? (
						<div className="empty-state-panel">
							<div className="empty-icon">📡</div>
							<h3>Select a Device</h3>
							<p>Choose an online device from the left to view its schedule and live playback</p>
						</div>
					) : loading ? (
						<div className="loading-state">Loading device information...</div>
					) : error ? (
						<div className="error-state">{error}</div>
					) : (
						<>
							<div className="device-details-card">
								<h2>{selectedDevice.name}</h2>
								<div className="detail-row">
									<span className="label">Device ID:</span>
									<span className="value">{selectedDevice.id}</span>
								</div>
								<div className="detail-row">
									<span className="label">Serial Number:</span>
									<span className="value">{selectedDevice.serialNumber || 'N/A'}</span>
								</div>
								<div className="detail-row">
									<span className="label">IP Address:</span>
									<span className="value">{selectedDevice.ipAddress || 'N/A'}</span>
								</div>
								<div className="detail-row">
									<span className="label">Status:</span>
									<span className="value status-badge online">
										<span className="status-dot online"></span>
										Online
									</span>
								</div>
							</div>

							{deviceSchedule ? (
								<div className="schedule-card">
									<div className="live-relay-card-header">
										<h3>📅 Playback Schedule</h3>
										<button
											className="view-play-order-btn"
											onClick={handleViewPlayOrder}
											disabled={playOrderLoading || scheduledJingles.length === 0}
										>
											{playOrderLoading ? 'Loading…' : 'View Order of Play'}
										</button>
									</div>
									<div className="schedule-time">
										<span>
											{deviceSchedule.playbackWindowStart || '—'} - {deviceSchedule.playbackWindowEnd || '—'}
										</span>
									</div>
								</div>
							) : (
								<div className="schedule-card">
									<h3>📅 Playback Schedule</h3>
									<div className="no-playback">No schedule configured from Send Ads module</div>
								</div>
							)}

							{currentPlayback && (
								<div className="current-playback-card">
									<h3>🎵 Current Playback</h3>
									{currentPlayback.currentJingle ? (
										<>
											<div className="playback-info">
												<div className="jingle-title">{currentPlayback.currentJingle.title}</div>
												<div className="playback-status">
													{currentPlayback.isPlaying ? '▶ Playing' : '⏸ Paused'}
												</div>
												{currentPlayback.duration ? (
													<div className="playback-meta">Duration: {formatDuration(currentPlayback.duration)}</div>
												) : null}
											</div>
											<div className="playback-controls">
												{isPlaying ? (
													<button className="control-button stop" onClick={handleStopAudio}>
														⏹ Stop Listening
													</button>
												) : (
													<button className="control-button play" onClick={handlePlayLiveAudio} disabled={isAudioLoading}>
														{isAudioLoading ? '⏳ Loading…' : '🎧 Listen Live'}
													</button>
												)}
											</div>
										</>
									) : (
										<div className="no-playback">No active playback</div>
									)}
								</div>
							)}

							{playOrderSequence.length > 0 && (
								<div className="play-order-card">
									<h3>🔄 Play Order</h3>
									{playOrderMeta ? (
										<div className="play-order-summary-grid">
											<div>
												<div className="summary-label">Ads per Loop</div>
												<div className="summary-value">{playOrderMeta.totalAds ?? playOrderSequence.length}</div>
											</div>
											{playOrderMeta.gcd ? (
												<div>
													<div className="summary-label">GCD</div>
													<div className="summary-value">{playOrderMeta.gcd}</div>
												</div>
											) : null}
										</div>
									) : null}
									<div className="play-order-list">
										{playOrderSequence.map((item, index) => (
											<div key={index} className="play-order-item">
												<span className="order-number">{index + 1}</span>
												<span className="order-jingle">{item.title}</span>
											</div>
										))}
									</div>
									<div className="play-order-footer">
										Total: {playOrderSequence.length} jingles in loop
									</div>
								</div>
							)}

							{scheduledJingles.length > 0 && (
								<div className="scheduled-jingles-card">
									<h3>📋 Scheduled Jingles</h3>
									<table className="jingles-table">
										<thead>
											<tr>
												<th>Title</th>
												<th>Duration</th>
												<th>Daily Spots</th>
												<th>Schedule</th>
												<th>Status</th>

												<th>Listen</th>
											</tr>
										</thead>
										<tbody>
											{scheduledJingles.map((jingle) => (
												<tr key={jingle.id}>
													<td>{jingle.title}</td>
													<td>{formatDuration(jingle.duration)}</td>
													<td>{jingle.spots ? `${jingle.spots}x/day` : '—'}</td>
													<td>{formatDateRange(jingle.startDate, jingle.endDate)}</td>
													<td>
														<span className={`status-pill ${jingle.isActive ? 'active' : 'paused'}`}>
															{jingle.isActive ? 'Active' : 'Paused'}
														</span>
													</td>
													<td>
														<button
															className="play-jingle-btn"
															onClick={() => handlePlayJingle(jingle)}
															title="Listen to this jingle"
														>
															▶️
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{playOrderModalOpen && (
				<PlayOrderModal
					playOrder={playOrderModalData}
					onClose={() => {
						setPlayOrderModalOpen(false);
						setPlayOrderModalData(null);
					}}
				/>
			)}
		</div>
	);
};

export default LiveRelay;
