const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CampaignJingle = sequelize.define(
	'CampaignJingle',
	{
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		campaignId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
			references: {
				model: 'campaigns',
				key: 'id',
			},
		},
		jingleId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
			references: {
				model: 'jingles',
				key: 'id',
			},
		},
	},
	{
		tableName: 'campaign_jingles',
		indexes: [
			{
				unique: true,
				fields: ['campaignId', 'jingleId'],
			},
		],
	},
);

module.exports = CampaignJingle;
