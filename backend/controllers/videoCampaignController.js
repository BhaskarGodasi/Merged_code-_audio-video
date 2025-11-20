// backend/controllers/videoCampaignController.js

const {
  insertVideoCampaign,
  updateVideoCampaign,
  getVideoCampaignById,
  deleteVideoCampaignById,
  getVideoCampaignsByStatus,
  getVideoCampaignsByUser,
} = require('../services/videoCampaignService');

const { VideoCampaign, Brand, Log, Client, Company, DeviceSchedule, DeviceScheduleJingle, Device } = require('../models');

const { getIO } = require('../utils/socket');
const { createWebNotification } = require('../services/webNotificationService'); // adjust path if needed
const { sendEmail } = require('../services/emailService');
const { EmailTemplates } = require('../services/emailTemplateService');
const { syncAllDeviceCSVs } = require('../utils/syncAllDeviceCSVs');
const { notifyDeviceCampaignUpdate } = require('../utils/socketDevice');
const { sendWhatsApp } = require('../services/whatsappService');
const jwt = require('jsonwebtoken');

const sequelize = require('../config/database'); // for transactions if needed

// Helper: safe parse locations
function normalizeLocations(loc) {
  if (!loc) return null;
  if (Array.isArray(loc)) return loc;
  try {
    const parsed = JSON.parse(loc);
    if (Array.isArray(parsed)) return parsed;
    return [String(parsed)];
  } catch (e) {
    return String(loc).split(',').map(s => s.trim());
  }
}

/**
 * Create a new video campaign
 */
exports.createVideoCampaign = async (req, res) => {
  try {
    const body = req.body;
    const locations = normalizeLocations(body.locations || body.locationsJSON || body.locationsJson);

    // video buffer from multer (if used)
    const videoBuffer = req.file ? req.file.buffer : null;

    const created = await insertVideoCampaign({
      campaign_name: body.campaign_name || body.campaignName,
      client_name: body.client_name || body.clientName,
      contact_person: body.contact_person || body.contactPerson,
      email: body.email,
      phone_number: body.phone_number || body.phoneNumber,
      sales_manager_name: body.sales_manager_name || body.salesManagerName,
      start_date: body.start_date || body.startDate,
      end_date: body.end_date || body.endDate,
      spots_per_day: body.spots_per_day || body.spotsPerDay,
      locations,
      created_by: req.user?.id || body.created_by || 1,
      videoBuffer,
      videoName: req.file?.originalname,
      videoSize: req.file?.size,
      videoMimeType: req.file?.mimetype,
      uploadedBy: req.user?.id,
      companyId: body.company_id || body.companyId,
      status: body.status || 'pending',
    });

    // send notifications/emails
    // get user details - use users table via Device or raw query? We'll assume you have users table accessible by Audio model or db; use sequelize raw query
    let user;
    try {
      const [userRow] = await sequelize.query('SELECT id, name, email FROM users WHERE id = ?', {
        replacements: [req.user?.id || created.createdBy],
        type: sequelize.QueryTypes.SELECT,
      });
      user = userRow;
    } catch (e) {
      // ignore, fallback below
    }

    // Web notification
    try {
      await createWebNotification(
        req.user?.id || created.createdBy,
        'Campaign Created - Awaiting Approval',
        `Your campaign "${created.campaignName || created.campaign_name}" has been created and is pending approval.`,
        'info'
      );
    } catch (e) { console.warn('web notification failed', e.message); }

    // Email to user
    if (user?.email) {
      try {
        await sendEmail(
          user.email,
          'Campaign Created - Awaiting Approval',
          `Your campaign "${created.campaignName || created.campaign_name}" has been created and is pending approval.`,
          EmailTemplates.campaignCreatedToUser(created.campaignName || created.campaign_name, user.name)
        );
      } catch (e) { console.warn('sendEmail failed', e.message); }
    }

    // Admin notifications - simplified: notify all admins
    try {
      const [admins] = await sequelize.query("SELECT id, name, email FROM users WHERE role IN ('admin','superadmin')", { type: sequelize.QueryTypes.SELECT });
      if (Array.isArray(admins)) {
        for (const admin of admins) {
          await createWebNotification(admin.id, 'New Campaign Awaiting Approval', `New campaign "${created.campaignName || created.campaign_name}" created by ${user?.name || 'user'} requires approval.`, 'info');
          if (admin.email) {
            try {
              await sendEmail(
                admin.email,
                'New Campaign Requires Approval',
                `New campaign "${created.campaignName || created.campaign_name}" requires your approval.`,
                EmailTemplates.campaignCreatedToAdmins(created.campaignName || created.campaign_name, user?.name || '', user?.email || '', created.id)
              );
            } catch (e) { console.warn('admin email failed', e.message); }
          }
        }
      }
    } catch (e) { /* continue */ }

    // Socket
    try {
      const io = getIO();
      if (io) io.emit('data:update:campaigns');
    } catch (e) { console.warn('socket emit failed', e.message); }

    res.status(201).json({ success: true, message: 'Campaign created successfully, pending approval', campaign: created });
  } catch (err) {
    console.error('createVideoCampaign error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


/**
 * Edit existing campaign
 */
exports.editVideoCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const current = await getVideoCampaignById(id);
    if (!current) return res.status(404).json({ success: false, message: 'Campaign not found' });

    const requiresReapproval = (current.status === 'approved' || current.status === 'live');
    if (requiresReapproval) updates.status = 'pending';

    const updated = await updateVideoCampaign(id, updates);
    if (!updated) return res.status(404).json({ success: false, message: 'Campaign not found' });

    // notify user and admins similar to create
    try {
      await createWebNotification(req.user?.id, 'Campaign Updated', `Campaign "${updated.campaignName || updated.campaign_name}" was updated${requiresReapproval ? ' and is pending re-approval' : ''}.`, 'update');
    } catch (e) { console.warn(e); }

    try {
      const io = getIO(); if (io) io.emit('data:update:campaigns');
    } catch (e) { }

    res.json({ success: true, message: 'Campaign updated successfully', campaign: updated, requires_reapproval: requiresReapproval });
  } catch (err) {
    console.error('editVideoCampaign error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};


/**
 * Approve campaign (sets to live)
 */
exports.approveVideoCampaign = async (req, res) => {
  try {
    const { id } = req.body;
    const updated = await updateVideoCampaign(id, { status: 'live', approvedBy: req.user?.id, approvedAt: new Date() });

    if (!updated) return res.status(404).json({ message: 'Campaign not found' });

    // update devices & notify
    await updateDevicesAfterCampaignChange(id, 'approved');

    // owner and approver details (best-effort)
    let owner = null, approver = { name: req.user?.name || 'Approver' };
    try {
      const [ownerRow] = await sequelize.query('SELECT name, email FROM users WHERE id = ?', { replacements: [updated.createdBy], type: sequelize.QueryTypes.SELECT });
      owner = ownerRow;
    } catch (e) { }

    try {
      await createWebNotification(updated.createdBy, 'Campaign Approved', `Your campaign "${updated.campaignName || updated.campaign_name}" has been approved by ${approver.name}.`, 'success');
      if (owner?.email) {
        await sendEmail(owner.email, 'Your Campaign Has Been Approved', `Your campaign "${updated.campaignName || updated.campaign_name}" is now live.`, EmailTemplates.campaignApprovedToUser(updated.campaignName || updated.campaign_name, owner.name, approver.name));
      }
    } catch (e) { console.warn('notify owner failed', e.message); }

    try { sendWhatsApp('+919133888496', `📢 Campaign Approved: "${updated.campaignName || updated.campaign_name}" is now live!`); } catch (e) { }
    try { const io = getIO(); if (io) io.emit('data:update:campaigns'); } catch (e) { }

    res.json({ message: 'Campaign approved and logic CSV generated', campaign: updated });
  } catch (err) {
    console.error('approveVideoCampaign error', err);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * Reject campaign
 */
exports.rejectVideoCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const current = await getVideoCampaignById(id);
    if (!current) return res.status(404).json({ message: 'Campaign not found' });

    await updateVideoCampaign(id, { status: 'rejected', rejectedReason: reason, statusUpdatedAt: new Date() });

    try {
      await createWebNotification(current.createdBy, 'Campaign Rejected', `Your campaign "${current.campaignName || current.campaign_name}" was rejected. Reason: ${reason}`, 'error');
      if (current.email) {
        await sendEmail(current.email, 'Campaign Rejected', `Your campaign "${current.campaignName || current.campaign_name}" was rejected. Reason: ${reason}`);
      }
    } catch (e) { console.warn('notify failed', e.message); }

    try { const io = getIO(); if (io) io.emit('data:update:campaigns'); } catch (e) { }

    res.json({ message: 'Campaign rejected successfully' });
  } catch (err) {
    console.error('rejectVideoCampaign error', err);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * Request Pause (client)
 */
exports.requestPauseVideoCampaign = async (req, res) => {
  try {
    const { id, reason } = req.body;
    const requestedBy = req.user?.name || 'User';
    const requestedById = req.user?.id;

    const current = await getVideoCampaignById(id);
    if (!current) return res.status(404).json({ message: 'Campaign not found' });

    // update stop_requested fields
    await updateVideoCampaign(id, { stopRequested: true, stopReason: reason, stopRequestedBy: requestedById, stopRequestedAt: new Date() });

    // create approve/reject tokens
    const approveToken = jwt.sign({ campaignId: id, action: 'approve_pause', userId: requestedById, requestedBy }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const rejectToken = jwt.sign({ campaignId: id, action: 'reject_pause', userId: requestedById, requestedBy }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // notify admins
    try {
      const [admins] = await sequelize.query("SELECT id, name, email FROM users WHERE role IN ('admin','superadmin') AND is_approved = true", { type: sequelize.QueryTypes.SELECT });
      for (const admin of admins) {
        await createWebNotification(admin.id, '⏸️ Pause Request Received', `Client "${requestedBy}" requested to pause campaign "${current.campaignName || current.campaign_name}". Reason: ${reason || 'No reason provided'}.`, 'warning');
        if (admin.email) {
          await sendEmail(admin.email, '⏸️ Campaign Pause Request - Action Required', `Client "${requestedBy}" requested to pause campaign "${current.campaignName || current.campaign_name}".`, EmailTemplates.pauseRequestToAdmins(admin.name, current.campaignName || current.campaign_name, requestedBy, reason, approveToken, rejectToken, process.env.FRONTEND_URL || 'http://localhost:5173'));
        }
      }
    } catch (e) { console.warn('notify admins failed', e.message); }

    // notify requester
    await createWebNotification(requestedById, '⏸️ Pause Request Submitted', `Your pause request for campaign "${current.campaignName || current.campaign_name}" has been submitted and is under review.`, 'info');

    try {
      const userRow = await sequelize.query('SELECT name, email FROM users WHERE id = ?', { replacements: [requestedById], type: sequelize.QueryTypes.SELECT });
      const userObj = userRow && userRow[0] ? userRow[0] : null;
      if (userObj?.email) {
        await sendEmail(userObj.email, '⏸️ Pause Request Submitted - Under Review', `Your pause request for campaign "${current.campaignName || current.campaign_name}" has been submitted and is under review.`, EmailTemplates.pauseRequestToUser(userObj.name, current.campaignName || current.campaign_name));
      }
    } catch (e) { }

    try { const io = getIO(); if (io) io.emit('data:update:campaigns'); io.emit('admin:pause:requested', { campaignId: id, campaignName: current.campaignName || current.campaign_name, requestedBy, requestedById, reason, timestamp: new Date().toISOString() }); } catch (e) { }

    const updated = await getVideoCampaignById(id);
    res.json({ success: true, message: 'Pause request submitted successfully.', campaign: updated });

  } catch (err) {
    console.error('requestPauseVideoCampaign error', err);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * Approve pause (by token)
 */
exports.approvePauseVideoCampaign = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Approval token is required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.action !== 'approve_pause') return res.status(400).json({ success: false, message: 'Invalid approval token' });

    const { campaignId, userId } = decoded;
    const campaign = await getVideoCampaignById(campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    await updateVideoCampaign(campaignId, { status: 'paused', stopRequested: false, stopRequestedBy: null, stopRequestedAt: null, statusUpdatedAt: new Date() });

    await createWebNotification(userId, '✅ Pause Request Approved', `Your pause request for campaign "${campaign.campaignName || campaign.campaign_name}" has been approved.`, 'success');

    try {
      const [userRow] = await sequelize.query('SELECT name, email FROM users WHERE id = ?', { replacements: [userId], type: sequelize.QueryTypes.SELECT });
      const user = userRow && userRow[0] ? userRow[0] : null;
      if (user?.email) {
        await sendEmail(user.email, '✅ Pause Request Approved - Campaign Paused', `Your pause request for campaign "${campaign.campaignName || campaign.campaign_name}" has been approved.`, EmailTemplates.pauseApprovedToUser(user.name, campaign.campaignName || campaign.campaign_name, req.user?.name || 'Approver'));
      }
    } catch (e) { }

    try { const io = getIO(); if (io) io.emit('data:update:campaigns'); io.emit('campaign:pause:approved', { campaignId, campaignName: campaign.campaignName || campaign.campaign_name, approvedBy: req.user?.name || 'Email Approval', timestamp: new Date().toISOString() }); } catch (e) { }

    res.json({ success: true, message: 'Pause request approved successfully', campaign: { id: campaignId, name: campaign.campaignName || campaign.campaign_name } });
  } catch (err) {
    console.error('approvePauseVideoCampaign error', err);
    if (err.name === 'TokenExpiredError') return res.status(400).json({ success: false, message: 'Approval link has expired' });
    if (err.name === 'JsonWebTokenError') return res.status(400).json({ success: false, message: 'Invalid approval link' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/**
 * Reject pause (by token)
 */
exports.rejectPauseVideoCampaign = async (req, res) => {
  try {
    const { token, rejectionReason } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Rejection token is required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.action !== 'reject_pause') return res.status(400).json({ success: false, message: 'Invalid rejection token' });

    const { campaignId, userId } = decoded;
    const campaign = await getVideoCampaignById(campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    await updateVideoCampaign(campaignId, { stopRequested: false, stopRequestedBy: null, stopRequestedAt: null, statusUpdatedAt: new Date() });

    await createWebNotification(userId, '❌ Pause Request Rejected', `Your pause request for campaign "${campaign.campaignName || campaign.campaign_name}" has been rejected.`, 'error');
    try {
      const [userRow] = await sequelize.query('SELECT name, email FROM users WHERE id = ?', { replacements: [userId], type: sequelize.QueryTypes.SELECT });
      const user = userRow && userRow[0] ? userRow[0] : null;
      if (user?.email) {
        await sendEmail(user.email, '❌ Pause Request Rejected', `Your pause request for campaign "${campaign.campaignName || campaign.campaign_name}" has been rejected.`, EmailTemplates.pauseRejectedToUser(user.name, campaign.campaignName || campaign.campaign_name, req.user?.name || 'Rejector', rejectionReason));
      }
    } catch (e) { }

    try { const io = getIO(); if (io) io.emit('data:update:campaigns'); io.emit('campaign:pause:rejected', { campaignId, campaignName: campaign.campaignName || campaign.campaign_name, rejectedBy: req.user?.name || 'Email Rejection', timestamp: new Date().toISOString() }); } catch (e) { }

    res.json({ success: true, message: 'Pause request rejected', campaign: { id: campaignId, name: campaign.campaignName || campaign.campaign_name } });
  } catch (err) {
    console.error('rejectPauseVideoCampaign error', err);
    if (err.name === 'TokenExpiredError') return res.status(400).json({ success: false, message: 'Rejection link has expired' });
    if (err.name === 'JsonWebTokenError') return res.status(400).json({ success: false, message: 'Invalid rejection link' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/**
 * Get all campaigns (admin + user)
 */
exports.getAllVideoCampaigns = async (req, res) => {
  try {
    const { role, id } = req.user;
    if (role === 'user' || role === 'client') {
      const userCampaigns = await getVideoCampaignsByUser(id);
      return res.json(userCampaigns);
    }
    const all = await VideoCampaign.findAll({ order: [['createdAt', 'DESC']] });
    return res.json(all.map(r => (r.toJSON ? r.toJSON() : r)));
  } catch (err) {
    console.error('getAllVideoCampaigns error', err);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * Get campaign video buffer
 */
exports.getCampaignVideo = async (req, res) => {
  try {
    const id = req.params.id;
    const campaign = await getVideoCampaignById(id);
    if (!campaign || !campaign.video) return res.status(404).json({ message: 'Video not found for this campaign.' });

    const videoBuffer = campaign.video;

    res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': videoBuffer.length });
    res.end(videoBuffer);
  } catch (err) {
    console.error('getCampaignVideo error', err);
    res.status(500).json({ message: 'Server error fetching video.' });
  }
};


/**
 * Get live campaigns with videos
 */
exports.getLiveCampaignsWithVideos = async (req, res) => {
  try {
    const baseUrl = `${process.env.API_BASE || 'https://led.indianrailwayads.com'}/api/campaigns`;

    const live = await VideoCampaign.findAll({
      where: { status: { [sequelize.Op.or]: ['live', 'active'] }, video: { [sequelize.Op.ne]: null } },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'campaignName', 'clientName', 'startDate', 'endDate', 'status', [sequelize.literal('video IS NOT NULL'), 'has_video']],
    });

    const campaigns = (live || []).map(c => {
      const obj = c.toJSON ? c.toJSON() : c;
      return {
        id: obj.id,
        campaign_name: obj.campaignName || obj.campaign_name,
        client_name: obj.clientName || obj.client_name,
        start_date: obj.startDate,
        end_date: obj.endDate,
        status: obj.status,
        has_video: !!obj.video,
        video_url: obj.video ? `${baseUrl}/video/${obj.id}` : null
      };
    });

    res.json({ success: true, campaigns, total: campaigns.length });
  } catch (err) {
    console.error('getLiveCampaignsWithVideos error', err);
    res.status(500).json({ success: false, message: 'Failed to fetch campaigns', error: err.message });
  }
};


/**
 * Get campaigns for a device (matching locations, per-device sequences)
 */
exports.getCampaignsForDevice = async (req, res) => {
  try {
    const { device_id } = req.body;
    if (!device_id) return res.status(400).json({ success: false, message: 'device_id required' });

    const dev = await Device.findOne({ where: { device_id } });
    if (!dev) return res.status(404).json({ success: false, message: 'Device not found' });

    const location = dev.location;

    // find campaigns matching location OR no locations
    const all = await VideoCampaign.findAll({
      where: {
        status: { [sequelize.Op.in]: ['live', 'active'] },
        [sequelize.Op.or]: [
          sequelize.where(sequelize.fn('json_contains', sequelize.col('locations'), JSON.stringify([location])), true), // best-effort - JSON/ARRAY compat
          { locations: null },
        ],
      },
    });

    let campaigns = (all || []).map(c => {
      const obj = c.toJSON ? c.toJSON() : c;
      let order = 0;
      if (obj.deviceSequences && typeof obj.deviceSequences === 'object') {
        order = obj.deviceSequences[device_id] ?? obj.sequence ?? 0;
      } else {
        order = obj.sequence ?? 0;
      }
      return { id: obj.id, campaign_name: obj.campaignName || obj.campaign_name, status: obj.status, locations: obj.locations, order, spots_per_day: obj.spotsPerDay, has_video: !!obj.video, video_url: obj.video ? `${process.env.API_BASE_URL || 'https://led.indianrailwayads.com'}/campaigns/video/${obj.id}` : null };
    });

    campaigns.sort((a, b) => a.order - b.order);

    return res.json({ success: true, campaigns });
  } catch (err) {
    console.error('getCampaignsForDevice error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/**
 * Pause campaign (admin)
 */
exports.pauseVideoCampaign = async (req, res) => {
  try {
    const { id, reason } = req.body;
    const performer = req.user?.name || 'Admin';

    const current = await getVideoCampaignById(id);
    if (!current) return res.status(404).json({ message: 'Campaign not found' });

    const updated = await updateVideoCampaign(id, { status: 'paused', pauseReason: reason });

    await updateDevicesAfterCampaignChange(id, 'paused');

    // notify owner
    try {
      await createWebNotification(current.createdBy, 'Campaign Paused', `Your campaign "${current.campaignName || current.campaign_name}" has been paused by ${performer}.`, 'warning');
    } catch (e) { }

    try { const io = getIO(); if (io) io.emit('data:update:campaigns'); } catch (e) { }

    res.json({ message: 'Campaign paused successfully', campaign: updated });
  } catch (err) {
    console.error('pauseVideoCampaign error', err);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * Delete campaign
 */
exports.deleteVideoCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await getVideoCampaignById(id);
    if (!current) return res.status(404).json({ success: false, message: 'Campaign not found' });

    const allowedStatuses = ['paused', 'rejected', 'pending', 'draft'];
    if (!allowedStatuses.includes(current.status)) {
      return res.status(400).json({ success: false, message: `Campaign cannot be deleted while ${current.status}. Please pause or reject the campaign first.` });
    }

    const removed = await deleteVideoCampaignById(id);
    await updateDevicesAfterCampaignChange(id, 'deleted');

    // notify owner & admins
    try { await createWebNotification(current.createdBy, 'Campaign Deleted', `Your campaign "${current.campaignName || current.campaign_name}" was deleted.`, 'warning'); } catch (e) { }
    try { const io = getIO(); if (io) io.emit('data:update:campaigns'); } catch (e) { }

    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (err) {
    console.error('deleteVideoCampaign error', err);
    res.status(500).json({ success: false, message: 'Server error while deleting campaign' });
  }
};


/**
 * Approve pause via email (GET query token)
 */
exports.approvePauseViaEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Approval token is required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.action !== 'approve_pause') return res.status(400).json({ success: false, message: 'Invalid approval token' });

    const { campaignId, userId } = decoded;
    const campaign = await getVideoCampaignById(campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    await updateVideoCampaign(campaignId, { status: 'paused', stopRequested: false, stopRequestedBy: null, stopRequestedAt: null });

    await createWebNotification(userId, '✅ Pause Request Approved', `Your pause request for campaign "${campaign.campaignName || campaign.campaign_name}" has been approved.`, 'success');

    try { const io = getIO(); if (io) io.emit('data:update:campaigns'); io.emit('campaign:pause:approved', { campaignId, campaignName: campaign.campaignName || campaign.campaign_name, approvedBy: req.user?.name || 'Email Approval', timestamp: new Date().toISOString() }); } catch (e) { }

    if (req.accepts('html')) {
      res.send(`<html><body style="font-family: Arial, sans-serif;"><h1>✅ Pause Request Approved</h1><p>Campaign "${campaign.campaignName || campaign.campaign_name}" has been paused.</p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Go to Dashboard</a></body></html>`);
    } else {
      res.json({ success: true, message: 'Pause request approved successfully', campaign: { id: campaignId, name: campaign.campaignName || campaign.campaign_name } });
    }
  } catch (err) {
    console.error('approvePauseViaEmail error', err);
    if (err.name === 'TokenExpiredError') return res.status(400).json({ success: false, message: 'Approval link has expired' });
    if (err.name === 'JsonWebTokenError') return res.status(400).json({ success: false, message: 'Invalid approval link' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/**
 * Reject pause via email
 */
exports.rejectPauseViaEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Rejection token is required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.action !== 'reject_pause') return res.status(400).json({ success: false, message: 'Invalid rejection token' });

    const { campaignId, userId } = decoded;
    const campaign = await getVideoCampaignById(campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    await updateVideoCampaign(campaignId, { stopRequested: false, stopRequestedBy: null, stopRequestedAt: null });

    await createWebNotification(userId, '❌ Pause Request Rejected', `Your pause request for campaign "${campaign.campaignName || campaign.campaign_name}" has been rejected.`, 'error');

    try { const io = getIO(); if (io) io.emit('data:update:campaigns'); io.emit('campaign:pause:rejected', { campaignId, campaignName: campaign.campaignName || campaign.campaign_name, rejectedBy: req.user?.name || 'Email Rejection', timestamp: new Date().toISOString() }); } catch (e) { }

    if (req.accepts('html')) {
      res.send(`<html><body style="font-family: Arial, sans-serif;"><h1>❌ Pause Request Rejected</h1><p>Campaign "${campaign.campaignName || campaign.campaign_name}" pause request has been rejected.</p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Go to Dashboard</a></body></html>`);
    } else {
      res.json({ success: true, message: 'Pause request rejected', campaign: { id: campaignId, name: campaign.campaignName || campaign.campaign_name } });
    }
  } catch (err) {
    console.error('rejectPauseViaEmail error', err);
    if (err.name === 'TokenExpiredError') return res.status(400).json({ success: false, message: 'Rejection link has expired' });
    if (err.name === 'JsonWebTokenError') return res.status(400).json({ success: false, message: 'Invalid rejection link' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


/**
 * updateDevicesAfterCampaignChange - regenerates CSVs & notifies devices
 */
async function updateDevicesAfterCampaignChange(campaignId, action = 'updated') {
  try {
    console.log(`Campaign ${campaignId} ${action}, syncing all device CSVs...`);
    await syncAllDeviceCSVs();

    try {
      const io = getIO();
      if (io) {
        io.emit('csv:batch:update', { timestamp: new Date().toISOString(), action, campaignId });
      }
    } catch (e) {
      console.warn('socket emit csv:batch:update failed', e.message);
    }

  } catch (e) {
    console.error('updateDevicesAfterCampaignChange error', e.message);
  }
}

module.exports = exports;
