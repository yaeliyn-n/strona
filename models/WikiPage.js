const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const WikiPage = sequelize.define('WikiPage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  content: {
    type: DataTypes.TEXT, // For Markdown content
    allowNull: false
  },
  authorId: {
    type: DataTypes.STRING, // Discord User ID
    allowNull: false,
    field: 'author_id'
  },
  authorName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'author_name'
  },
  lastEditorId: {
    type: DataTypes.STRING, // Discord User ID
    allowNull: true,
    field: 'last_editor_id'
  },
  lastEditorName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'last_editor_name'
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
  tableName: 'wiki_pages',
  timestamps: true, // Sequelize will manage createdAt and updatedAt
  updatedAt: 'updated_at', // Match field name
  createdAt: 'created_at'  // Match field name
});

module.exports = WikiPage;
