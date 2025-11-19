const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Log = sequelize.define(
	'Log',
	{
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		deviceId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
		},
		campaignId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: true, // Made nullable for new device schedule system
		},
		jingleId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
		},
		playbackAt: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		durationSeconds: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: true,
		},
		status: {
			type: DataTypes.ENUM('scheduled', 'completed', 'failed'),
			allowNull: false,
			defaultValue: 'completed',
		},
	},
	{
		tableName: 'logs',
	},
);

	Log.addHook('beforeSave', (log) => {
		if (!log.playbackAt) {
			log.playbackAt = new Date();
		}
	});

module.exports = Log;
