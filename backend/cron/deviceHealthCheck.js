// backend/cron/deviceHealthCheck.js
const cron = require('node-cron');
const Device = require('../models/Device');
const { Op } = require('sequelize');

async function deviceHealthCheck() {
  try {
    console.log('🩺 Running device health check (Sequelize)...');

    const threshold = new Date(Date.now() - 35 * 60 * 1000); // 35 minutes ago

    const [updatedCount] = await Device.update(
      { status: false },
      {
        where: {
          lastSeen: { [Op.lt]: threshold },
        },
      }
    );

    console.log(`🩺 Device health check executed, updated ${updatedCount} rows`);
  } catch (err) {
    console.error('Cron job error:', err && err.message ? err.message : err);
  }
}

// run every 30 minutes
cron.schedule('*/30 * * * *', deviceHealthCheck);

// export for manual run if needed
module.exports = deviceHealthCheck;
