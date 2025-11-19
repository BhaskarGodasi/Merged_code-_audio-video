const jwt = require('jsonwebtoken');
const { User, Brand } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'dooh-audio-platform-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      brandId: user.brandId
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Login
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Find user by username or email
  const user = await User.findOne({
    where: {
      [require('sequelize').Op.or]: [
        { username },
        { email: username }
      ]
    },
    include: [
      {
        model: Brand,
        as: 'brand',
        attributes: ['id', 'name', 'contactPerson', 'email', 'phone']
      }
    ]
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(403).json({ error: 'Account is deactivated. Please contact administrator.' });
  }

  // Validate password
  const isPasswordValid = await user.validatePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user);

  // Return user data without password and token
  const userData = user.toSafeObject();

  res.json({
    token,
    user: userData
  });
});

// Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  // req.user is set by auth middleware
  const user = await User.findByPk(req.user.id, {
    include: [
      {
        model: Brand,
        as: 'brand',
        attributes: ['id', 'name', 'contactPerson', 'email', 'phone']
      }
    ],
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// Logout (client-side will remove token)
const logout = asyncHandler(async (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = {
  login,
  getCurrentUser,
  logout
};
