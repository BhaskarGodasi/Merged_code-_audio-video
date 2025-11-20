// backend/routes/videoCampaignRoutes.js
const express = require('express');
const router = express.Router();
const videoCampaignController = require('../controllers/videoCampaignController');

// file upload middleware (multer) if required
const upload = require('../middleware/upload'); // adjust if your project has a different upload middleware

router.post('/', upload.single('video'), videoCampaignController.createVideoCampaign);
router.put('/:id', upload.single('video'), videoCampaignController.editVideoCampaign);
router.post('/approve', videoCampaignController.approveVideoCampaign);
router.post('/reject/:id', videoCampaignController.rejectVideoCampaign);
router.post('/pause/request', videoCampaignController.requestPauseVideoCampaign);
router.post('/pause/approve', videoCampaignController.approvePauseVideoCampaign);
router.post('/pause/reject', videoCampaignController.rejectPauseVideoCampaign);
router.get('/', videoCampaignController.getAllVideoCampaigns);
router.get('/video/:id', videoCampaignController.getCampaignVideo);
router.get('/live/with-videos', videoCampaignController.getLiveCampaignsWithVideos);
router.post('/for-device', videoCampaignController.getCampaignsForDevice);
router.post('/pause/approve-email', videoCampaignController.approvePauseViaEmail); // if using GET token, you can expose route as GET too
router.post('/pause/reject-email', videoCampaignController.rejectPauseViaEmail);
router.delete('/:id', videoCampaignController.deleteVideoCampaign);
router.post('/pause/approve-email-web', videoCampaignController.approvePauseViaEmail); // leave as convenience

module.exports = router;
