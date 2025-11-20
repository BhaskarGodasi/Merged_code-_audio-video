// routes/videoDeviceRoutes.js
const express = require('express');
const router = express.Router();
const videoDeviceController = require('../controllers/videoDeviceController');

// Device Heartbeat
router.post('/heartbeat', videoDeviceController.deviceHeartbeat);

// Register Device
router.post('/register', videoDeviceController.registerDevice);

// Get All Devices
router.get('/', videoDeviceController.getAllDevices);

// Get Locations
router.get('/locations', videoDeviceController.getLocations);

// Update Location Name
router.put('/location', videoDeviceController.updateLocationName);

// Update Device Details
router.put('/update', videoDeviceController.updateDeviceDetails);

// Get Device Info
router.get('/:deviceId', videoDeviceController.getDeviceInfo);

// CSV Operations
router.get('/:deviceId/csv', videoDeviceController.getDeviceCSV); // or fetchCSVByDevice?
// The controller has both getDeviceCSV and fetchCSVByDevice. 
// getDeviceCSV: /:deviceId?date=... -> returns CSV
// fetchCSVByDevice: /:deviceId/csv?date=... -> returns CSV (APK usage)
// They seem redundant but I'll map them as requested by user code structure

router.get('/:deviceId/fetch-csv', videoDeviceController.fetchCSVByDevice);
router.get('/:deviceId/csv-content', videoDeviceController.getCSVContent);
router.get('/:deviceId/csv-history', videoDeviceController.getCSVHistory);
router.delete('/:deviceId/csv', videoDeviceController.deleteCSV);
router.post('/:deviceId/create-csv', videoDeviceController.createDeviceCSV);

// Check Updates
router.get('/:deviceId/check-updates', videoDeviceController.checkCampaignUpdates);

// Batch Update
router.post('/batch/csv-update', videoDeviceController.pingAllDevicesForCsvUpdate);

module.exports = router;
