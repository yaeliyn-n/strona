const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Content = sequelize.define('Content', {
  key: { type: DataTypes.STRING, unique: true, allowNull: false },
  value: { type: DataTypes.TEXT, allowNull: false }
});

module.exports = Content;
