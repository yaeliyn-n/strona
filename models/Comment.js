const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
// No need to import Article model here for the foreign key if we use string 'Articles'

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  articleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Articles', // Referencing the table name directly
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  discordUserId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  discordUsername: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
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
});

module.exports = Comment;
