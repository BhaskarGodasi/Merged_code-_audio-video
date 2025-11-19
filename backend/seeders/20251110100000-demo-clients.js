'use strict';

module.exports = {
	up: async (queryInterface) => {
		const [companies] = await queryInterface.sequelize.query('SELECT id, name FROM companies');
		const companyMap = companies.reduce((acc, company) => {
			acc[company.name] = company.id;
			return acc;
		}, {});

		await queryInterface.bulkInsert('clients', [
			{
				name: 'Coca-Cola India',
				contactPerson: 'Rajesh Kumar',
				email: 'rajesh.kumar@coca-cola.com',
				phone: '+91-9876543210',
				address: 'Mumbai, Maharashtra',
				notes: 'Major beverage brand, runs seasonal campaigns',
				status: 'active',
				companyId: companyMap['Beverage Holdings'] || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'Samsung Electronics',
				contactPerson: 'Priya Sharma',
				email: 'priya.sharma@samsung.com',
				phone: '+91-9876543211',
				address: 'New Delhi',
				notes: 'Electronics and mobile campaigns',
				status: 'active',
				companyId: companyMap['Global Electronics Group'] || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'Tata Motors',
				contactPerson: 'Amit Patel',
				email: 'amit.patel@tatamotors.com',
				phone: '+91-9876543212',
				address: 'Pune, Maharashtra',
				notes: 'Automotive advertising campaigns',
				status: 'active',
				companyId: companyMap['Tata Group'] || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'Amazon India',
				contactPerson: 'Sneha Desai',
				email: 'sneha.desai@amazon.in',
				phone: '+91-9876543213',
				address: 'Bangalore, Karnataka',
				notes: 'E-commerce promotional campaigns',
				status: 'active',
				companyId: companyMap['Amazon Global'] || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'HDFC Bank',
				contactPerson: 'Vikram Reddy',
				email: 'vikram.reddy@hdfcbank.com',
				phone: '+91-9876543214',
				address: 'Mumbai, Maharashtra',
				notes: 'Financial services advertising',
				status: 'active',
				companyId: companyMap['HDFC Group'] || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		], {});
	},

	down: async (queryInterface) => {
		await queryInterface.bulkDelete('clients', null, {});
	},
};
