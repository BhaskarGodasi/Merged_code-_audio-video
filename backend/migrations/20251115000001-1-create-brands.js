'use strict';

/** 
 * Brands table migration - renamed from 'clients' in old schema
 * This table represents brands/clients who run advertising campaigns
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('brands', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      contactPerson: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(160),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      companyId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'companies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Indexes already exist in production database
    // await queryInterface.addIndex('brands', ['name']);
    // await queryInterface.addIndex('brands', ['companyId']);
    // await queryInterface.addIndex('brands', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('brands');
  },
};
