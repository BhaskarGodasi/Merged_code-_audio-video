const { validationResult } = require('express-validator');
const { Device, Jingle, AudioCampaign, Log } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { generatePairingCode } = require('../utils/helpers');
const socketService = require('../services/socketService');
const { Op } = require('sequelize');

const listDevices = asyncHandler(async (req, res) => {
	let whereClause = {};
	
	// For client users, show only devices that have played their campaigns
	if (req.user && req.user.role === 'client' && req.user.brandId) {
		// Get all campaigns for this client
		const clientCampaigns = await AudioCampaign.findAll({
			where: { brandId: req.user.brandId },
			attributes: ['id']
		});
		
		const campaignIds = clientCampaigns.map(c => c.id);
		
		if (campaignIds.length > 0) {
			// Get device IDs that have logs for these campaigns
			const deviceLogs = await Log.findAll({
				where: { campaignId: { [Op.in]: campaignIds } },
				attributes: ['deviceId'],
				group: ['deviceId']
			});
			
			const deviceIds = [...new Set(deviceLogs.map(log => log.deviceId))];
			
			if (deviceIds.length > 0) {
				whereClause.id = { [Op.in]: deviceIds };
			} else {
				// No devices found, return empty array
				whereClause.id = -1;
			}
		} else {
			// No campaigns found, return empty array
			whereClause.id = -1;
		}
	}
	
	const devices = await Device.findAll({ 
		where: whereClause,
		order: [['createdAt', 'DESC']] 
	});
	res.json(devices.map((device) => device.get({ plain: true })));
});

const createDevice = asyncHandler(async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ error: true, message: 'Validation failed', details: errors.array() });
	}

	const pairingCode = generatePairingCode();
	const device = await Device.create({
		name: req.body.name || null,
		location: req.body.location || null,
		pairingCode,
		serialNumber: req.body.serialNumber,
		status: 'offline',
	});

	res.status(201).json(device.get({ plain: true }));
});

const getDeviceById = asyncHandler(async (req, res) => {
		const device = await Device.findByPk(req.params.id, {
			include: [
				{
					model: Log,
					as: 'logs',
					separate: true,
					limit: 20,
					order: [['createdAt', 'DESC']],
					include: [
						{ model: AudioCampaign, as: 'audiocampaign' },
						{ model: Jingle, as: 'jingle' },
					],
				},
			],
		});

	if (!device) {
		return res.status(404).json({ error: true, message: 'Device not found' });
	}

	res.json(device.get({ plain: true }));
});

const verifyPairingCode = asyncHandler(async (req, res) => {
	const code = (req.params.code || '').trim().toUpperCase();

	if (!code) {
		return res.status(400).json({ error: true, message: 'Pairing code is required' });
	}

	const device = await Device.findOne({ where: { pairingCode: code } });

	if (!device) {
		return res.status(404).json({ error: true, message: 'Pairing code not found' });
	}

	res.json({
		id: device.id,
		name: device.name,
		location: device.location,
		alreadyPaired: Boolean(device.isPaired),
		serialNumber: device.serialNumber,
		status: device.status,
		lastSeenAt: device.lastSeenAt,
	});
});

const updateDeviceStatus = asyncHandler(async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ error: true, message: 'Validation failed', details: errors.array() });
	}

	const device = await Device.findByPk(req.params.id);
	if (!device) {
		return res.status(404).json({ error: true, message: 'Device not found' });
	}

	device.status = req.body.status || device.status;
	device.volumeLevel = req.body.volumeLevel ?? device.volumeLevel;
	device.location = req.body.location ?? device.location;
	device.notes = req.body.notes ?? device.notes;

	await device.save();

	res.json(device.get({ plain: true }));
});

const dispatchPlayCommand = asyncHandler(async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ error: true, message: 'Validation failed', details: errors.array() });
	}

	const device = await Device.findByPk(req.params.id);
	if (!device) {
		return res.status(404).json({ error: true, message: 'Device not found' });
	}

	const { campaignId, jingleId } = req.body;
	const campaign = await AudioCampaign.findByPk(campaignId);
	const jingle = await Jingle.findByPk(jingleId);

	if (!campaign || !jingle) {
		return res.status(400).json({ error: true, message: 'Campaign and Jingle are required' });
	}

	await socketService.emitToDevice(device.id, 'playback:trigger', {
		campaignId,
		jingle: jingle.get({ plain: true }),
	});

	res.json({ success: true });
});

const repairDevice = asyncHandler(async (req, res) => {
	const device = await Device.findByPk(req.params.id);
	if (!device) {
		return res.status(404).json({ error: true, message: 'Device not found' });
	}

	// Generate new pairing code
	const newPairingCode = generatePairingCode();

	// Unpair the device and assign new pairing code
	device.isPaired = false;
	device.pairingCode = newPairingCode;
	device.pairedAt = null;
	device.status = 'offline';
	device.lastSeenAt = null;

	await device.save();

	// Disconnect the device from socket if connected
	socketService.disconnectDevice(device.id);

	res.json({
		success: true,
		message: 'Device unpaired successfully',
		device: device.get({ plain: true }),
	});
});

const deleteDevice = asyncHandler(async (req, res) => {
	const device = await Device.findByPk(req.params.id);
	if (!device) {
		return res.status(404).json({ error: true, message: 'Device not found' });
	}

	await device.destroy();

	res.json({ success: true });
});

const controlPlayback = asyncHandler(async (req, res) => {
	const deviceId = Number(req.params.id);
	const { action } = req.body;

	const device = await Device.findByPk(deviceId);
	if (!device) {
		return res.status(404).json({ error: true, message: 'Device not found' });
	}

	const socketService = require('../services/socketService');
	const emitted = socketService.emitToDevice(deviceId, 'playback:control', { action });

	if (!emitted) {
		return res.status(404).json({ error: true, message: 'Device not connected' });
	}

	res.json({ success: true, message: `Playback ${action} command sent` });
});

module.exports = {
	listDevices,
	createDevice,
	getDeviceById,
	verifyPairingCode,
	updateDeviceStatus,
	dispatchPlayCommand,
	controlPlayback,
	repairDevice,
	deleteDevice,
};
