const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeviceScheduleJingle = sequelize.define(
	'DeviceScheduleJingle',
	{
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		deviceScheduleId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
			references: {
				model: 'device_schedules',
				key: 'id',
			},
			onDelete: 'CASCADE',
		},
		jingleId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
			references: {
				model: 'jingles',
				key: 'id',
			},
			onDelete: 'CASCADE',
		},
		startDate: {
			type: DataTypes.DATEONLY,
			allowNull: false,
			comment: 'Start date for this jingle to play',
		},
		endDate: {
			type: DataTypes.DATEONLY,
			allowNull: false,
			comment: 'End date for this jingle to play',
		},
		spots: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
			defaultValue: 1,
			validate: {
				min: 1,
			},
			comment: 'Number of times this jingle should play per day (used in GCD play order algorithm)',
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			allowNull: false,
		},
	},
	{
		tableName: 'device_schedule_jingles',
		indexes: [
			{
				fields: ['deviceScheduleId'],
			},
			{
				fields: ['jingleId'],
			},
			{
				fields: ['startDate', 'endDate'],
			},
		],
	},
);

module.exports = DeviceScheduleJingle;
