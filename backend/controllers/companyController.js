const { Company, Client } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const listCompanies = asyncHandler(async (req, res) => {
	const companies = await Company.findAll({
		order: [['createdAt', 'DESC']],
		include: [{ model: Client, as: 'brands' }],
	});

	res.json(companies.map((company) => company.get({ plain: true })));
});

const getCompanyById = asyncHandler(async (req, res) => {
	const company = await Company.findByPk(req.params.id, {
		include: [{ model: Client, as: 'brands' }],
	});

	if (!company) {
		return res.status(404).json({ error: true, message: 'Company not found' });
	}

	res.json(company.get({ plain: true }));
});

const createCompany = asyncHandler(async (req, res) => {
	const payload = {
		name: req.body.name,
		contactPerson: req.body.contactPerson || null,
		email: req.body.email || null,
		phone: req.body.phone || null,
		address: req.body.address || null,
		state: req.body.state || null,
		city: req.body.city || null,
		sector: req.body.sector || null,
		category: req.body.category || null,
		notes: req.body.notes || null,
		status: req.body.status || 'active',
	};

	const company = await Company.create(payload);

	res.status(201).json(company.get({ plain: true }));
});

const updateCompany = asyncHandler(async (req, res) => {
	const company = await Company.findByPk(req.params.id);

	if (!company) {
		return res.status(404).json({ error: true, message: 'Company not found' });
	}

	const payload = {
		name: req.body.name ?? company.name,
		contactPerson: req.body.contactPerson ?? company.contactPerson,
		email: req.body.email ?? company.email,
		phone: req.body.phone ?? company.phone,
		address: req.body.address ?? company.address,
		state: req.body.state ?? company.state,
		city: req.body.city ?? company.city,
		sector: req.body.sector ?? company.sector,
		category: req.body.category ?? company.category,
		notes: req.body.notes ?? company.notes,
		status: req.body.status ?? company.status,
	};

	await company.update(payload);

	res.json(company.get({ plain: true }));
});

const deleteCompany = asyncHandler(async (req, res) => {
	const company = await Company.findByPk(req.params.id, {
		include: [{ model: Client, as: 'brands', attributes: ['id'] }],
	});

	if (!company) {
		return res.status(404).json({ error: true, message: 'Company not found' });
	}

	if (company.brands && company.brands.length > 0) {
		return res.status(400).json({
			error: true,
			message: 'Cannot delete company with associated brands. Reassign or delete brands first.',
		});
	}

	await company.destroy();

	res.json({ message: 'Company deleted successfully' });
});

module.exports = {
	listCompanies,
	getCompanyById,
	createCompany,
	updateCompany,
	deleteCompany,
};
