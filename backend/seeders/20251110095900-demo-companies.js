'use strict';

module.exports = {
	up: async (queryInterface) => {
		await queryInterface.bulkInsert('companies', [
			{
				name: 'Beverage Holdings',
				contactPerson: 'Deepa Iyer',
				email: 'deepa.iyer@beverageholdings.com',
				phone: '+91-1111111111',
				address: 'Mumbai, India',
				notes: 'Parent company for beverage brands',
				status: 'active',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'Global Electronics Group',
				contactPerson: 'Naveen Rao',
				email: 'naveen.rao@globalelectronics.com',
				phone: '+91-2222222222',
				address: 'New Delhi, India',
				notes: 'Owns multiple consumer electronics brands',
				status: 'active',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'Tata Group',
				contactPerson: 'Anita Sengupta',
				email: 'anita.sengupta@tatagroup.com',
				phone: '+91-3333333333',
				address: 'Pune, India',
				notes: 'Conglomerate covering automotive and industrial sectors',
				status: 'active',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'Amazon Global',
				contactPerson: 'Radhika Menon',
				email: 'radhika.menon@amazon.com',
				phone: '+91-4444444444',
				address: 'Bangalore, India',
				notes: 'Retail and technology conglomerate',
				status: 'active',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				name: 'HDFC Group',
				contactPerson: 'Mahesh Deshpande',
				email: 'mahesh.deshpande@hdfcgroup.com',
				phone: '+91-5555555555',
				address: 'Mumbai, India',
				notes: 'Banking and financial services conglomerate',
				status: 'active',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);
	},

	down: async (queryInterface) => {
		await queryInterface.bulkDelete('companies', null, {});
	},
};
