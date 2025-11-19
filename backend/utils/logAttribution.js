const { Op } = require('sequelize');
const { Campaign, CampaignJingle } = require('../models');

const toPlain = (record) => (record && typeof record.get === 'function' ? record.get({ plain: true }) : record);

const parseDate = (value) => {
	if (!value) {
		return null;
	}
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Select the most relevant campaign for a playback event.
 * Prioritises campaigns that were active at the playback timestamp,
 * otherwise falls back to the campaign whose start date is closest.
 */
const selectCampaignForPlayback = (campaigns, playbackAt) => {
	if (!Array.isArray(campaigns) || campaigns.length === 0) {
		return null;
	}

	const playbackDate = parseDate(playbackAt) || new Date();

	const enriched = campaigns
		.map((campaign) => {
			const start = parseDate(campaign.startDate);
			const end = parseDate(campaign.endDate);
			const isActive = Boolean(start && end && playbackDate >= start && playbackDate <= end);
			return {
				campaign,
				start,
				end,
				isActive,
			};
		});

	const activeCampaigns = enriched.filter((item) => item.isActive);
	if (activeCampaigns.length > 0) {
		return activeCampaigns
			.sort((a, b) => (a.start?.getTime() || 0) - (b.start?.getTime() || 0))[0]
			?.campaign || null;
	}

	return enriched
		.sort((a, b) => {
			const diffA = Math.abs((a.start?.getTime() ?? Number.POSITIVE_INFINITY) - playbackDate.getTime());
			const diffB = Math.abs((b.start?.getTime() ?? Number.POSITIVE_INFINITY) - playbackDate.getTime());
			return diffA - diffB;
		})
		.map((item) => item.campaign)[0] || null;
};

/**
 * Fetch campaigns grouped by jingleId for a list of jingles.
 * @param {number[]} jingleIds
 * @returns {Promise<Map<number, Array<object>>>}
 */
const fetchCampaignsForJingleIds = async (jingleIds) => {
	if (!Array.isArray(jingleIds) || jingleIds.length === 0) {
		return new Map();
	}

	const uniqueJingleIds = [...new Set(jingleIds.filter((id) => Number.isInteger(id)))];
	if (uniqueJingleIds.length === 0) {
		return new Map();
	}

	const links = await CampaignJingle.findAll({
		where: { jingleId: { [Op.in]: uniqueJingleIds } },
		attributes: ['campaignId', 'jingleId'],
	});

	if (links.length === 0) {
		return new Map();
	}

	const campaignIds = [...new Set(links.map((link) => link.campaignId))];
	if (campaignIds.length === 0) {
		return new Map();
	}

	const campaigns = await Campaign.findAll({
		where: { id: { [Op.in]: campaignIds } },
		attributes: ['id', 'campaignName', 'brandId', 'status', 'startDate', 'endDate'],
		order: [['startDate', 'ASC']],
	});

	const campaignMap = new Map(campaigns.map((campaign) => [campaign.id, toPlain(campaign)]));
	const result = new Map();

	links.forEach((link) => {
		const campaign = campaignMap.get(link.campaignId);
		if (!campaign) {
			return;
		}
		if (!result.has(link.jingleId)) {
			result.set(link.jingleId, []);
		}
		result.get(link.jingleId).push(campaign);
	});

	return result;
};

/**
 * Resolve the most relevant campaign for a single jingle playback.
 * @param {number} jingleId
 * @param {Date|string} playbackAt
 * @returns {Promise<object|null>}
 */
const resolveCampaignForJingle = async (jingleId, playbackAt) => {
	if (!Number.isInteger(jingleId)) {
		return null;
	}

	const campaignsByJingle = await fetchCampaignsForJingleIds([jingleId]);
	const campaignsForJingle = campaignsByJingle.get(jingleId);

	if (!campaignsForJingle || campaignsForJingle.length === 0) {
		return null;
	}

	return selectCampaignForPlayback(campaignsForJingle, playbackAt);
};

module.exports = {
	selectCampaignForPlayback,
	fetchCampaignsForJingleIds,
	resolveCampaignForJingle,
};
