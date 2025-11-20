// backend/cron/deleteExpiredCampaigns.js
const cron = require('node-cron');
const sequelize = require('../config/database');
const {VideoCampaign} = require('../models');
const { Op } = require('sequelize');

async function deleteExpiredCampaigns() {
  try {
    console.log('🧹 Checking for expired campaigns (Sequelize)...');

    // Delete campaigns whose endDate (end_date) < today
    const today = new Date();
    const deleted = await VideoCampaign.destroy({
      where: {
        endDate: { [Op.lt]: today }
      },
      returning: true // Note: MySQL does not support returning; Sequelize will ignore this flag for MySQL.
    });

    // For logging, fetch count (Sequelize destroy returns number of rows deleted)
    if (deleted > 0) {
      console.log(`✅ Deleted ${deleted} expired campaign(s).`);
    } else {
      console.log('ℹ️ No expired campaigns found today.');
    }
  } catch (err) {
    console.error('❌ Error deleting expired campaigns:', err && err.message ? err.message : err);
  }
}

// Schedule: everyday at midnight
cron.schedule('0 0 * * *', deleteExpiredCampaigns);

// Also export function for manual invocation
module.exports = deleteExpiredCampaigns;
