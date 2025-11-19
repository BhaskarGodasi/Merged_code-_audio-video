'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('companies', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },
      contactPerson: {
        type: Sequelize.STRING(160),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(160),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(40),
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      sector: {
        type: Sequelize.ENUM('private', 'government'),
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING(160),
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Indexes already exist in production database
    // await queryInterface.addIndex('companies', ['name']);
    // await queryInterface.addIndex('companies', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('companies');
  },
};
