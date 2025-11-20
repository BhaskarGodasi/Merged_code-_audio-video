// monitoring/engine.js
/**
 * Evaluate device health based on heartbeat payload
 */
const evaluateDeviceHealth = async (deviceId, payload) => {
    const issues = [];

    // Example checks
    if (payload.cpu_usage && payload.cpu_usage > 90) {
        issues.push({ level: 'WARNING', message: 'High CPU usage' });
    }

    if (payload.memory_usage && payload.memory_usage > 90) {
        issues.push({ level: 'WARNING', message: 'High Memory usage' });
    }

    if (payload.disk_space && payload.disk_space < 10) {
        issues.push({ level: 'CRITICAL', message: 'Low Disk Space' });
    }

    return issues;
};

module.exports = {
    evaluateDeviceHealth
};
