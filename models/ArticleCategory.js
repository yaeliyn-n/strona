const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Article = require('./Article'); // Needed for foreign key reference if not using string
const Category = require('./Category'); // Needed for foreign key reference if not using string

const ArticleCategory = sequelize.define('ArticleCategory', {
  ArticleId: {
    type: DataTypes.INTEGER,
    references: {
      model: Article, // Can also be 'Articles' (table name)
      key: 'id',
    },
    primaryKey: true,
    onDelete: 'CASCADE',
  },
  CategoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: Category, // Can also be 'Categories' (table name)
      key: 'id',
    },
    primaryKey: true,
    onDelete: 'CASCADE',
  },
}, {
  timestamps: false, // Usually join tables don't need timestamps
  freezeTableName: true, // Optional: prevent Sequelize from pluralizing
});

module.exports = ArticleCategory;
