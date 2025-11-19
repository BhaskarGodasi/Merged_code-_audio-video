const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const {
	listClients,
	getClientById,
	getClientAnalytics,
	createClient,
	updateClient,
	deleteClient,
} = require('../controllers/clientController');

// List all clients (with optional auth to filter for client users)
router.get('/', optionalAuth, listClients);

// Get client analytics (must be before /:id to avoid conflict)
router.get('/:id/analytics', getClientAnalytics);

// Get single client
router.get('/:id', getClientById);

// Create new client
router.post('/', createClient);

// Update client
router.put('/:id', updateClient);

// Delete client
router.delete('/:id', deleteClient);

module.exports = router;
