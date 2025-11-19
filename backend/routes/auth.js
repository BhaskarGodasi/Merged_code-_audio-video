const express = require('express');
const { body, validationResult } = require('express-validator');
const { login, getCurrentUser, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Login validation
const loginValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username or email is required'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Routes
router.post('/login', loginValidation, login);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

module.exports = router;
