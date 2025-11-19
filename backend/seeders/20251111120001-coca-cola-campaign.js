'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get Coca-Cola client ID
    const clients = await queryInterface.sequelize.query(
      `SELECT id FROM clients WHERE name = 'Coca-Cola India' LIMIT 1;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (clients.length === 0) return;
    const cocaColaId = clients[0].id;
    
    // Get some jingles
    const jingles = await queryInterface.sequelize.query(
      `SELECT id FROM jingles LIMIT 3;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (jingles.length === 0) return;
    
    // Create a campaign for Coca-Cola (active campaign)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    await queryInterface.bulkInsert('campaigns', [
      {
        clientId: cocaColaId,
        brandName: 'Coca-Cola',
        contactPerson: 'Rajesh Kumar',
        campaignName: 'Summer Refreshment 2025',
        email: 'rajesh.kumar@coca-cola.com',
        phone: '+91-9876543210',
        startDate: yesterday,
        endDate: nextWeek,
        notes: 'Summer promotional campaign',
        createdAt: now,
        updatedAt: now
      }
    ], {});
    
    // Get the created campaign
    const campaigns = await queryInterface.sequelize.query(
      `SELECT id FROM campaigns WHERE campaignName = 'Summer Refreshment 2025' LIMIT 1;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (campaigns.length === 0) return;
    const campaignId = campaigns[0].id;
    
    // Link jingles to campaign
    const campaignJingles = jingles.map(jingle => ({
      campaignId: campaignId,
      jingleId: jingle.id,
      createdAt: now,
      updatedAt: now
    }));
    
    await queryInterface.bulkInsert('campaign_jingles', campaignJingles, {});
    
    // Get some devices
    const devices = await queryInterface.sequelize.query(
      `SELECT id FROM devices LIMIT 5;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    // Create logs for this campaign
    if (devices.length > 0) {
      const logs = [];
      
      // Create 50 logs spread across devices and jingles
      for (let i = 0; i < 50; i++) {
        const randomDevice = devices[Math.floor(Math.random() * devices.length)];
        const randomJingle = jingles[Math.floor(Math.random() * jingles.length)];
        const randomHoursAgo = Math.floor(Math.random() * 48); // Last 48 hours
        const playbackTime = new Date(now.getTime() - randomHoursAgo * 60 * 60 * 1000);
        
        logs.push({
          deviceId: randomDevice.id,
          campaignId: campaignId,
          jingleId: randomJingle.id,
          playbackAt: playbackTime,
          durationSeconds: 30,
          status: 'completed',
          details: null,
          createdAt: playbackTime,
          updatedAt: playbackTime
        });
      }
      
      await queryInterface.bulkInsert('logs', logs, {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('campaigns', {
      campaignName: 'Summer Refreshment 2025'
    }, {});
  }
};
