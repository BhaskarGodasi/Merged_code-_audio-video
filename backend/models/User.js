const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: 'Username already exists'
      },
      validate: {
        notEmpty: { msg: 'Username is required' },
        len: {
          args: [3, 50],
          msg: 'Username must be between 3 and 50 characters'
        }
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        msg: 'Email already exists'
      },
      validate: {
        notEmpty: { msg: 'Email is required' },
        isEmail: { msg: 'Must be a valid email address' }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password is required' }
      }
    },
    role: {
      type: DataTypes.ENUM('superadmin', 'admin', 'client'),
      allowNull: false,
      defaultValue: 'client',
      validate: {
        isIn: {
          args: [['superadmin', 'admin', 'client']],
          msg: 'Role must be superadmin, admin, or client'
        }
      }
    },
    brandId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'brands',
        key: 'id'
      },
      validate: {
        brandRequiredForClientRole(value) {
          if (this.role === 'client' && !value) {
            throw new Error('Brand ID is required for client role users');
          }
        },
        noBrandForAdminRoles(value) {
          if ((this.role === 'superadmin' || this.role === 'admin') && value) {
            throw new Error('Admin and superadmin users cannot be associated with a brand');
          }
        }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    // Hash password before creating new user
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // Hash password before updating if password changed
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to validate password
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Instance method to get user data without password
User.prototype.toSafeObject = function() {
  const userWithoutPassword = this.toJSON();
  delete userWithoutPassword.password;
  return userWithoutPassword;
};

module.exports = User;
