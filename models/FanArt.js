const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const FanArt = sequelize.define('FanArt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'image_url'
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'thumbnail_url'
  },
  discordUserId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'discord_user_id'
  },
  discordUserName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'discord_user_name'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  approvedByUserId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'approved_by_user_id'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'fan_arts',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at'
});

module.exports = FanArt;
