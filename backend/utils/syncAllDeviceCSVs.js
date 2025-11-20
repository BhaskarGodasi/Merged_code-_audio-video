// utils/syncAllDeviceCSVs.js
const { sequelize } = require('../models');
const { manuallyCreateCSV } = require('../services/csvService');

/**
 * Sync CSVs for all active devices based on their locations and active campaigns
 */
async function syncAllDeviceCSVs(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
        console.log(`🔄 Starting CSV sync for all devices on ${targetDate}...`);

        // Get all device locations
        const devices = await sequelize.query(`
      SELECT id, device_id, location, device_name 
      FROM device_locations 
      ORDER BY created_at DESC
    `, { type: sequelize.QueryTypes.SELECT });

        console.log(`📱 Found ${devices.length} devices to sync`);

        let synced = 0;
        let failed = 0;
        const results = [];

        for (const device of devices) {
            try {
                // Get live campaigns for this device's location
                // Using JSON containment operator @> for postgres
                const campaigns = await sequelize.query(`
          SELECT id, campaign_name, spots_per_day, status, locations, video
          FROM campaigns
          WHERE status IN ('live', 'active')
            AND (
              locations IS NULL 
              OR locations @> ?::jsonb
            )
          ORDER BY created_at ASC
        `, {
                    replacements: [JSON.stringify([device.location])],
                    type: sequelize.QueryTypes.SELECT
                });

                // Create/update CSV with GCD logic
                await manuallyCreateCSV(device.id, campaigns, targetDate);

                synced++;
                results.push({
                    deviceId: device.device_id,
                    location: device.location,
                    campaigns: campaigns.length,
                    status: 'synced'
                });

            } catch (err) {
                failed++;
                results.push({
                    deviceId: device.device_id,
                    location: device.location,
                    status: 'failed',
                    error: err.message
                });
                console.error(`❌ Failed to sync device ${device.device_id}:`, err.message);
            }
        }

        return {
            success: true,
            date: targetDate,
            totalDevices: devices.length,
            synced,
            failed,
            results
        };
    } catch (err) {
        console.error('❌ syncAllDeviceCSVs error:', err);
        throw err;
    }
}

module.exports = {
    syncAllDeviceCSVs,
};
