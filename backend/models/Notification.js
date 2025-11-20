import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";

const Notification = sequelize.define("Notification", {
  title: { type: DataTypes.STRING },
  message: { type: DataTypes.TEXT },
  type: { type: DataTypes.STRING, defaultValue: "info" },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
});

Notification.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });

export default Notification;
