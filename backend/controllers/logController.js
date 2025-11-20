const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { Log, Device, AudioCampaign, Jingle, CampaignJingle } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { buildLogsWorkbookBuffer } = require('../utils/excelExport');
const {
	selectCampaignForPlayback,
	fetchCampaignsForJingleIds,
	resolveCampaignForJingle,
} = require('../utils/logAttribution');

const buildFilters = async (query) => {
	const filters = {};

	// (no-op) incoming query is available for debugging when needed
	
	// Support filtering by device name
	if (query.deviceName) {
		const devices = await Device.findAll({
			where: {
				[Op.or]: [
					{ name: { [Op.like]: `%${query.deviceName}%` } },
					{ serialNumber: { [Op.like]: `%${query.deviceName}%` } }
				]
			}
		});
		if (devices.length > 0) {
			filters.deviceId = { [Op.in]: devices.map(d => d.id) };
		} else {
			// No matching devices, return filter that matches nothing
			filters.deviceId = -1;
		}
	}
	
	// Legacy support for deviceId
	if (query.deviceId) {
		const deviceId = Number(query.deviceId);
		if (!Number.isNaN(deviceId)) {
			filters.deviceId = deviceId;
		}
	}
	
	// Support filtering by campaign name (replaces campaignId filtering)
	if (query.campaignName) {
		const campaigns = await AudioCampaign.findAll({
			where: {
				campaignName: { [Op.like]: `%${query.campaignName}%` }
			}
		});
		if (campaigns.length > 0) {
			filters.campaignId = { [Op.in]: campaigns.map(c => c.id) };
		} else {
			// No matching campaigns, return filter that matches nothing
			filters.campaignId = -1;
		}
	}
	
	// Legacy support for campaignId
	if (query.campaignId) {
		const campaignId = Number(query.campaignId);
		if (!Number.isNaN(campaignId)) {
			filters.campaignId = campaignId;
		}
	}
	
	// Date filtering with support for daily, monthly, and date range modes
	if (query.dateMode) {
		filters.playbackAt = {};
		const now = new Date();
		
		switch (query.dateMode) {
			case 'daily':
				// Today's logs - from start of day to end of day
				if (query.date) {
					const selectedDate = new Date(query.date);
					const startOfDay = new Date(selectedDate);
					startOfDay.setHours(0, 0, 0, 0);
					const endOfDay = new Date(selectedDate);
					endOfDay.setHours(23, 59, 59, 999);
					filters.playbackAt[Op.gte] = startOfDay;
					filters.playbackAt[Op.lte] = endOfDay;
				}
				break;
				
			case 'monthly':
				// Monthly logs - from start of month to end of month
				if (query.month) {
					const [year, month] = query.month.split('-');
					const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
					const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
					filters.playbackAt[Op.gte] = startOfMonth;
					filters.playbackAt[Op.lte] = endOfMonth;
				}
				break;
				
			case 'range':
				// Date range - from date to to date
				if (query.from) {
					const fromDate = new Date(query.from);
					if (!Number.isNaN(fromDate.getTime())) {
						fromDate.setHours(0, 0, 0, 0);
						filters.playbackAt[Op.gte] = fromDate;
					}
				}
				if (query.to) {
					const toDate = new Date(query.to);
					if (!Number.isNaN(toDate.getTime())) {
						toDate.setHours(23, 59, 59, 999);
						filters.playbackAt[Op.lte] = toDate;
					}
				}
				break;
		}
		
		const hasPlaybackKeys = Object.keys(filters.playbackAt).length > 0 || Object.getOwnPropertySymbols(filters.playbackAt).length > 0;
		if (!hasPlaybackKeys) {
			delete filters.playbackAt;
		}
	} else if (query.from || query.to) {
		// Legacy support for direct from/to filtering
		filters.playbackAt = {};
		if (query.from) {
			const fromDate = new Date(query.from);
			if (!Number.isNaN(fromDate.getTime())) {
				filters.playbackAt[Op.gte] = fromDate;
			}
		}
		if (query.to) {
			const toDate = new Date(query.to);
			if (!Number.isNaN(toDate.getTime())) {
				filters.playbackAt[Op.lte] = toDate;
			}
		}
		const hasPlaybackKeys = Object.keys(filters.playbackAt).length > 0 || Object.getOwnPropertySymbols(filters.playbackAt).length > 0;
		if (!hasPlaybackKeys) {
			delete filters.playbackAt;
		}
	}
	// computed filters ready

	return filters;
};

const applyClientScope = async (whereClause, brandId) => {
	const clientCampaigns = await AudioCampaign.findAll({
		where: { brandId },
		attributes: ['id'],
	});

	const campaignIds = clientCampaigns.map((campaign) => campaign.id);

	const visibilityConditions = [];

	if (campaignIds.length > 0) {
		visibilityConditions.push({ campaignId: { [Op.in]: campaignIds } });

		const campaignJingles = await CampaignJingle.findAll({
			where: { campaignId: { [Op.in]: campaignIds } },
			attributes: ['jingleId'],
		});

		const jingleIds = [...new Set(campaignJingles.map((item) => item.jingleId))];
		if (jingleIds.length > 0) {
			visibilityConditions.push({ jingleId: { [Op.in]: jingleIds } });
		}
	}

	if (visibilityConditions.length === 0) {
		whereClause[Op.and] = [...(whereClause[Op.and] || []), { id: -1 }];
		return;
	}

	whereClause[Op.and] = [...(whereClause[Op.and] || []), { [Op.or]: visibilityConditions }];
};

const enrichLogsWithCampaigns = async (plainLogs) => {
	const missingJingleIds = [...new Set(
		plainLogs
			.filter((log) => !log.campaignId && log.jingleId !== undefined && log.jingleId !== null)
			.map((log) => Number(log.jingleId)),
	)].filter((id) => Number.isInteger(id));

	if (missingJingleIds.length === 0) {
		return plainLogs;
	}

	const campaignsByJingle = await fetchCampaignsForJingleIds(missingJingleIds);
	const updates = [];

	const enriched = plainLogs.map((log) => {
		const jingleKey = Number(log.jingleId);
		if (!log.campaignId && Number.isInteger(jingleKey) && campaignsByJingle.has(jingleKey)) {
			const candidateCampaigns = campaignsByJingle.get(jingleKey);
			const matchedCampaign = selectCampaignForPlayback(candidateCampaigns, log.playbackAt);
			if (matchedCampaign) {
				log.campaign = matchedCampaign;
				log.campaignId = matchedCampaign.id;
				updates.push({ id: log.id, campaignId: matchedCampaign.id });
			}
		}
		return log;
	});

	if (updates.length > 0) {
		await Promise.all(
			updates.map((update) =>
				Log.update(
					{ campaignId: update.campaignId },
					{ where: { id: update.id, campaignId: null } },
				),
			),
		);
	}

	return enriched;
};

const listLogs = asyncHandler(async (req, res) => {
	const filters = await buildFilters(req.query);
	const whereClause = { ...filters };

	if (req.user && req.user.role === 'client' && req.user.brandId) {
		console.log('[Logs] Client user detected:', req.user.username, 'BrandId:', req.user.brandId);
		await applyClientScope(whereClause, req.user.brandId);
	}

	console.log('[Logs] Final filters:', JSON.stringify(whereClause, null, 2));

	const logs = await Log.findAll({
		where: whereClause,
		include: [
			{ model: Device, as: 'device' },
			{ model: AudioCampaign, as: 'audioCampaign' },
			{ model: Jingle, as: 'jingle' },
		],
		order: [['playbackAt', 'DESC']],
		limit: Number(req.query.limit || 200),
	});

	console.log('[Logs] Found', logs.length, 'logs');
	const plainLogs = logs.map((log) => log.get({ plain: true }));
	const enrichedLogs = await enrichLogsWithCampaigns(plainLogs);
	res.json(enrichedLogs);
});

const createLog = asyncHandler(async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ error: true, message: 'Validation failed', details: errors.array() });
	}

	let campaignId = req.body.campaignId ? Number(req.body.campaignId) : null;
	const playbackAt = req.body.playbackAt ? new Date(req.body.playbackAt) : new Date();

	if (!campaignId && req.body.jingleId) {
		const resolvedCampaign = await resolveCampaignForJingle(Number(req.body.jingleId), playbackAt);
		if (resolvedCampaign) {
			campaignId = resolvedCampaign.id;
		}
	}

	const log = await Log.create({
		deviceId: Number(req.body.deviceId),
		campaignId,
		jingleId: Number(req.body.jingleId),
		playbackAt,
		durationSeconds: req.body.durationSeconds ? Number(req.body.durationSeconds) : null,
		status: req.body.status || 'completed',
		details: req.body.details || null,
	});

	res.status(201).json(log.get({ plain: true }));
});

const exportLogs = asyncHandler(async (req, res) => {
	const filters = await buildFilters(req.query);
	const whereClause = { ...filters };

	if (req.user && req.user.role === 'client' && req.user.brandId) {
		await applyClientScope(whereClause, req.user.brandId);
	}

	const logs = await Log.findAll({
		where: whereClause,
		include: [
			{ model: Device, as: 'device' },
			{ model: AudioCampaign, as: 'audioCampaign' },
			{ model: Jingle, as: 'jingle' },
		],
		order: [['playbackAt', 'DESC']],
	});

	const plainLogs = logs.map((log) => log.get({ plain: true }));
	const enrichedLogs = await enrichLogsWithCampaigns(plainLogs);
	const buffer = await buildLogsWorkbookBuffer(enrichedLogs);
	const exportName = `logs-${Date.now()}.xlsx`;

	res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
	res.setHeader('Content-Disposition', `attachment; filename="${exportName}"`);
	res.send(buffer);
});

const getLogsCount = asyncHandler(async (req, res) => {
	const filters = await buildFilters(req.query);
	const whereClause = { ...filters };

	if (req.user && req.user.role === 'client' && req.user.brandId) {
		await applyClientScope(whereClause, req.user.brandId);
	}

	const count = await Log.count({ where: whereClause });
	res.json({ count });
});

module.exports = {
	listLogs,
	createLog,
	exportLogs,
	getLogsCount,
};
