const express = require('express');
const router = express.Router();
const {
	listDeviceSchedules,
	getDeviceSchedule,
	createOrUpdateDeviceSchedule,
	addJingleToSchedule,
	addJingleToMultipleDevices,
	updateScheduleJingle,
	removeJingleFromSchedule,
	deleteDeviceSchedule,
	getActiveJinglesForDevice,
	getPlayOrderPreview,
} = require('../controllers/deviceScheduleController');

// List all device schedules
router.get('/', listDeviceSchedules);

// Get schedule for specific device
router.get('/device/:deviceId', getDeviceSchedule);

// Get active jingles for device (used by Android client)
router.get('/device/:deviceId/active', getActiveJinglesForDevice);

// Get play order preview for device
router.get('/device/:deviceId/play-order', getPlayOrderPreview);

// Create or update device schedule
router.post('/', createOrUpdateDeviceSchedule);

// Add jingle to schedule
router.post('/jingles', addJingleToSchedule);

// Add jingle to multiple devices
router.post('/jingles/bulk', addJingleToMultipleDevices);

// Update jingle in schedule
router.put('/jingles/:id', updateScheduleJingle);

// Remove jingle from schedule
router.delete('/jingles/:id', removeJingleFromSchedule);

// Delete device schedule
router.delete('/:id', deleteDeviceSchedule);

module.exports = router;
