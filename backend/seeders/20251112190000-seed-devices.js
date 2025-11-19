'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if devices table already has rows
    const result = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as cnt FROM devices;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const count = result && result[0] ? Number(result[0].cnt) : 0;
    if (count > 0) {
      // Nothing to do
      return;
    }

    const now = new Date();

    await queryInterface.bulkInsert('devices', [
      {
        name: 'Mall Entrance - Zone A',
        serialNumber: 'SN-MALL-001',
        pairingCode: 'PAIR001',
        isPaired: false,
        status: 'offline',
        location: 'Ground floor, Gate A',
        ipAddress: null,
        volumeLevel: 70,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Station Platform 1',
        serialNumber: 'SN-STN-002',
        pairingCode: 'PAIR002',
        isPaired: false,
        status: 'offline',
        location: 'Platform 1 - East',
        ipAddress: null,
        volumeLevel: 60,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Food Court Speaker',
        serialNumber: 'SN-FOOD-003',
        pairingCode: 'PAIR003',
        isPaired: false,
        status: 'offline',
        location: 'Level 2 - Food Court',
        ipAddress: null,
        volumeLevel: 75,
        createdAt: now,
        updatedAt: now,
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('devices', {
      serialNumber: { [Sequelize.Op.in]: ['SN-MALL-001', 'SN-STN-002', 'SN-FOOD-003'] }
    }, {});
  }
};
