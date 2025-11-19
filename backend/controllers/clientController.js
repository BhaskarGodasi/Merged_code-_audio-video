const { Brand, Campaign, Log, Jingle, Device, Company } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// List all brands with aggregate stats
const listClients = asyncHandler(async (req, res) => {
	const where = {};
	if (req.user && req.user.role === 'client' && req.user.brandId) {
		where.id = req.user.brandId;
	}
	if (req.query.companyId) {
		where.companyId = Number(req.query.companyId);
	}

	const clients = await Brand.findAll({
		where,
		include: [
			{
				model: Campaign,
				as: 'campaigns',
				attributes: [],
			},
			{
				model: Company,
				as: 'company',
				attributes: ['id', 'name'],
			},
		],
		attributes: {
				include: [
					[
						sequelize.literal(`(
							SELECT COUNT(*)
							FROM campaigns
							WHERE campaigns.brandId = Brand.id
						)`),
						'totalCampaigns',
					],
					[
						sequelize.literal(`(
							SELECT COUNT(*)
							FROM campaigns
							WHERE campaigns.brandId = Brand.id
							AND campaigns.status = 'active'
						)`),
						'activeCampaigns',
					],
					[
						sequelize.literal(`(
							SELECT COUNT(DISTINCT logs.id)
							FROM logs
							WHERE logs.jingleId IN (
								SELECT DISTINCT campaign_jingles.jingleId
								FROM campaign_jingles
								JOIN campaigns ON campaign_jingles.campaignId = campaigns.id
								WHERE campaigns.brandId = Brand.id
							)
						)`),
						'totalPlays',
					],
				],
			},
		order: [['createdAt', 'DESC']],
	});

	// Format the response to ensure numeric values
	const formattedClients = clients.map(client => {
		const clientData = client.get({ plain: true });
		const totalPlays = parseInt(clientData.totalPlays || 0, 10);

		return {
			...clientData,
			totalCampaigns: parseInt(clientData.totalCampaigns || 0, 10),
			activeCampaigns: parseInt(clientData.activeCampaigns || 0, 10),
			totalPlays: totalPlays,
		};
	});

	res.json(formattedClients);
});

// Get single brand by ID
const getClientById = asyncHandler(async (req, res) => {
	const client = await Brand.findByPk(req.params.id, {
		include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
	});

	if (!client) {
		return res.status(404).json({ error: true, message: 'Client not found' });
	}

	res.json(client);
});

// Get detailed brand analytics
const getClientAnalytics = asyncHandler(async (req, res) => {
	const brandId = req.params.id;

	const client = await Brand.findByPk(brandId);
	if (!client) {
		return res.status(404).json({ error: true, message: 'Client not found' });
	}

	// Get all campaigns for this brand (with associated jingles)
	const campaigns = await Campaign.findAll({
		where: { brandId },
		include: [
			{
				model: Jingle,
				as: 'jingles',
				attributes: ['id', 'title', 'filePath'],
			},
		],
		order: [['createdAt', 'DESC']],
	});

	// Get active and total campaign counts
	const activeCampaigns = campaigns.filter((c) => c.status === 'active');
	const totalCampaigns = campaigns.length;

	// Get playback logs for all campaigns of this brand
	const campaignIds = campaigns.map((c) => c.id);
	// Collect unique jingle IDs across all campaigns for this client
	const jingleIds = Array.from(new Set(campaigns.flatMap((c) => (c.jingles || []).map(j => j.id))));

	let totalPlays = 0;
	let campaignPlayStats = [];
	let devicePlayStats = [];

	if (jingleIds.length > 0) {
		// Get total plays for all jingles used in client's campaigns
		const playCountResult = await Log.count({
			where: {
				jingleId: { 
					[Op.in]: jingleIds
				},
			},
		});
		totalPlays = playCountResult;
		
		console.log(`[Brand Analytics ${brandId}] Jingle IDs: ${jingleIds.join(', ')}, Total Plays: ${totalPlays}`);

		// Get playback stats per jingle (grouped by campaign)
		const jingleStats = await Log.findAll({
			where: {
				jingleId: { [Op.in]: jingleIds },
			},
			include: [
				{
					model: Jingle,
					as: 'jingle',
					attributes: ['id', 'title'],
				},
			],
			attributes: [
				'jingleId',
				[sequelize.fn('COUNT', sequelize.col('Log.id')), 'playCount'],
			],
			group: ['jingleId', 'jingle.id'],
		});

		// Map jingle stats to campaigns: sum play counts of all jingles belonging to each campaign
		const jingleCountMap = {};
		jingleStats.forEach(stat => {
			const id = stat.jingleId;
			jingleCountMap[id] = parseInt(stat.get('playCount'), 10);
		});

		campaignPlayStats = campaigns.map(campaign => {
			const campaignJingleIds = (campaign.jingles || []).map(j => j.id);
			const playCount = campaignJingleIds.reduce((acc, jid) => acc + (jingleCountMap[jid] || 0), 0);
			return {
				campaignId: campaign.id,
				campaignName: campaign.campaignName,
				jingleIds: campaignJingleIds,
				playCount,
			};
		});

		// Get playback stats per device (for jingles used by this client)
		const deviceStats = await Log.findAll({
			where: {
				jingleId: { [Op.in]: jingleIds },
			},
			include: [
				{
					model: Device,
					as: 'device',
					attributes: ['id', 'name', 'location'],
				},
			],
			attributes: [
				'deviceId',
				[sequelize.fn('COUNT', sequelize.col('Log.id')), 'playCount'],
			],
			group: ['deviceId', 'device.id'],
		});

		devicePlayStats = deviceStats.map((stat) => ({
			deviceId: stat.deviceId,
			deviceName: stat.device?.name || 'Unknown',
			deviceLocation: stat.device?.location || 'Unknown',
			playCount: parseInt(stat.get('playCount'), 10),
		}));
	}

	res.json({
		client: client.get({ plain: true }),
		campaigns: campaigns.map((c) => c.get({ plain: true })),
		stats: {
			totalCampaigns,
			activeCampaigns: activeCampaigns.length,
			totalPlays,
		},
		campaignPlayStats,
		devicePlayStats,
	});
});

// Create new client
const createClient = asyncHandler(async (req, res) => {
	const payload = {
		name: req.body.name,
		contactPerson: req.body.contactPerson || null,
		email: req.body.email || null,
		phone: req.body.phone || null,
		status: req.body.status || 'active',
		companyId: req.body.companyId || null,
	};

	const client = await Brand.create(payload);

	res.status(201).json(client.get({ plain: true }));
});

// Update client
const updateClient = asyncHandler(async (req, res) => {
	const client = await Brand.findByPk(req.params.id);

	if (!client) {
		return res.status(404).json({ error: true, message: 'Client not found' });
	}

	const payload = {
		name: req.body.name ?? client.name,
		contactPerson: req.body.contactPerson ?? client.contactPerson,
		email: req.body.email ?? client.email,
		phone: req.body.phone ?? client.phone,
		status: req.body.status ?? client.status,
		companyId: req.body.companyId ?? client.companyId,
	};

	await client.update(payload);

	res.json(client.get({ plain: true }));
});

// Delete client
const deleteClient = asyncHandler(async (req, res) => {
	const client = await Brand.findByPk(req.params.id);

	if (!client) {
		return res.status(404).json({ error: true, message: 'Client not found' });
	}

	// Check if client has associated campaigns
	const campaignCount = await Campaign.count({
		where: { brandId: req.params.id },
	});

	if (campaignCount > 0) {
		return res.status(400).json({
			error: true,
			message: `Cannot delete client with ${campaignCount} associated campaigns. Please reassign or delete campaigns first.`,
		});
	}

	await client.destroy();

	res.json({ message: 'Client deleted successfully' });
});

module.exports = {
	listClients,
	getClientById,
	getClientAnalytics,
	createClient,
	updateClient,
	deleteClient,
};
