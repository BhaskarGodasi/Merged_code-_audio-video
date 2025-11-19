const { validationResult } = require('express-validator');
const { Campaign, Jingle, Brand, Log, CampaignJingle, Client, Company, DeviceSchedule, DeviceScheduleJingle, Device } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { campaignStatusFromDates } = require('../utils/helpers');
const scheduleService = require('../services/scheduleService');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

const listCampaigns = asyncHandler(async (req, res) => {
	// Build where clause based on user role
	const whereClause = {};
	if (req.user && req.user.role === 'client' && req.user.brandId) {
		whereClause.brandId = req.user.brandId;
	}

	const campaigns = await Campaign.findAll({
		where: whereClause,
		include: [
			{ model: Jingle, as: 'jingles' },
			{ model: Brand, as: 'brand', attributes: ['id', 'name'] },
		],
		order: [['createdAt', 'DESC']],
	});

	// Calculate play count for each campaign based on all its jingles
	const payload = await Promise.all(campaigns.map(async (campaign) => {
		const item = campaign.get({ plain: true });
		item.status = campaignStatusFromDates(item.startDate, item.endDate);
		
		// Get all jingle IDs for this campaign
		const jingleIds = item.jingles && item.jingles.length > 0 
			? item.jingles.map(j => j.id) 
			: [];
		
		// Count plays for all jingles
		if (jingleIds.length > 0) {
			const playCount = await Log.count({
				where: {
					jingleId: { [Op.in]: jingleIds }
				}
			});
			item.playCount = playCount;
		} else {
			item.playCount = 0;
		}
		
		return item;
	}));

	res.json(payload);
});

const getCampaignById = asyncHandler(async (req, res) => {
	const campaign = await Campaign.findByPk(req.params.id, {
		include: [
			{ model: Jingle, as: 'jingles' },
			{ model: Brand, as: 'brand', attributes: ['id', 'name', 'contactPerson', 'email', 'phone'], include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }] },
		],
	});

	if (!campaign) {
		return res.status(404).json({ error: true, message: 'Campaign not found' });
	}

	const item = campaign.get({ plain: true });
	item.status = campaignStatusFromDates(item.startDate, item.endDate);

	res.json(item);
});

// Get detailed campaign analytics with device-level jingle data
const getCampaignAnalytics = asyncHandler(async (req, res) => {
	const campaignId = req.params.id;

	const campaign = await Campaign.findByPk(campaignId, {
		include: [
			{ 
				model: Jingle, 
				as: 'jingles',
				attributes: ['id', 'title', 'filePath', 'uploadDate']
			},
			{ 
				model: Brand, 
				as: 'brand', 
				attributes: ['id', 'name', 'contactPerson', 'email', 'phone'],
				include: [{ 
					model: Company, 
					as: 'company', 
					attributes: ['id', 'name'] 
				}]
			},
		],
	});

	if (!campaign) {
		return res.status(404).json({ error: true, message: 'Campaign not found' });
	}

	const campaignData = campaign.get({ plain: true });
	campaignData.status = campaignStatusFromDates(campaignData.startDate, campaignData.endDate);

	// Get jingle IDs for this campaign
	const jingleIds = campaignData.jingles.map(j => j.id);
	
	// Get all devices playing campaign jingles with jingle-level details
	const deviceScheduleJingles = await DeviceScheduleJingle.findAll({
		where: {
			jingleId: { [Op.in]: jingleIds }
		},
		include: [
			{
				model: DeviceSchedule,
				as: 'schedule',
				attributes: ['id', 'deviceId'],
				include: [
					{
						model: Device,
						as: 'device',
						attributes: ['id', 'name', 'location', 'latitude', 'longitude']
					}
				]
			},
			{
				model: Jingle,
				as: 'jingle',
				attributes: ['id', 'title', 'uploadDate']
			}
		],
		attributes: ['id', 'jingleId', 'deviceScheduleId', 'spots']
	});

	// Group by device
	const deviceJingles = {};
	deviceScheduleJingles.forEach(dsj => {
		const device = dsj.schedule?.device;
		if (!device) return;

		if (!deviceJingles[device.id]) {
			deviceJingles[device.id] = {
				deviceId: device.id,
				deviceName: device.name,
				location: device.location,
				latitude: device.latitude,
				longitude: device.longitude,
				jingles: []
			};
		}

		deviceJingles[device.id].jingles.push({
			jingleId: dsj.jingle.id,
			jingleTitle: dsj.jingle.title,
			jingleCreatedOn: dsj.jingle.uploadDate,
			spots: dsj.spots
		});
	});

	// Get total play counts per jingle
	const jinglePlayCounts = await Log.count({
		where: {
			jingleId: { [Op.in]: jingleIds }
		},
		group: ['jingleId'],
		attributes: ['jingleId']
	});

	// Create a map of jingle play counts
	const playCountMap = {};
	jinglePlayCounts.forEach(item => {
		playCountMap[item.jingleId] = item.count || 0;
	});

	// Add play counts to jingles
	campaignData.jingles = campaignData.jingles.map(jingle => ({
		...jingle,
		playCount: playCountMap[jingle.id] || 0
	}));

	// Calculate total plays
	const totalPlays = Object.values(playCountMap).reduce((sum, count) => sum + count, 0);

	res.json({
		campaign: campaignData,
		devices: Object.values(deviceJingles),
		totalPlays,
		stats: {
			totalDevices: Object.keys(deviceJingles).length,
			totalJingles: jingleIds.length,
			totalPlays
		}
	});
});

const createCampaign = asyncHandler(async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ error: true, message: 'Validation failed', details: errors.array() });
	}

	// Validate that jingleIds is provided and not empty
	if (!req.body.jingleIds || !Array.isArray(req.body.jingleIds) || req.body.jingleIds.length === 0) {
		return res.status(400).json({ error: true, message: 'At least one jingle must be selected' });
	}

	// Accept brandId from request body
	const incomingBrandId = req.body.brandId;
	const payload = {
		brandId: incomingBrandId ? Number(incomingBrandId) : null,
		contactPerson: req.body.contactPerson,
		companyName: req.body.companyName || null,
		state: req.body.state || null,
		language: req.body.language || null,
		campaignName: req.body.campaignName,
		email: req.body.email,
		phone: req.body.phone,
		startDate: req.body.startDate,
		endDate: req.body.endDate,
	};

	payload.status = campaignStatusFromDates(payload.startDate, payload.endDate);

	const campaign = await Campaign.create(payload);

	// Set jingles for the campaign
	const jingleIds = req.body.jingleIds.map(id => Number(id));
	await campaign.setJingles(jingleIds);

	await scheduleService.syncCampaignStatuses();

	// Fetch campaign with jingles to return
	const created = await Campaign.findByPk(campaign.id, {
		include: [
			{ model: Jingle, as: 'jingles' },
			{ model: Client, as: 'client', attributes: ['id', 'name'] },
		],
	});

	res.status(201).json(created.get({ plain: true }));
});

const updateCampaign = asyncHandler(async (req, res) => {
	const campaign = await Campaign.findByPk(req.params.id);
	if (!campaign) {
		return res.status(404).json({ error: true, message: 'Campaign not found' });
	}

	const incomingBrandId = req.body.clientId !== undefined ? req.body.clientId : req.body.brandId;
	const payload = {
		brandId: incomingBrandId !== undefined ? (incomingBrandId ? Number(incomingBrandId) : null) : campaign.brandId,
		contactPerson: req.body.contactPerson ?? campaign.contactPerson,
		companyName: req.body.companyName ?? campaign.companyName,
		state: req.body.state ?? campaign.state,
		language: req.body.language ?? campaign.language,
		campaignName: req.body.campaignName ?? campaign.campaignName,
		email: req.body.email ?? campaign.email,
		phone: req.body.phone ?? campaign.phone,
		startDate: req.body.startDate ?? campaign.startDate,
		endDate: req.body.endDate ?? campaign.endDate,
	};

	payload.status = campaignStatusFromDates(payload.startDate, payload.endDate);

	await campaign.update(payload);

	// Update jingles if provided
	if (req.body.jingleIds !== undefined) {
		if (Array.isArray(req.body.jingleIds) && req.body.jingleIds.length > 0) {
			const jingleIds = req.body.jingleIds.map(id => Number(id));
			await campaign.setJingles(jingleIds);
		} else {
			// Clear all jingles if empty array provided
			await campaign.setJingles([]);
		}
	}

	await scheduleService.syncCampaignStatuses();

	const updated = await Campaign.findByPk(req.params.id, {
		include: [
			{ model: Jingle, as: 'jingles' },
			{ model: Client, as: 'client', attributes: ['id', 'name'] },
		],
	});

	res.json(updated.get({ plain: true }));
});

const deleteCampaign = asyncHandler(async (req, res) => {
	const campaign = await Campaign.findByPk(req.params.id);
	if (!campaign) {
		return res.status(404).json({ error: true, message: 'Campaign not found' });
	}

	await campaign.destroy();
	await scheduleService.syncCampaignStatuses();

	res.json({ success: true });
});

module.exports = {
	listCampaigns,
	getCampaignById,
	getCampaignAnalytics,
	createCampaign,
	updateCampaign,
	deleteCampaign,
};
