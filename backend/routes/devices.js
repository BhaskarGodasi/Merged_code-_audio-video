const express = require('express');
const { body } = require('express-validator');
const deviceController = require('../controllers/deviceController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, deviceController.listDevices);
router.get('/pairing/:code', deviceController.verifyPairingCode);
router.get('/:id', deviceController.getDeviceById);

router.post(
	'/',
	[
		body('name').optional().isString(),
		body('location').optional().isString(),
		body('serialNumber').notEmpty().withMessage('Serial number is required').isString(),
	],
	deviceController.createDevice,
);

router.patch(
	'/:id',
	[
		body('status').optional().isIn(['offline', 'online', 'error', 'maintenance']),
		body('volumeLevel').optional().isInt({ min: 0, max: 100 }),
	],
	deviceController.updateDeviceStatus,
);

router.post(
	'/:id/commands/play',
	[
		body('campaignId').isInt({ gt: 0 }),
		body('jingleId').isInt({ gt: 0 }),
	],
	deviceController.dispatchPlayCommand,
);

router.post(
	'/:id/playback/control',
	[body('action').isIn(['play', 'pause'])],
	deviceController.controlPlayback,
);

router.post('/:id/repair', deviceController.repairDevice);

router.delete('/:id', deviceController.deleteDevice);

module.exports = router;
