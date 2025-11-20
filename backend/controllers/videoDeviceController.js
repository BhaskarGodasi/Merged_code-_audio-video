// controllers/videoDeviceController.js
const { sequelize } = require('../models');
const fetch = require('node-fetch');
const { fetchCSVFromDB } = require('../utils/csvDB');
const { syncAllDeviceCSVs } = require('../utils/syncAllDeviceCSVs');
const {
    registerDeviceLocation,
    manuallyCreateCSV,
    getCSVByDeviceAndDate,
    getAllCSVsByDevice,
    deleteCSVByDevice
} = require('../services/csvService');
const { evaluateDeviceHealth } = require('../monitoring/engine');
const { pushAlert } = require('../monitoring/alerts');

/**
 * Device heartbeat handler
 */
const deviceHeartbeat = async (req, res) => {
    try {
        const payload = req.body || {};
        const device_id = payload.device_id;
        if (!device_id) return res.status(400).json({ success: false, error: 'device_id required' });

        // upsert device record
        await sequelize.query(
            `INSERT INTO devices(device_id, last_heartbeat, last_payload)
       VALUES (?, now(), ?)
       ON CONFLICT (device_id) DO UPDATE SET last_heartbeat = now(), last_payload = ?`,
            { replacements: [device_id, JSON.stringify(payload), JSON.stringify(payload)] }
        );

        // emit heartbeat over socket
        try {
            const app = req?.app || global?.appInstance;
            const io = app?.get?.('io') || (app?.get && app.get('io'));
            if (io) {
                io.emit('device:heartbeat', {
                    device_id,
                    last_heartbeat: new Date().toISOString(),
                    payload
                });
            }
        } catch (e) {
            console.warn('socket emit heartbeat failed', e?.message || e);
        }

        // evaluate immediate health
        try {
            const issues = await evaluateDeviceHealth(device_id, payload);
            if (issues && issues.length > 0) {
                for (const issue of issues) {
                    await pushAlert(device_id, issue.level || 'CRITICAL', issue.message);
                }
            }
        } catch (healthErr) {
            console.warn('evaluateDeviceHealth/pushAlert error', healthErr?.message || healthErr);
        }

        return res.json({ success: true, should_refresh: false });
    } catch (err) {
        console.error('deviceHeartbeat error:', err?.message || err);
        return res.status(500).json({ success: false, error: 'server error' });
    }
};

// Helper: reverse geocode
async function reverseGeocode(lat, lng) {
    try {
        const key = process.env.GEOCODING_API_KEY;
        if (!key) return null;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data || !data.results || !data.results.length) return null;

        const comp = data.results[0].address_components;
        const locality = comp.find(c => c.types.includes('locality') || c.types.includes('sublocality'));
        const admin = comp.find(c => c.types.includes('administrative_area_level_1'));
        return (locality && locality.long_name) || (admin && admin.long_name) || data.results[0].formatted_address;
    } catch (err) {
        console.error('Reverse geocode error', err);
        return null;
    }
}

// Register or update device info
const registerDevice = async (req, res) => {
    const { device_id, device_name, location, latitude, longitude, ip_address } = req.body;

    if (!device_id) {
        return res.status(400).json({ success: false, message: 'Device ID is required' });
    }

    try {
        let locationName = location || null;
        if (!locationName && latitude && longitude) {
            const guessed = await reverseGeocode(latitude, longitude);
            if (guessed) locationName = guessed;
        }

        const [result] = await sequelize.query(
            `INSERT INTO devices 
         (device_id, device_name, location, latitude, longitude, ip_address, last_seen)
       VALUES (?,?,?,?,?,?,NOW())
       ON CONFLICT (device_id) DO UPDATE
         SET device_name = COALESCE(EXCLUDED.device_name, devices.device_name),
             location     = COALESCE(EXCLUDED.location, devices.location),
             latitude     = COALESCE(EXCLUDED.latitude, devices.latitude),
             longitude    = COALESCE(EXCLUDED.longitude, devices.longitude),
             ip_address   = COALESCE(EXCLUDED.ip_address, devices.ip_address),
             last_seen    = NOW()
       RETURNING *`,
            {
                replacements: [device_id, device_name, locationName, latitude, longitude, ip_address],
                type: sequelize.QueryTypes.INSERT
            }
        );

        const device = result[0];
        await registerDeviceLocation(device_id, locationName, device_name);

        try {
            const io = req.app.get('io');
            if (io && device && device.location) {
                const normalized = String(device.location).trim();
                io.to(normalized).emit('deviceRegistered', {
                    device_id: device.device_id,
                    location: normalized,
                    timestamp: new Date().toISOString(),
                });
            }
        } catch (err) {
            console.error('Socket emit error after register:', err.message);
        }

        return res.json({ success: true, device });
    } catch (error) {
        console.error('registerDevice error:', error);
        return res.status(500).json({ success: false, message: 'Device register failed' });
    }
};

const getAllDevices = async (req, res) => {
    try {
        const devices = await sequelize.query(`
      SELECT 
        id,
        device_id,
        device_name,
        location,
        latitude,
        longitude,
        ip_address,
        status,
        last_seen,
        created_at,
        updated_at
      FROM devices 
      ORDER BY last_seen DESC
    `, { type: sequelize.QueryTypes.SELECT });

        console.log('Fetched devices:', devices);
        res.json({ success: true, devices });
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch devices' });
    }
};

const getLocations = async (req, res) => {
    try {
        const result = await sequelize.query(
            "SELECT DISTINCT location FROM devices WHERE location IS NOT NULL ORDER BY location",
            { type: sequelize.QueryTypes.SELECT }
        );
        const locations = result.map(r => r.location);
        res.json({ success: true, locations });
    } catch (err) {
        console.error('Error fetching locations:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch locations' });
    }
};

const updateLocationName = async (req, res) => {
    const { old_location, new_location } = req.body;

    if (!old_location || !new_location) {
        return res.status(400).json({
            success: false,
            message: 'Both old_location and new_location are required',
        });
    }

    const t = await sequelize.transaction();

    try {
        // 1. Update devices
        const [deviceUpdate] = await sequelize.query(
            `UPDATE devices
       SET location = ?
       WHERE location = ?
       RETURNING device_id, location`,
            {
                replacements: [new_location.trim(), old_location.trim()],
                transaction: t
            }
        );

        // 2. Update campaigns
        const [campaignUpdate] = await sequelize.query(
            `UPDATE campaigns
       SET locations = ARRAY(
         SELECT CASE WHEN unnest(locations) = ? THEN ? ELSE unnest(locations) END
       )
       WHERE ? = ANY(locations)
       RETURNING id, campaign_name`,
            {
                replacements: [old_location.trim(), new_location.trim(), old_location.trim()],
                transaction: t
            }
        );

        await t.commit();

        try {
            const io = req.app.get('io');
            if (io) {
                io.emit('location:updated', {
                    old_location: old_location.trim(),
                    new_location: new_location.trim(),
                    updated_devices: deviceUpdate ? deviceUpdate.length : 0,
                    updated_campaigns: campaignUpdate ? campaignUpdate.length : 0,
                    timestamp: new Date().toISOString(),
                });
            }
        } catch (socketErr) {
            console.warn('⚠️ Socket emit failed (updateLocationName):', socketErr.message);
        }

        res.json({
            success: true,
            message: `Location "${old_location}" renamed to "${new_location}"`,
            updated_devices: deviceUpdate ? deviceUpdate.length : 0,
            updated_campaigns: campaignUpdate ? campaignUpdate.length : 0,
        });
    } catch (err) {
        await t.rollback();
        console.error('❌ Error updating location name:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update location name',
            error: err.message,
        });
    }
};

const updateDeviceDetails = async (req, res) => {
    const { device_id, device_name, location } = req.body;
    const updatedBy = req.user?.name || 'Admin';

    if (!device_id) {
        return res.status(400).json({ success: false, message: 'Device ID is required' });
    }

    try {
        const devices = await sequelize.query(
            'SELECT * FROM devices WHERE device_id = ?',
            { replacements: [device_id], type: sequelize.QueryTypes.SELECT }
        );

        if (devices.length === 0) {
            return res.status(404).json({ success: false, message: 'Device not found' });
        }

        const [result] = await sequelize.query(
            `UPDATE devices
       SET
         device_name = COALESCE(?, device_name),
         location = COALESCE(?, location),
         updated_at = NOW()
       WHERE device_id = ?
       RETURNING *`,
            {
                replacements: [device_name, location, device_id],
                type: sequelize.QueryTypes.UPDATE
            }
        );

        const updatedDevice = result[0];

        try {
            const io = req.app.get('io');
            if (io) {
                io.emit('device:updated', {
                    ...updatedDevice,
                    updatedBy,
                    updatedAt: new Date().toISOString()
                });
            }
        } catch (socketErr) {
            console.error('Socket emit error:', socketErr);
        }

        res.json({
            success: true,
            message: 'Device updated successfully',
            device: updatedDevice
        });
    } catch (err) {
        console.error('updateDeviceDetails error:', err);
        res.status(500).json({ success: false, message: 'Failed to update device details' });
    }
};

const getDeviceCSV = async (req, res) => {
    const { deviceId } = req.params;
    const dateParam = req.query.date;
    const date = dateParam ? new Date(dateParam) : new Date();
    const csvDate = date.toISOString().split("T")[0];

    try {
        const csv = await fetchCSVFromDB(deviceId, csvDate);

        if (!csv) {
            return res.status(404).json({
                success: false,
                message: "CSV not found for this device or date",
            });
        }

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${deviceId}_${csvDate}.csv"`);
        return res.send(csv);

    } catch (err) {
        console.error("❌ getDeviceCSV error:", err.message);
        return res.status(500).json({
            success: false,
            message: err.message || "Internal Server Error",
        });
    }
};

const pingAllDevicesForCsvUpdate = async (req, res) => {
    try {
        const result = await syncAllDeviceCSVs();

        try {
            const io = req.app.get('io');
            if (io) {
                io.emit('csv:batch:update', { ...result, timestamp: new Date().toISOString() });
            }
        } catch (emitErr) {
            console.warn('Socket emit failed:', emitErr.message);
        }

        return res.json(result);
    } catch (err) {
        console.error('❌ pingAllDevicesForCsvUpdate error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

const getDeviceInfo = async (req, res) => {
    try {
        const { deviceId } = req.params;
        if (!deviceId) return res.status(400).json({ success: false, message: 'Device ID required' });

        const q = `
      SELECT d.*,
             t.id AS technician_id,
             t.name AS technician_name,
             t.phone AS technician_phone,
             t.email AS technician_email
      FROM devices d
      LEFT JOIN technicians t ON d.technician_id = t.id
      WHERE d.device_id = ?
      LIMIT 1
    `;
        const result = await sequelize.query(q, {
            replacements: [deviceId],
            type: sequelize.QueryTypes.SELECT
        });

        if (!result.length) return res.status(404).json({ success: false, message: 'Device not found' });

        return res.json({ success: true, device: result[0] });
    } catch (err) {
        console.error('getDeviceInfo error:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch device' });
    }
};

const fetchCSVByDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const csvDate = req.query.date || new Date().toISOString().split('T')[0];

        if (!deviceId) return res.status(400).json({ success: false, message: 'Device ID is required' });

        const deviceCheck = await sequelize.query(
            `SELECT id FROM device_locations WHERE device_id = ?`,
            { replacements: [deviceId], type: sequelize.QueryTypes.SELECT }
        );

        if (deviceCheck.length === 0) {
            return res.status(404).json({ success: false, message: 'Device not found' });
        }

        const deviceLocationId = deviceCheck[0].id;
        const csvData = await getCSVByDeviceAndDate(deviceLocationId, csvDate);

        if (!csvData || !csvData.csv_content) {
            return res.status(404).json({ success: false, message: 'CSV not found' });
        }

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="device_${deviceId}_${csvDate}.csv"`);
        res.send(csvData.csv_content);
    } catch (error) {
        console.error('❌ Error fetching CSV:', error);
        res.status(500).json({ success: false, message: 'Error fetching CSV' });
    }
};

const checkCampaignUpdates = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { lastSyncTime } = req.query;

        if (!deviceId) return res.status(400).json({ success: false, message: 'Device ID is required' });

        const deviceCheck = await sequelize.query(
            `SELECT id, location FROM device_locations WHERE device_id = ?`,
            { replacements: [deviceId], type: sequelize.QueryTypes.SELECT }
        );

        if (deviceCheck.length === 0) {
            return res.status(404).json({ success: false, message: 'Device not found' });
        }

        const deviceLocationId = deviceCheck[0].id;
        const deviceLocation = deviceCheck[0].location;

        let campaignsQuery = `
      SELECT c.* FROM campaigns c
      WHERE c.status = 'live'
      AND c.locations @> ARRAY[?]::text[]
    `;
        const replacements = [deviceLocation];

        if (lastSyncTime) {
            campaignsQuery += ` AND c.updated_at > ?`;
            replacements.push(new Date(parseInt(lastSyncTime)));
        }

        campaignsQuery += ` ORDER BY c.created_at ASC`; // Removed priority as it might not exist

        const campaigns = await sequelize.query(campaignsQuery, {
            replacements,
            type: sequelize.QueryTypes.SELECT
        });

        const today = new Date().toISOString().split('T')[0];
        const csvData = await getCSVByDeviceAndDate(deviceLocationId, today);

        const hasUpdates = campaigns.length > 0;
        const csvNeedsUpdate = !csvData || (lastSyncTime && new Date(csvData.updated_at) > new Date(parseInt(lastSyncTime)));

        res.json({
            success: true,
            hasUpdates,
            csvNeedsUpdate,
            campaignCount: campaigns.length,
            campaigns: campaigns.map(c => ({
                id: c.id,
                campaign_name: c.campaign_name,
                status: c.status,
                updated_at: c.updated_at
            })),
            csvDate: today,
            serverTime: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error checking campaign updates:', error);
        res.status(500).json({ success: false, message: 'Error checking campaign updates' });
    }
};

const getCSVContent = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const csvDate = req.query.date || new Date().toISOString().split('T')[0];

        const deviceCheck = await sequelize.query(
            `SELECT id FROM device_locations WHERE device_id = ?`,
            { replacements: [deviceId], type: sequelize.QueryTypes.SELECT }
        );

        if (deviceCheck.length === 0) return res.status(404).json({ success: false, message: 'Device not found' });

        const deviceLocationId = deviceCheck[0].id;
        const csvData = await getCSVByDeviceAndDate(deviceLocationId, csvDate);

        if (!csvData) return res.status(404).json({ success: false, message: 'CSV not found' });

        res.json({
            success: true,
            data: {
                deviceId,
                csvDate,
                content: csvData.csv_content,
                updatedAt: csvData.updated_at
            }
        });
    } catch (error) {
        console.error('❌ Error fetching CSV content:', error);
        res.status(500).json({ success: false, message: 'Error fetching CSV content' });
    }
};

const getCSVHistory = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const limit = parseInt(req.query.limit) || 30;

        const deviceCheck = await sequelize.query(
            `SELECT id FROM device_locations WHERE device_id = ?`,
            { replacements: [deviceId], type: sequelize.QueryTypes.SELECT }
        );

        if (deviceCheck.length === 0) return res.status(404).json({ success: false, message: 'Device not found' });

        const deviceLocationId = deviceCheck[0].id;
        const csvHistory = await getAllCSVsByDevice(deviceLocationId, limit);

        res.json({
            success: true,
            data: csvHistory,
            count: csvHistory.length
        });
    } catch (error) {
        console.error('❌ Error fetching CSV history:', error);
        res.status(500).json({ success: false, message: 'Error fetching CSV history' });
    }
};

const deleteCSV = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { csvDate } = req.body;

        if (!csvDate) return res.status(400).json({ success: false, message: 'CSV date is required' });

        const deviceCheck = await sequelize.query(
            `SELECT id FROM device_locations WHERE device_id = ?`,
            { replacements: [deviceId], type: sequelize.QueryTypes.SELECT }
        );

        if (deviceCheck.length === 0) return res.status(404).json({ success: false, message: 'Device not found' });

        const deviceLocationId = deviceCheck[0].id;
        await deleteCSVByDevice(deviceLocationId, csvDate);

        res.json({ success: true, message: 'CSV deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting CSV:', error);
        res.status(500).json({ success: false, message: 'Error deleting CSV' });
    }
};

const createDeviceCSV = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { campaigns, csvDate } = req.body;

        if (!deviceId || !Array.isArray(campaigns)) {
            return res.status(400).json({ success: false, message: 'Device ID and campaigns array are required' });
        }

        const deviceCheck = await sequelize.query(
            `SELECT id FROM device_locations WHERE device_id = ?`,
            { replacements: [deviceId], type: sequelize.QueryTypes.SELECT }
        );

        if (deviceCheck.length === 0) return res.status(404).json({ success: false, message: 'Device not found' });

        const deviceLocationId = deviceCheck[0].id;
        const date = csvDate || new Date().toISOString().split('T')[0];

        await manuallyCreateCSV(deviceLocationId, campaigns, date);

        res.json({
            success: true,
            message: 'CSV created successfully',
            data: { deviceId, csvDate: date, campaignCount: campaigns.length }
        });
    } catch (error) {
        console.error('❌ Error creating CSV:', error);
        res.status(500).json({ success: false, message: 'Error creating CSV' });
    }
};

module.exports = {
    deviceHeartbeat,
    registerDevice,
    getAllDevices,
    getLocations,
    updateLocationName,
    updateDeviceDetails,
    getDeviceCSV,
    pingAllDevicesForCsvUpdate,
    getDeviceInfo,
    fetchCSVByDevice,
    checkCampaignUpdates,
    getCSVContent,
    getCSVHistory,
    deleteCSV,
    createDeviceCSV
};
