'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('devices', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      serialNumber: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true,
      },
      pairingCode: {
        type: Sequelize.STRING(8),
        allowNull: false,
        unique: true,
      },
      isPaired: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      status: {
        type: Sequelize.ENUM('offline', 'online', 'error', 'maintenance'),
        allowNull: false,
        defaultValue: 'offline',
      },
      lastSeenAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      pairedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING(180),
        allowNull: true,
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ipAddress: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      volumeLevel: {
        type: Sequelize.INTEGER,
        allowNull: true,
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
    // await queryInterface.addIndex('devices', ['serialNumber']);
    // await queryInterface.addIndex('devices', ['pairingCode']);
    // await queryInterface.addIndex('devices', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('devices');
  },
};
