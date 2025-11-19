const express = require('express');
const { body } = require('express-validator');
const logController = require('../controllers/logController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, logController.listLogs);
router.get('/count', authenticate, logController.getLogsCount);
router.get('/export', authenticate, logController.exportLogs);

router.post(
	'/',
	[
		body('deviceId').isInt({ gt: 0 }),
		body('campaignId').optional().isInt({ gt: 0 }),
		body('jingleId').isInt({ gt: 0 }),
		body('playbackAt').optional().isISO8601(),
		body('durationSeconds').optional().isInt({ min: 0 }),
		body('status').optional().isIn(['scheduled', 'completed', 'failed']),
	],
	logController.createLog,
);

module.exports = router;
