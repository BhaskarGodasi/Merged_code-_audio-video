// utils/socketDevice.js
const { getIO } = require("./socket.js");

/**
 * Notify a device or multiple devices about campaign updates.
 */
const notifyDeviceCampaignUpdate = (deviceId, updateData = {}) => {
  try {
    const io = getIO();
    const payload = {
      message: "Campaign data updated",
      timestamp: new Date().toISOString(),
      ...updateData,
    };

    if (Array.isArray(deviceId)) {
      deviceId.forEach((id) =>
        io.to(`device_${id}`).emit("campaigns_updated", payload)
      );
      console.log(`🔔 Sent update to ${deviceId.length} devices`);
    } else {
      io.to(`device_${deviceId}`).emit("campaigns_updated", payload);
      console.log(`🔔 Sent update to device_${deviceId}`);
    }
  } catch (err) {
    console.error("❌ Error notifying devices:", err);
  }
};

/**
 * Notify about new campaign assignment for a specific device.
 */
const notifyNewCampaignAssignment = (deviceId, campaignData = {}) => {
  try {
    const io = getIO();
    const payload = {
      message: "New campaign assigned",
      timestamp: new Date().toISOString(),
      ...campaignData,
    };

    if (Array.isArray(deviceId)) {
      deviceId.forEach((id) =>
        io.to(`device_${id}`).emit("new_campaign_assigned", payload)
      );
      console.log(`🎯 Sent new campaign assignment to ${deviceId.length} devices`);
    } else {
      io.to(`device_${deviceId}`).emit("new_campaign_assigned", payload);
      console.log(`🎯 Sent new campaign assignment to device_${deviceId}`);
    }
  } catch (err) {
    console.error("❌ Error notifying new campaign:", err);
  }
};

module.exports = {
  notifyDeviceCampaignUpdate,
  notifyNewCampaignAssignment,
};
