// models/SupportRequest.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Upewnij się, że ścieżka jest poprawna
// Import modelu SupportReply będzie potrzebny do zdefiniowania asocjacji,
// ale samą asocjację zdefiniujemy w głównym pliku server.js po inicjalizacji wszystkich modeli.

const SupportRequest = sequelize.define('SupportRequest', {
  discordUserId: { 
    type: DataTypes.STRING,
    allowNull: true 
  },
  discordUsername: { 
    type: DataTypes.STRING,
    allowNull: true 
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true 
  },
  reportType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachment: { 
    type: DataTypes.STRING,
    allowNull: true
  },
  status: { 
    type: DataTypes.STRING,
    defaultValue: 'Otwarte', 
    allowNull: false
  }
  // Pola createdAt i updatedAt zostaną automatycznie dodane przez Sequelize
});

// Definicja asocjacji zostanie dodana w server.js po zaimportowaniu wszystkich modeli
// np. SupportRequest.hasMany(SupportReply, { foreignKey: 'ticketId', as: 'replies' });
// a w SupportReply: SupportReply.belongsTo(SupportRequest, { foreignKey: 'ticketId', as: 'ticket' });

module.exports = SupportRequest;
