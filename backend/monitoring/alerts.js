// monitoring/alerts.js
const { sequelize } = require('../models');

/**
 * Push alert to database and notify via socket
 */
const pushAlert = async (deviceId, level, message) => {
    try {
        // Assuming there is an alerts table or we just log it
        console.log(`[ALERT] Device: ${deviceId} | Level: ${level} | Message: ${message}`);

        // You might want to insert into a real table here
        // await sequelize.query('INSERT INTO alerts ...');

        // Emit socket event if needed (will be handled by controller usually, but helper can too)
        // const io = require('../utils/socket').getIO();
        // io.emit('alert', { deviceId, level, message });

    } catch (err) {
        console.error('pushAlert error:', err);
    }
};

module.exports = {
    pushAlert
};
