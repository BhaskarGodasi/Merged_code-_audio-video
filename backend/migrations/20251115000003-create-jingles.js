'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('jingles', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },
      fileName: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      filePath: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      fileSize: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      mimeType: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      durationSeconds: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      uploadDate: {
        type: Sequelize.DATE,
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
    // await queryInterface.addIndex('jingles', ['title']);
    // await queryInterface.addIndex('jingles', ['clientId']);
    // await queryInterface.addIndex('jingles', ['isActive']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('jingles');
  },
};
