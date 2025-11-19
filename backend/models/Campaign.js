const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const Campaign = sequelize.define(
    'Campaign',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        brandId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            comment: 'Foreign key to brands table',
        },
        companyName: {
            type: DataTypes.STRING(160),
            allowNull: true,
        },
        contactPerson: {
            type: DataTypes.STRING(120),
            allowNull: false,
        },
        campaignName: {
            type: DataTypes.STRING(160),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(160),
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        phone: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('draft', 'scheduled', 'active', 'completed', 'expired'),
            allowNull: false,
            defaultValue: 'draft',
        },
        language: {
            type: DataTypes.STRING(80),
            allowNull: true,
        },
        state: {
            type: DataTypes.STRING(80),
            allowNull: true,
        },
    },
    {
        tableName: 'campaigns',
    },
);

	// The beforeSave hook keeps the status aligned with the schedule window
	Campaign.addHook('beforeSave', (campaign) => {
		if (campaign.startDate && campaign.endDate) {
			const today = new Date();
			const start = new Date(campaign.startDate);
			const end = new Date(campaign.endDate);

			if (today < start) {
				campaign.status = 'scheduled';
			} else if (today > end) {
				campaign.status = 'completed';
			} else {
				campaign.status = 'active';
			}
		}
	});

module.exports = Campaign;
