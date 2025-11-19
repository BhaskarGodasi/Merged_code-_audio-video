'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('device_schedules', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      deviceId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        references: {
          model: 'devices',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      playbackWindowStart: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      playbackWindowEnd: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      playOrder: {
        type: Sequelize.JSON,
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
    // await queryInterface.addIndex('device_schedules', ['deviceId']);
    // await queryInterface.addIndex('device_schedules', ['isActive']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('device_schedules');
  },
};
