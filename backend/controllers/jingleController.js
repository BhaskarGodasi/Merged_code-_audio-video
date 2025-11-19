const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const { Jingle, Campaign, DeviceScheduleJingle, Log, CampaignJingle } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const listJingles = asyncHandler(async (_req, res) => {
	const jingles = await Jingle.findAll({ order: [['createdAt', 'DESC']] });
	res.json(jingles.map((item) => item.get({ plain: true })));
});

const createJingle = asyncHandler(async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ error: true, message: 'Validation failed', details: errors.array() });
	}

	if (!req.file) {
		return res.status(400).json({ error: true, message: 'Audio file is required' });
	}

	const { title, durationSeconds } = req.body;
	const relativePath = path.posix.join('uploads', 'jingles', req.file.filename);

	const jingle = await Jingle.create({
		title: title || req.file.originalname,
		fileName: req.file.filename,
		filePath: relativePath,
		fileSize: req.file.size,
		mimeType: req.file.mimetype,
		durationSeconds: durationSeconds ? Number(durationSeconds) : null,
	});

	res.status(201).json(jingle.get({ plain: true }));
});

const updateJingle = asyncHandler(async (req, res) => {
	const jingle = await Jingle.findByPk(req.params.id);
	if (!jingle) {
		return res.status(404).json({ error: true, message: 'Jingle not found' });
	}

	if (req.body.title !== undefined) {
		jingle.title = req.body.title;
	}
	if (req.body.durationSeconds !== undefined) {
		jingle.durationSeconds = req.body.durationSeconds ? Number(req.body.durationSeconds) : null;
	}

	await jingle.save();
	res.json(jingle.get({ plain: true }));
});

const deleteJingle = asyncHandler(async (req, res) => {
	const jingle = await Jingle.findByPk(req.params.id);
	if (!jingle) {
		return res.status(404).json({ error: true, message: 'Jingle not found' });
	}

	// Check for references in campaigns (many-to-many)
	const campaignCount = await CampaignJingle.count({ where: { jingleId: jingle.id } });
	
	// Check for references in device schedules (new system)
	const scheduleJingleCount = await DeviceScheduleJingle.count({ where: { jingleId: jingle.id } });
	
	if (campaignCount > 0) {
		return res.status(400).json({ 
			error: true, 
			message: `Cannot delete jingle. It is used in ${campaignCount} campaign(s). Please remove it from all campaigns first.` 
		});
	}
	
	if (scheduleJingleCount > 0) {
		return res.status(400).json({ 
			error: true, 
			message: `Cannot delete jingle. It is scheduled on ${scheduleJingleCount} device(s). Please remove it from all device schedules first.` 
		});
	}

	// Delete associated logs (these should cascade but being explicit)
	await Log.destroy({ where: { jingleId: jingle.id } });

	// Delete the audio file
	const absolutePath = path.join(__dirname, '..', jingle.filePath);
	if (fs.existsSync(absolutePath)) {
		fs.unlinkSync(absolutePath);
	}

	await jingle.destroy();

	res.json({ success: true, message: 'Jingle deleted successfully' });
});

module.exports = {
	listJingles,
	createJingle,
	updateJingle,
	deleteJingle,
};
