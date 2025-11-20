// utils/csvDB.js
const { sequelize } = require('../models');

/**
 * Fetch CSV from database by device ID and date
 * @param {string} deviceId - Device ID (VARCHAR)
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string|null} CSV content or null
 */
async function fetchCSVFromDB(deviceId, date) {
    try {
        // First get device_location_id from device_locations table
        const [deviceResult] = await sequelize.query(
            `SELECT id FROM device_locations WHERE device_id = ? LIMIT 1`,
            { replacements: [deviceId], type: sequelize.QueryTypes.SELECT }
        );

        if (!deviceResult) {
            console.warn(`⚠️ Device location not found for device_id: ${deviceId}`);
            return null;
        }

        const deviceLocationId = deviceResult.id;

        // Fetch CSV content
        const [csvResult] = await sequelize.query(
            `SELECT csv_content, gcd_value, total_spots, created_at 
       FROM device_csvs 
       WHERE device_location_id = ? AND csv_date = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
            { replacements: [deviceLocationId, date], type: sequelize.QueryTypes.SELECT }
        );

        if (csvResult) {
            console.log(`✅ CSV found for device ${deviceId} on ${date} (GCD: ${csvResult.gcd_value}, Total: ${csvResult.total_spots})`);
            return csvResult.csv_content;
        }

        console.warn(`⚠️ No CSV found for device ${deviceId} on ${date}`);
        return null;
    } catch (err) {
        console.error('❌ fetchCSVFromDB error:', err.message);
        throw err;
    }
}

module.exports = {
    fetchCSVFromDB
};
