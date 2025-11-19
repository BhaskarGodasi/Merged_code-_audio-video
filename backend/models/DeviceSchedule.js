const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeviceSchedule = sequelize.define(
	'DeviceSchedule',
	{
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		deviceId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
			references: {
				model: 'devices',
				key: 'id',
			},
			onDelete: 'CASCADE',
		},
		playbackWindowStart: {
			type: DataTypes.TIME,
			allowNull: false,
			comment: 'Daily playback start time (HH:MM:SS)',
		},
		playbackWindowEnd: {
			type: DataTypes.TIME,
			allowNull: false,
			comment: 'Daily playback end time (HH:MM:SS)',
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			allowNull: false,
		},
		playOrder: {
			type: DataTypes.JSON,
			allowNull: true,
			comment: 'Generated play order sequence based on GCD algorithm',
		},
	},
	{
		tableName: 'device_schedules',
		indexes: [
			{
				fields: ['deviceId'],
			},
		],
	},
);

module.exports = DeviceSchedule;
