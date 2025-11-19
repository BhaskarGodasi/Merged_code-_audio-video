'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('device_schedule_jingles', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      deviceScheduleId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'device_schedules',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      jingleId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'jingles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      spots: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    // await queryInterface.addIndex('device_schedule_jingles', ['deviceScheduleId']);
    // await queryInterface.addIndex('device_schedule_jingles', ['jingleId']);
    // await queryInterface.addIndex('device_schedule_jingles', ['startDate', 'endDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('device_schedule_jingles');
  },
};
