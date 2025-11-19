'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('client123', 10);
    
    // Get the first client's ID (Coca-Cola India)
    const clients = await queryInterface.sequelize.query(
      `SELECT id FROM clients WHERE name = 'Coca-Cola India' LIMIT 1;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (clients.length > 0) {
      await queryInterface.bulkInsert('users', [
        {
          username: 'cocacola',
          email: 'client@coca-cola.com',
          password: hashedPassword,
          role: 'client',
          clientId: clients[0].id,
          isActive: true,
          lastLogin: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      username: 'cocacola'
    }, {});
  }
};
