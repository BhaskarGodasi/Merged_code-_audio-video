'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        username: 'superadmin',
        email: 'superadmin@dooh.com',
        password: hashedPassword,
        role: 'superadmin',
        clientId: null,
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'admin',
        email: 'admin@dooh.com',
        password: hashedPassword,
        role: 'admin',
        clientId: null,
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      username: ['superadmin', 'admin']
    }, {});
  }
};
