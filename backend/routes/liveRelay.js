const express = require('express');
const router = express.Router();
const liveRelayController = require('../controllers/liveRelayController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all online devices
router.get('/online-devices', liveRelayController.getOnlineDevices);

// Get device schedule and play order
router.get('/device/:deviceId/schedule', liveRelayController.getDeviceSchedule);

// Request live stream from device
router.post('/device/:deviceId/live-stream', liveRelayController.requestLiveStream);

module.exports = router;

