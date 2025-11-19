'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('logs', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      deviceId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'devices',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      campaignId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'campaigns',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      playbackAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      durationSeconds: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'completed',
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
    // await queryInterface.addIndex('logs', ['deviceId']);
    // await queryInterface.addIndex('logs', ['campaignId']);
    // await queryInterface.addIndex('logs', ['jingleId']);
    // await queryInterface.addIndex('logs', ['playbackAt']);
    // await queryInterface.addIndex('logs', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('logs');
  },
};
