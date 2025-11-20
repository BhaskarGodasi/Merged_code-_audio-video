const { Op } = require('sequelize');
const { AudioCampaign, Jingle, DeviceSchedule, DeviceScheduleJingle } = require('../models');
const { campaignStatusFromDates, generateAdPlayOrder } = require('../utils/helpers');

const buildCampaignPayload = (campaign) => {
	const item = campaign.get({ plain: true });
	item.status = campaignStatusFromDates(item.startDate, item.endDate);
	return item;
};

const syncCampaignStatuses = async () => {
	const campaigns = await AudioCampaign.findAll();
	await Promise.all(
		campaigns.map(async (campaign) => {
			const status = campaignStatusFromDates(
				campaign.startDate,
				campaign.endDate,
			);
			if (campaign.status !== status) {
				campaign.status = status;
				await campaign.save();
			}
		}),
	);
};

const getActiveCampaignsForDevice = async (deviceId) => {
	const today = new Date();
	today.setHours(0, 0, 0, 0); // Set to start of day for proper date comparison
	
	console.log(`[scheduleService] Getting schedule for device ${deviceId}, today: ${today.toISOString()}`);
	
	// Get device schedule with active jingles
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

	console.log(`[scheduleService] Found schedule:`, schedule ? 'YES' : 'NO');
	console.log(`[scheduleService] Jingles count:`, schedule?.jingles?.length || 0);

	if (!schedule || !schedule.jingles || schedule.jingles.length === 0) {
		console.log(`[scheduleService] Returning empty playlist for device ${deviceId}`);
		return [];
	}

	// Check if we have a pre-generated play order using GCD algorithm
	if (schedule.playOrder && schedule.playOrder.playOrder && schedule.playOrder.playOrder.length > 0) {
		console.log(`[scheduleService] Using pre-generated GCD play order with ${schedule.playOrder.totalAds} items`);
		
		// Build playlist from the generated play order
		const playlist = schedule.playOrder.playOrder.map(item => ({
			jingleId: item.jingleId,
			title: item.title,
			filename: item.filename,
			playbackWindowStart: schedule.playbackWindowStart,
			playbackWindowEnd: schedule.playbackWindowEnd,
		}));

		console.log(`[scheduleService] Built GCD-based playlist with ${playlist.length} items for device ${deviceId}`);
		return playlist;
	}

	// Fallback: Build playlist based on spots (old method)
	// This creates a weighted rotation list
	console.log(`[scheduleService] No pre-generated play order found, using fallback spots method`);
	const playlist = [];
	schedule.jingles.forEach((scheduleJingle) => {
		console.log(`[scheduleService] Processing jingle: ${scheduleJingle.jingle.title}, spots: ${scheduleJingle.spots}`);
		for (let i = 0; i < scheduleJingle.spots; i++) {
			playlist.push({
				jingleId: scheduleJingle.jingle.id,
				title: scheduleJingle.jingle.title,
				filename: scheduleJingle.jingle.fileName,
				duration: scheduleJingle.jingle.durationSeconds,
				spots: scheduleJingle.spots,
				playbackWindowStart: schedule.playbackWindowStart,
				playbackWindowEnd: schedule.playbackWindowEnd,
			});
		}
	});

	console.log(`[scheduleService] Built playlist with ${playlist.length} items for device ${deviceId}`);
	return playlist;
};

const getScheduleSummary = async () => {
	const [scheduled, active, completed] = await Promise.all([
		AudioCampaign.count({ where: { status: 'scheduled' } }),
		AudioCampaign.count({ where: { status: 'active' } }),
		AudioCampaign.count({ where: { status: 'completed' } }),
	]);

	return { scheduled, active, completed };
};

module.exports = {
	syncCampaignStatuses,
	getActiveCampaignsForDevice,
	getScheduleSummary,
};
