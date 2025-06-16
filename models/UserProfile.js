const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const UserProfile = sequelize.define('UserProfile', {
  discordUserId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  favoriteAnime: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  favoriteManga: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  websiteLink: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },
  twitterLink: {
    type: DataTypes.STRING,
    allowNull: true,
    // More complex validation (e.g., regex for Twitter URL) could be added if needed
  },
  twitchLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  youtubeLink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },
}, {
  // Optional: Define table name explicitly if needed, though Sequelize will infer it
  // tableName: 'UserProfiles',
});

module.exports = UserProfile;
