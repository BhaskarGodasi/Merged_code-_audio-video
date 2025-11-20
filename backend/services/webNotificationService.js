// services/webNotificationService.js

const { Notification, User } = require("../models");
const { getIO } = require("../utils/socket.js");

/**
 * 🔔 Create a new web notification
 */
const createWebNotification = async (userId, title, message, type = "info") => {
  try {
    console.log("🔔 Creating notification for user:", userId);

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`User ${userId} does not exist`);
    }

    // Create notification using Sequelize
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      createdAt: new Date(),
      isRead: false,
    });

    console.log("✅ Notification saved:", notification.id);

    // Emit via socket
    const io = getIO();
    if (io) {
      io.to(`user_${userId}`).emit("newNotification", notification);
      console.log(`📢 Notification emitted to user_${userId}`);
    }

    return notification;
  } catch (error) {
    console.error("❌ Error creating notification:", error.message);

    const tempNotification = {
      id: "temp-" + Date.now(),
      userId,
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    try {
      const io = getIO();
      if (io) {
        io.to(`user_${userId}`).emit("newNotification", tempNotification);
        console.log("⚠️ Temporary notification sent due to DB error");
      }
    } catch (socketError) {
      console.error("❌ Socket emit error:", socketError);
    }

    return tempNotification;
  }
};

/**
 * 📥 Get notifications for a user
 */
const getUserNotifications = async (userId) => {
  return await Notification.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    attributes: ["id", "title", "message", "type", "isRead", "createdAt"],
  });
};

/**
 * ✔ Mark notification as read
 */
const markNotificationRead = async (id) => {
  await Notification.update(
    { isRead: true },
    { where: { id } }
  );
};

module.exports = {
  createWebNotification,
  getUserNotifications,
  markNotificationRead,
};
