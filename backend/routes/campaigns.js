const express = require('express');
const { body } = require('express-validator');
const campaignController = require('../controllers/campaignController');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

const baseValidation = [
	body('brandId').notEmpty().isInt({ gt: 0 }).withMessage('Brand must be selected'),
	body('companyName').notEmpty().withMessage('Company name is required'),
	body('contactPerson').notEmpty().withMessage('Contact person is required'),
	body('campaignName').notEmpty().withMessage('Campaign name is required'),
	body('email').isEmail().withMessage('Valid email is required'),
	body('phone').notEmpty().withMessage('Phone number is required'),
	body('startDate').isISO8601().withMessage('Valid start date is required'),
	body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('state').notEmpty().withMessage('State is required'),
	body('language').notEmpty().withMessage('Language is required'),
	body('jingleIds').isArray({ min: 1 }).withMessage('At least one jingle must be selected'),
];

const updateValidation = [
	body('email').optional().isEmail().withMessage('Valid email is required'),
	body('startDate').optional().isISO8601().withMessage('startDate must be a date'),
	body('endDate').optional().isISO8601().withMessage('endDate must be a date'),
	body('jingleIds').optional().isArray().withMessage('jingleIds must be an array'),
];

router.get('/', optionalAuth, campaignController.listCampaigns);
router.get('/:id', campaignController.getCampaignById);
router.get('/:id/analytics', campaignController.getCampaignAnalytics);
router.post('/', baseValidation, campaignController.createCampaign);
router.put('/:id', updateValidation, campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);

module.exports = router;
