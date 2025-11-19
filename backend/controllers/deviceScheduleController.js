const { DeviceSchedule, DeviceScheduleJingle, Device, Jingle } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { Op } = require('sequelize');
const socketService = require('../services/socketService');
const { generateAdPlayOrder } = require('../utils/helpers');

/**
 * Regenerate play order for a device schedule using GCD algorithm
 * @param {number} deviceScheduleId - The device schedule ID
 */
const regeneratePlayOrder = async (deviceScheduleId) => {
	const schedule = await DeviceSchedule.findByPk(deviceScheduleId, {
		include: [
			{
				model: DeviceScheduleJingle,
				as: 'jingles',
				where: {
					isActive: true,
				},
				required: false,
				include: [
					{
						model: Jingle,
						as: 'jingle',
						attributes: ['id', 'title', 'filename', 'fileName', 'durationSeconds'],
					},
				],
			},
		],
	});

	if (!schedule) {
		return null;
	}

	// Build jingle data for GCD algorithm
	const jinglesData = schedule.jingles.map(sj => ({
		id: sj.jingle.id,
		title: sj.jingle.title,
		filename: sj.jingle.filename || sj.jingle.fileName,
		spots: sj.spots,
		durationSeconds: sj.jingle.durationSeconds,
	}));

	// Generate play order using GCD algorithm
	const playOrderData = generateAdPlayOrder(jinglesData);

	// Update the schedule with the new play order
	schedule.playOrder = playOrderData;
	await schedule.save();

	console.log(`[deviceScheduleController] Regenerated play order for schedule ${deviceScheduleId}:`, {
		loops: playOrderData.loops,
		gcd: playOrderData.gcd,
		totalAds: playOrderData.totalAds,
		adCounts: playOrderData.adCounts,
	});

	return playOrderData;
};

// Get all device schedules with their jingles
const listDeviceSchedules = asyncHandler(async (req, res) => {
	const schedules = await DeviceSchedule.findAll({
		include: [
			{
				model: Device,
				as: 'device',
				attributes: ['id', 'name', 'serialNumber', 'status', 'location'],
			},
			{
				model: DeviceScheduleJingle,
				as: 'jingles',
				include: [
					{
						model: Jingle,
						as: 'jingle',
						attributes: ['id', 'title', 'fileName', 'durationSeconds'],
					},
				],
			},
		],
		order: [['createdAt', 'DESC']],
	});

	res.json(schedules);
});

// Get schedule for a specific device
const getDeviceSchedule = asyncHandler(async (req, res) => {
	const { deviceId } = req.params;

	const schedule = await DeviceSchedule.findOne({
		where: { deviceId },
		include: [
			{
				model: Device,
				as: 'device',
				attributes: ['id', 'name', 'serialNumber', 'status', 'location'],
			},
			{
				model: DeviceScheduleJingle,
				as: 'jingles',
				include: [
					{
						model: Jingle,
						as: 'jingle',
						attributes: ['id', 'title', 'fileName', 'durationSeconds'],
					},
				],
			},
		],
	});

	if (!schedule) {
		res.status(404);
		throw new Error('No schedule found for this device');
	}

	res.json(schedule);
});

// Create or update device schedule
const createOrUpdateDeviceSchedule = asyncHandler(async (req, res) => {
	const { deviceId, playbackWindowStart, playbackWindowEnd, isActive, notes } = req.body;

	if (!deviceId || !playbackWindowStart || !playbackWindowEnd) {
		res.status(400);
		throw new Error('deviceId, playbackWindowStart, and playbackWindowEnd are required');
	}

	// Verify device exists
	const device = await Device.findByPk(deviceId);
	if (!device) {
		res.status(404);
		throw new Error('Device not found');
	}

	// Check if schedule already exists for this device
	let schedule = await DeviceSchedule.findOne({ where: { deviceId } });

	if (schedule) {
		// Update existing schedule
		schedule.playbackWindowStart = playbackWindowStart;
		schedule.playbackWindowEnd = playbackWindowEnd;
		schedule.isActive = isActive !== undefined ? isActive : schedule.isActive;
		schedule.notes = notes !== undefined ? notes : schedule.notes;
		await schedule.save();
	} else {
		// Create new schedule
		schedule = await DeviceSchedule.create({
			deviceId,
			playbackWindowStart,
			playbackWindowEnd,
			isActive: isActive !== undefined ? isActive : true,
			notes,
		});
	}

	// Reload with associations
	const fullSchedule = await DeviceSchedule.findByPk(schedule.id, {
		include: [
			{
				model: Device,
				as: 'device',
				attributes: ['id', 'name', 'serialNumber', 'status', 'location'],
			},
			{
				model: DeviceScheduleJingle,
				as: 'jingles',
				include: [
					{
						model: Jingle,
						as: 'jingle',
						attributes: ['id', 'title', 'fileName', 'durationSeconds'],
					},
				],
			},
		],
	});

	// Broadcast schedule update to the device
	await socketService.broadcastScheduleUpdate();

	res.status(schedule ? 200 : 201).json(fullSchedule);
});

// Add jingle to device schedule
const addJingleToSchedule = asyncHandler(async (req, res) => {
	const { deviceScheduleId, jingleId, startDate, endDate, percentage, spots, isActive, notes } = req.body;

	if (!deviceScheduleId || !jingleId || !startDate || !endDate) {
		res.status(400);
		throw new Error('deviceScheduleId, jingleId, startDate, and endDate are required');
	}

	// Verify device schedule exists
	const schedule = await DeviceSchedule.findByPk(deviceScheduleId);
	if (!schedule) {
		res.status(404);
		throw new Error('Device schedule not found');
	}

	// Verify jingle exists
	const jingle = await Jingle.findByPk(jingleId);
	if (!jingle) {
		res.status(404);
		throw new Error('Jingle not found');
	}

	// Create the schedule jingle entry
	const scheduleJingle = await DeviceScheduleJingle.create({
		deviceScheduleId,
		jingleId,
		startDate,
		endDate,
		spots: (spots !== undefined ? spots : (percentage !== undefined ? percentage : 1)),
		isActive: isActive !== undefined ? isActive : true,
		notes,
	});

	// Reload with jingle details
	const fullScheduleJingle = await DeviceScheduleJingle.findByPk(scheduleJingle.id, {
		include: [
			{
				model: Jingle,
				as: 'jingle',
				attributes: ['id', 'title', 'fileName', 'durationSeconds'],
			},
		],
	});

	// Regenerate play order for the device schedule
	await regeneratePlayOrder(deviceScheduleId);

	// Broadcast schedule update to the device
	await socketService.broadcastScheduleUpdate();

	res.status(201).json(fullScheduleJingle);
});

// Add jingle to multiple devices
const addJingleToMultipleDevices = asyncHandler(async (req, res) => {
	const { deviceIds, jingles } = req.body;

	if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
		res.status(400);
		throw new Error('deviceIds array is required and must not be empty');
	}

	if (!jingles || !Array.isArray(jingles) || jingles.length === 0) {
		res.status(400);
		throw new Error('jingles array is required and must not be empty');
	}

	// Validate each jingle has required fields
	for (const jingleData of jingles) {
		if (!jingleData.jingleId || !jingleData.startDate || !jingleData.endDate) {
			res.status(400);
			throw new Error('Each jingle must have jingleId, startDate, and endDate');
		}
	}

	// Verify all jingles exist
	const jingleIds = jingles.map(j => j.jingleId);
	const foundJingles = await Jingle.findAll({
		where: { id: { [Op.in]: jingleIds } }
	});

	if (foundJingles.length !== jingleIds.length) {
		res.status(404);
		throw new Error('One or more jingles not found');
	}

	// Check which devices have schedules
	const deviceSchedules = await DeviceSchedule.findAll({
		where: { deviceId: { [Op.in]: deviceIds } },
		include: [
			{
				model: Device,
				as: 'device',
				attributes: ['id', 'name', 'serialNumber'],
			},
		],
	});

	const devicesWithSchedules = deviceSchedules.map((s) => s.deviceId);
	const devicesWithoutSchedules = deviceIds.filter((id) => !devicesWithSchedules.includes(id));

	// If any devices don't have schedules, return error
	if (devicesWithoutSchedules.length > 0) {
		const devicesInfo = await Device.findAll({
			where: { id: { [Op.in]: devicesWithoutSchedules } },
			attributes: ['id', 'name', 'serialNumber'],
		});

		const deviceNames = devicesInfo.map((d) => d.name || d.serialNumber).join(', ');
		res.status(400);
		throw new Error(
			`The following devices do not have schedule time configured: ${deviceNames}. Please configure schedule time from Send Ads module first.`
		);
	}

	// Add all jingles to all devices with schedules
	const results = [];
	for (const schedule of deviceSchedules) {
		for (const jingleData of jingles) {
			const scheduleJingle = await DeviceScheduleJingle.create({
				deviceScheduleId: schedule.id,
				jingleId: jingleData.jingleId,
				startDate: jingleData.startDate,
				endDate: jingleData.endDate,
				spots: (jingleData.spots !== undefined ? jingleData.spots : (jingleData.percentage !== undefined ? jingleData.percentage : 1)),
				isActive: jingleData.isActive !== undefined ? jingleData.isActive : true,
			});

			results.push({
				deviceId: schedule.deviceId,
				deviceName: schedule.device.name || schedule.device.serialNumber,
				jingleId: jingleData.jingleId,
				scheduleJingleId: scheduleJingle.id,
			});
		}

		// Regenerate play order once per device after adding all jingles
		await regeneratePlayOrder(schedule.id);
	}

	// Broadcast schedule update to all devices
	await socketService.broadcastScheduleUpdate();

	res.status(201).json({
		message: `Successfully added ${jingles.length} jingle(s) to ${deviceSchedules.length} device(s)`,
		results,
	});
});

// Update jingle in schedule
const updateScheduleJingle = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { startDate, endDate, percentage, spots, isActive, notes } = req.body;

	const scheduleJingle = await DeviceScheduleJingle.findByPk(id);
	if (!scheduleJingle) {
		res.status(404);
		throw new Error('Schedule jingle not found');
	}

	if (startDate !== undefined) scheduleJingle.startDate = startDate;
	if (endDate !== undefined) scheduleJingle.endDate = endDate;
	if (spots !== undefined) scheduleJingle.spots = spots;
	if (percentage !== undefined) scheduleJingle.spots = percentage;
	if (isActive !== undefined) scheduleJingle.isActive = isActive;
	if (notes !== undefined) scheduleJingle.notes = notes;

	await scheduleJingle.save();

	// Reload with jingle details
	const updated = await DeviceScheduleJingle.findByPk(id, {
		include: [
			{
				model: Jingle,
				as: 'jingle',
				attributes: ['id', 'title', 'fileName', 'durationSeconds'],
			},
		],
	});

	// Regenerate play order for the device schedule
	await regeneratePlayOrder(scheduleJingle.deviceScheduleId);

	// Broadcast schedule update to the device
	await socketService.broadcastScheduleUpdate();

	res.json(updated);
});

// Remove jingle from schedule
const removeJingleFromSchedule = asyncHandler(async (req, res) => {
	const { id } = req.params;

	console.log(`[removeJingle] Attempting to remove jingle schedule ID: ${id}`);

	const scheduleJingle = await DeviceScheduleJingle.findByPk(id);
	if (!scheduleJingle) {
		console.log(`[removeJingle] Schedule jingle not found: ${id}`);
		res.status(404);
		throw new Error('Schedule jingle not found');
	}

	console.log(`[removeJingle] Found jingle schedule:`, scheduleJingle.toJSON());
	
	const deviceScheduleId = scheduleJingle.deviceScheduleId;
	
	await scheduleJingle.destroy();
	
	console.log(`[removeJingle] Successfully deleted jingle schedule ID: ${id}`);
	
	// Regenerate play order for the device schedule
	await regeneratePlayOrder(deviceScheduleId);
	
	// Broadcast schedule update to the device
	await socketService.broadcastScheduleUpdate();
	
	res.json({ message: 'Jingle removed from schedule successfully' });
});

// Delete device schedule
const deleteDeviceSchedule = asyncHandler(async (req, res) => {
	const { id } = req.params;

	const schedule = await DeviceSchedule.findByPk(id);
	if (!schedule) {
		res.status(404);
		throw new Error('Device schedule not found');
	}

	await schedule.destroy();
	res.json({ message: 'Device schedule deleted successfully' });
});

// Get active jingles for a device (used by Android client)
const getActiveJinglesForDevice = asyncHandler(async (req, res) => {
	const { deviceId } = req.params;
	const today = new Date();

	const schedule = await DeviceSchedule.findOne({
		where: { 
			deviceId,
			isActive: true,
		},
		include: [
			{
				model: DeviceScheduleJingle,
				as: 'jingles',
				where: {
					isActive: true,
					startDate: { [Op.lte]: today },
					endDate: { [Op.gte]: today },
				},
				required: false,
				include: [
					{
						model: Jingle,
						as: 'jingle',
					},
				],
			},
		],
	});

	if (!schedule) {
		res.json({
			playbackWindowStart: null,
			playbackWindowEnd: null,
			jingles: [],
		});
		return;
	}

	res.json({
		playbackWindowStart: schedule.playbackWindowStart,
		playbackWindowEnd: schedule.playbackWindowEnd,
		jingles: schedule.jingles.map((sj) => ({
			id: sj.jingle.id,
			title: sj.jingle.title,
			filename: sj.jingle.filename,
			duration: sj.jingle.durationSeconds,
			spots: sj.spots,
			url: `${req.protocol}://${req.get('host')}/uploads/jingles/${sj.jingle.filename}`,
		})),
	});
});

// Get play order preview for a device schedule
const getPlayOrderPreview = asyncHandler(async (req, res) => {
	const { deviceId } = req.params;

	const schedule = await DeviceSchedule.findOne({
		where: { deviceId },
		include: [
			{
				model: DeviceScheduleJingle,
				as: 'jingles',
				where: {
					isActive: true,
				},
				required: false,
				include: [
					{
						model: Jingle,
						as: 'jingle',
						attributes: ['id', 'title', 'filename', 'fileName', 'durationSeconds'],
					},
				],
			},
		],
	});

	if (!schedule) {
		res.status(404);
		throw new Error('No schedule found for this device');
	}

	// If playOrder is already cached, return it
	if (schedule.playOrder) {
		res.json(schedule.playOrder);
		return;
	}

	// Otherwise, generate it on the fly
	const jinglesData = schedule.jingles.map(sj => ({
		id: sj.jingle.id,
		title: sj.jingle.title,
		filename: sj.jingle.filename || sj.jingle.fileName,
		spots: sj.spots,
		durationSeconds: sj.jingle.durationSeconds,
	}));

	const playOrderData = generateAdPlayOrder(jinglesData);
	res.json(playOrderData);
});

module.exports = {
	listDeviceSchedules,
	getDeviceSchedule,
	createOrUpdateDeviceSchedule,
	addJingleToSchedule,
	addJingleToMultipleDevices,
	updateScheduleJingle,
	removeJingleFromSchedule,
	deleteDeviceSchedule,
	getActiveJinglesForDevice,
	getPlayOrderPreview,
};
