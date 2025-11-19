const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const Brand = sequelize.define(
    'Brand',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(120),
            allowNull: false,
        },
        contactPerson: {
            type: DataTypes.STRING(120),
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
            type: DataTypes.STRING(30),
            allowNull: true,
        },
        companyId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
        // address and notes removed per UI requirements
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            allowNull: false,
            defaultValue: 'active',
        },
    },
    {
        tableName: 'brands',
        timestamps: true,
    },
);

module.exports = Brand;
