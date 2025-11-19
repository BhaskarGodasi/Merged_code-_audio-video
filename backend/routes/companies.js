const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
	listCompanies,
	getCompanyById,
	createCompany,
	updateCompany,
	deleteCompany,
} = require('../controllers/companyController');

router.use(authenticate, authorize('admin', 'superadmin'));

router.get('/', listCompanies);
router.get('/:id', getCompanyById);
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

module.exports = router;
