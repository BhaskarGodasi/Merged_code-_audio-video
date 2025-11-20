// backend/services/videoCampaignService.js
const VideoCampaign = require('../models/VideoCampaign');
const { Op } = require('sequelize');

/**
 * Insert a video campaign
 * payload: object with fields matching model (campaignName, clientName, locations[], videoBuffer, etc.)
 */
async function insertVideoCampaign(payload, options = {}) {
  // Map payload keys to model attributes (if needed)
  const row = {
    clientName: payload.client_name || payload.clientName,
    campaignName: payload.campaign_name || payload.campaignName,
    contactPerson: payload.contact_person || payload.contactPerson,
    email: payload.email,
    phoneNumber: payload.phone_number || payload.phoneNumber,
    salesManagerName: payload.sales_manager_name || payload.salesManagerName,
    startDate: payload.start_date || payload.startDate,
    endDate: payload.end_date || payload.endDate,
    spotsPerDay: payload.spots_per_day || payload.spotsPerDay,
    locations: payload.locations || payload.locationsJSON || null,
    createdBy: payload.created_by || payload.createdBy || 1,
    video: payload.videoBuffer || null,
    videoName: payload.videoName || payload.video_name || null,
    videoSize: payload.videoSize || payload.video_size || null,
    videoMimeType: payload.videoMimeType || null,
    uploadedBy: payload.uploadedBy || payload.createdBy || null,
    companyId: payload.companyId || payload.company_id || null,
    campaignType: 'video',
    status: payload.status || 'pending'
  };

  const created = await VideoCampaign.create(row, options);
  return created.toJSON ? created.toJSON() : created;
}

async function updateVideoCampaign(id, updates = {}, options = {}) {
  const [count] = await VideoCampaign.update(updates, { where: { id }, ...options });
  if (count === 0) return null;
  const updated = await VideoCampaign.findByPk(id);
  return updated ? (updated.toJSON ? updated.toJSON() : updated) : null;
}

async function getVideoCampaignById(id) {
  const campaign = await VideoCampaign.findByPk(id);
  return campaign ? (campaign.toJSON ? campaign.toJSON() : campaign) : null;
}

async function deleteVideoCampaignById(id) {
  const deleted = await VideoCampaign.destroy({ where: { id } });
  return deleted > 0;
}

async function getVideoCampaignsByStatus(status) {
  const rows = await VideoCampaign.findAll({ where: { status } });
  return rows.map(r => (r.toJSON ? r.toJSON() : r));
}

async function getVideoCampaignsByUser(userId) {
  const rows = await VideoCampaign.findAll({ where: { createdBy: userId } });
  return rows.map(r => (r.toJSON ? r.toJSON() : r));
}

module.exports = {
  insertVideoCampaign,
  updateVideoCampaign,
  getVideoCampaignById,
  deleteVideoCampaignById,
  getVideoCampaignsByStatus,
  getVideoCampaignsByUser,
};
