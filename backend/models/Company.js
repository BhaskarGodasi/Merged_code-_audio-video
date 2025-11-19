const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define(
	'Company',
	{
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING(160),
			allowNull: false,
		},
		contactPerson: {
			type: DataTypes.STRING(160),
			allowNull: true,
		},
		email: {
			type: DataTypes.STRING(160),
			allowNull: true,
			validate: {
				isEmail: true,
			},
		},
		phone: {
			type: DataTypes.STRING(40),
			allowNull: true,
		},
		address: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		state: {
			type: DataTypes.STRING(120),
			allowNull: true,
		},
		city: {
			type: DataTypes.STRING(120),
			allowNull: true,
		},
		sector: {
			type: DataTypes.ENUM('private', 'government'),
			allowNull: true,
		},
		category: {
			type: DataTypes.STRING(160),
			allowNull: true,
		},
		notes: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		status: {
			type: DataTypes.ENUM('active', 'inactive'),
			allowNull: false,
			defaultValue: 'active',
		},
	},
	{
		tableName: 'companies',
		timestamps: true,
	},
);

module.exports = Company;
