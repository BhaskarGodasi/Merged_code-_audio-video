const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Jingle = sequelize.define(
	'Jingle',
	{
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		title: {
			type: DataTypes.STRING(160),
			allowNull: false,
		},
		fileName: {
			type: DataTypes.STRING(200),
			allowNull: false,
		},
		filePath: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		fileSize: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
		},
		mimeType: {
			type: DataTypes.STRING(120),
			allowNull: false,
		},
		durationSeconds: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: true,
		},
		isActive: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		uploadDate: {
			type: DataTypes.DATE,
			allowNull: true,
		},
	},
	{
		tableName: 'jingles',
	},
);

module.exports = Jingle;
