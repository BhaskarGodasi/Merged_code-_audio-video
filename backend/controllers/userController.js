const { User, Brand } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

// List all users with optional role filtering
const listUsers = asyncHandler(async (req, res) => {
  const { role, isActive } = req.query;
  
  const where = {};
  if (role) {
    where.role = role;
  }
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const users = await User.findAll({
    where,
    include: [
      {
        model: Brand,
        as: 'brand',
        attributes: ['id', 'name', 'contactPerson', 'email', 'phone']
      }
    ],
    attributes: { exclude: ['password'] }, // Never send passwords
    order: [['createdAt', 'DESC']]
  });

  res.json(users);
});

// Get single user by ID
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
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

// Create new user
const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role, brandId, isActive } = req.body;

  // Check if user with email or username already exists
  const existingUser = await User.findOne({
    where: {
      [require('sequelize').Op.or]: [
        { email },
        { username }
      ]
    }
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (existingUser.username === username) {
      return res.status(400).json({ error: 'Username already exists' });
    }
  }

  // If role is client, brandId is required
  if (role === 'client') {
    if (!brandId) {
      return res.status(400).json({ error: 'Brand ID is required for client role users' });
    }
    const brand = await Brand.findByPk(brandId);
    if (!brand) {
      return res.status(400).json({ error: 'Brand not found' });
    }
  }

  // Admin and superadmin users should not have a brandId
  if ((role === 'admin' || role === 'superadmin') && brandId) {
    return res.status(400).json({ error: 'Admin and superadmin users cannot be associated with a brand' });
  }

  const user = await User.create({
    username,
    email,
    password, // Will be hashed by beforeCreate hook
    role,
    brandId: role === 'client' ? brandId : null,
    isActive: isActive !== undefined ? isActive : true
  });

  // Return user without password
  res.status(201).json(user.toSafeObject());
});

// Update user
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, email, password, role, brandId, isActive } = req.body;

  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if email or username is taken by another user
  if (email && email !== user.email) {
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }
  }

  if (username && username !== user.username) {
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }
  }

  // If changing to client role, brandId is required
  const updatedRole = role || user.role;
  if (updatedRole === 'client') {
    const updatedBrandId = brandId !== undefined ? brandId : user.brandId;
    if (!updatedBrandId) {
      return res.status(400).json({ error: 'Brand ID is required for client role users' });
    }
    const brand = await Brand.findByPk(updatedBrandId);
    if (!brand) {
      return res.status(400).json({ error: 'Brand not found' });
    }
  }

  // Admin and superadmin users should not have a brandId
  if ((updatedRole === 'admin' || updatedRole === 'superadmin') && brandId) {
    return res.status(400).json({ error: 'Admin and superadmin users cannot be associated with a brand' });
  }

  // Update fields
  if (username) user.username = username;
  if (email) user.email = email;
  if (password) user.password = password; // Will be hashed by beforeUpdate hook
  if (role) user.role = role;
  if (updatedRole === 'client') {
    user.brandId = brandId !== undefined ? brandId : user.brandId;
  } else {
    user.brandId = null; // Clear brand association for admin/superadmin
  }
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  // Reload with associations
  await user.reload({
    include: [
      {
        model: Brand,
        as: 'brand',
        attributes: ['id', 'name', 'contactPerson', 'email', 'phone']
      }
    ]
  });

  res.json(user.toSafeObject());
});

// Delete user
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prevent deleting the only superadmin
  if (user.role === 'superadmin') {
    const superAdminCount = await User.count({ where: { role: 'superadmin' } });
    if (superAdminCount <= 1) {
      return res.status(400).json({ 
        error: 'Cannot delete the only superadmin user' 
      });
    }
  }

  await user.destroy();
  res.json({ message: 'User deleted successfully' });
});

// Toggle user active status
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prevent deactivating the only active superadmin
  if (user.role === 'superadmin' && user.isActive) {
    const activeSuperAdminCount = await User.count({ 
      where: { 
        role: 'superadmin',
        isActive: true 
      } 
    });
    if (activeSuperAdminCount <= 1) {
      return res.status(400).json({ 
        error: 'Cannot deactivate the only active superadmin user' 
      });
    }
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json(user.toSafeObject());
});

// Update last login timestamp
const updateLastLogin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.lastLogin = new Date();
  await user.save();

  res.json(user.toSafeObject());
});

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  updateLastLogin
};
