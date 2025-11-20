// backend/cron/campaignReminderJob.js
const cron = require('node-cron');
const sequelize = require('../config/database');
const VideoCampaign = require('../models/VideoCampaign');
const User = require('../models/User');
const { Op } = require('sequelize');
const { notifyUser } = require('../services/notificationService'); // existing service

async function campaignReminderJob() {
  try {
    console.log('🕒 Running campaign reminder job (Sequelize)...');

    const now = new Date();
    const sixDaysAhead = new Date();
    sixDaysAhead.setDate(now.getDate() + 6);

    // Find campaigns ending between now and six days ahead
    const campaigns = await VideoCampaign.findAll({
      where: {
        endDate: {
          [Op.between]: [now, sixDaysAhead]
        }
      },
      include: [{ model: User, as: 'creator', attributes: ['id', 'email', 'name', 'phone'] }], // optional association; if not defined we'll fetch user separately
    });

    // If your VideoCampaign model does not have association to User (createdBy), fallback to manual user lookup per campaign
    let handled = 0;
    for (const camp of campaigns) {
      const c = camp.toJSON ? camp.toJSON() : camp;
      let userObj = null;

      if (c.createdBy) {
        try {
          userObj = await User.findByPk(c.createdBy, { attributes: ['id', 'email', 'name', 'phone'] });
          if (userObj && userObj.toJSON) userObj = userObj.toJSON();
        } catch (e) {
          userObj = null;
        }
      }

      if (!userObj) {
        // fallback: attempt raw query via sequelize if user exists in users table
        const [rows] = await sequelize.query('SELECT id, email, name, phone FROM users WHERE id = ?', {
          replacements: [c.createdBy],
          type: sequelize.QueryTypes.SELECT,
        });
        userObj = rows || null;
      }

      const message = `Your campaign "${c.campaignName || c.campaign_name}" is ending soon (on ${c.endDate}). Please renew it.`;

      try {
        await notifyUser({
          userId: userObj?.id || null,
          email: userObj?.email || null,
          phone: userObj?.phone || null,
          subject: 'Campaign Expiry Reminder',
          message,
          type: 'reminder',
        });
        handled++;
      } catch (err) {
        console.warn('⚠️ notifyUser failed for campaign', c.id, err && err.message);
      }
    }

    console.log(`🕒 Reminder job executed for ${handled} campaigns`);
  } catch (err) {
    console.error('❌ Reminder job error:', err && err.message ? err.message : err);
  }
}

// Schedule it (example: run once per day at 09:00)
cron.schedule('0 9 * * *', campaignReminderJob);

// export for manual invocation
module.exports = campaignReminderJob;
