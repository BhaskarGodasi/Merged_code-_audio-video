const express = require('express');
const { body } = require('express-validator');
const upload = require('../middleware/upload');
const jingleController = require('../controllers/jingleController');

const router = express.Router();

router.get('/', jingleController.listJingles);

router.post(
	'/',
	upload.single('file'),
	[body('title').optional().isString()],
	jingleController.createJingle,
);

router.put('/:id', jingleController.updateJingle);

router.delete('/:id', jingleController.deleteJingle);

module.exports = router;
