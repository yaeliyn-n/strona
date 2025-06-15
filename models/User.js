const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  discordUserId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    field: 'discord_user_id' // Ensure snake_case in DB
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
    field: 'created_at' // Ensure snake_case in DB
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
    field: 'updated_at' // Ensure snake_case in DB
  }
}, {
  tableName: 'users',
  timestamps: true, // Sequelize will manage createdAt and updatedAt
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});

module.exports = User;
