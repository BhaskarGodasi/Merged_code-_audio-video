const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Device = sequelize.define(
	'Device',
	{
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING(120),
			allowNull: true,
		},
		serialNumber: {
			type: DataTypes.STRING(120),
			allowNull: false,
			unique: true,
		},
		pairingCode: {
			type: DataTypes.STRING(8),
			allowNull: false,
				unique: true,
		},
		isPaired: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		status: {
			type: DataTypes.ENUM('offline', 'online', 'error', 'maintenance'),
			allowNull: false,
			defaultValue: 'offline',
		},
		lastSeenAt: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		pairedAt: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		location: {
			type: DataTypes.STRING(180),
			allowNull: true,
		},
		latitude: {
			type: DataTypes.DECIMAL(10, 8),
			allowNull: true,
		},
		longitude: {
			type: DataTypes.DECIMAL(11, 8),
			allowNull: true,
		},
		notes: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		ipAddress: {
			type: DataTypes.STRING(64),
			allowNull: true,
		},
		volumeLevel: {
			type: DataTypes.INTEGER,
			allowNull: true,
			validate: {
				min: 0,
				max: 100,
			},
		},
	},
	{
		tableName: 'devices',
	},
);

module.exports = Device;
