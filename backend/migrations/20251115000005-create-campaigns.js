'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('campaigns', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      brandId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'brands',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      contactPerson: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      campaignName: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('draft', 'scheduled', 'active', 'completed', 'expired'),
        allowNull: false,
        defaultValue: 'draft',
      },
      companyName: {
        type: Sequelize.STRING(160),
        allowNull: true,
      },
      language: {
        type: Sequelize.STRING(80),
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING(80),
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
    // await queryInterface.addIndex('campaigns', ['brandId']);
    // await queryInterface.addIndex('campaigns', ['status']);
    // await queryInterface.addIndex('campaigns', ['startDate', 'endDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('campaigns');
  },
};
