const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  updateLastLogin
} = require('../controllers/userController');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for creating user
const createValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['superadmin', 'admin', 'client']).withMessage('Role must be superadmin, admin, or client'),
  body('brandId')
    .optional({ nullable: true })
    .isInt({ gt: 0 }).withMessage('Brand ID must be a positive integer'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors
];

// Validation rules for updating user
const updateValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['superadmin', 'admin', 'client']).withMessage('Role must be superadmin, admin, or client'),
  body('brandId')
    .optional({ nullable: true })
    .isInt({ gt: 0 }).withMessage('Brand ID must be a positive integer'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors
];

// Routes
router.get('/', listUsers);
router.get('/:id', getUserById);
router.post('/', createValidation, createUser);
router.put('/:id', updateValidation, updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/toggle-status', toggleUserStatus);
router.patch('/:id/last-login', updateLastLogin);

module.exports = router;
