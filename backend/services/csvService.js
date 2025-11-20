// services/csvService.js
const { sequelize } = require('../models');
const { generateAdPlayOrder } = require('../utils/helpers');

/**
 * Register a device location in the device_locations table
 */
async function registerDeviceLocation(deviceId, location, deviceName = null) {
    try {
        const [result] = await sequelize.query(`
      INSERT INTO device_locations (device_id, location, device_name, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
      ON CONFLICT (device_id) 
      DO UPDATE SET 
        location = EXCLUDED.location,
        device_name = COALESCE(EXCLUDED.device_name, device_locations.device_name),
        updated_at = NOW()
      RETURNING *
    `, {
            replacements: [deviceId, location, deviceName],
            type: sequelize.QueryTypes.INSERT // or SELECT for RETURNING
        });
        // Sequelize INSERT with RETURNING returns [[result], metadata] or just result depending on dialect/version
        // For raw query with RETURNING, it usually returns the rows in the first element of the array
        return result[0];
    } catch (err) {
        console.error('registerDeviceLocation error:', err);
        // throw err; // Suppress error to avoid crashing if table doesn't exist yet
        return null;
    }
}

/**
 * Get CSV by device location ID and date
 */
async function getCSVByDeviceAndDate(deviceLocationId, date) {
    try {
        const [row] = await sequelize.query(`
      SELECT * FROM device_csvs 
      WHERE device_location_id = ? AND csv_date = ?
      LIMIT 1
    `, {
            replacements: [deviceLocationId, date],
            type: sequelize.QueryTypes.SELECT
        });

        return row || null;
    } catch (err) {
        console.error('getCSVByDeviceAndDate error:', err);
        return null;
    }
}

/**
 * Manually create or update CSV for a device with GCD-based campaign distribution
 */
async function manuallyCreateCSV(deviceLocationId, campaigns, date) {
    try {
        if (!campaigns || campaigns.length === 0) {
            console.log(`No campaigns for device ${deviceLocationId}, creating empty CSV`);

            const emptyCSV = 'id,campaign_name,spots_per_day,order\n';

            await sequelize.query(`
        INSERT INTO device_csvs (device_location_id, csv_date, csv_content, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
        ON CONFLICT (device_location_id, csv_date)
        DO UPDATE SET csv_content = EXCLUDED.csv_content, updated_at = NOW()
      `, {
                replacements: [deviceLocationId, date, emptyCSV]
            });

            return { success: true, isEmpty: true };
        }

        // Apply GCD algorithm using existing helper
        // Map campaigns to format expected by generateAdPlayOrder
        const jingles = campaigns.map(c => ({
            id: c.id,
            title: c.campaignName || c.campaign_name,
            spots: c.spotsPerDay || c.spots_per_day || 1,
            videoUrl: c.videoUrl || c.video_url, // Pass through extra data
            // filename: c.videoName // Optional
        }));

        const playOrderResult = generateAdPlayOrder(jingles);

        // Build CSV content
        let csvContent = 'position,campaign_id,campaign_name,spots_allocated,video_url\n';

        playOrderResult.playOrder.forEach((item, index) => {
            // Find original campaign to get video URL if not in item
            const original = jingles.find(j => j.id === item.jingleId); // generateAdPlayOrder uses jingleId
            const videoUrl = original ? original.videoUrl : '';

            csvContent += `${index + 1},${item.jingleId},"${item.title}",${original ? original.spots : 0},${videoUrl}\n`;
        });

        // Store in database
        await sequelize.query(`
      INSERT INTO device_csvs (device_location_id, csv_date, csv_content, gcd_value, total_spots, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      ON CONFLICT (device_location_id, csv_date)
      DO UPDATE SET 
        csv_content = EXCLUDED.csv_content,
        gcd_value = EXCLUDED.gcd_value,
        total_spots = EXCLUDED.total_spots,
        updated_at = NOW()
    `, {
            replacements: [deviceLocationId, date, csvContent, playOrderResult.gcd, playOrderResult.totalAds]
        });

        console.log(`✅ CSV created/updated for device ${deviceLocationId} on ${date} with GCD=${playOrderResult.gcd}, total spots=${playOrderResult.totalAds}`);

        return {
            success: true,
            gcd: playOrderResult.gcd,
            totalSpots: playOrderResult.totalAds,
            campaignCount: campaigns.length
        };
    } catch (err) {
        console.error('manuallyCreateCSV error:', err);
        throw err;
    }
}

async function getAllCSVsByDevice(deviceLocationId, limit = 30) {
    const rows = await sequelize.query(`
        SELECT * FROM device_csvs 
        WHERE device_location_id = ? 
        ORDER BY csv_date DESC 
        LIMIT ?`,
        { replacements: [deviceLocationId, limit], type: sequelize.QueryTypes.SELECT }
    );
    return rows;
}

async function deleteCSVByDevice(deviceLocationId, date) {
    await sequelize.query(`
        DELETE FROM device_csvs 
        WHERE device_location_id = ? AND csv_date = ?`,
        { replacements: [deviceLocationId, date] }
    );
}

module.exports = {
    registerDeviceLocation,
    getCSVByDeviceAndDate,
    manuallyCreateCSV,
    getAllCSVsByDevice,
    deleteCSVByDevice
};
