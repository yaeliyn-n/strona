// models/SupportReply.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Upewnij się, że ścieżka do konfiguracji bazy danych jest poprawna

const SupportReply = sequelize.define('SupportReply', {
  ticketId: { // Klucz obcy łączący z SupportRequest
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'SupportRequests', // Nazwa tabeli dla modelu SupportRequest (Sequelize domyślnie używa liczby mnogiej)
      key: 'id'
    }
  },
  discordUserId: { // ID użytkownika Discord odpowiadającego
    type: DataTypes.STRING,
    allowNull: false
  },
  discordUsername: { // Nazwa użytkownika Discord odpowiadającego
    type: DataTypes.STRING,
    allowNull: false
  },
  replyText: { // Treść odpowiedzi
    type: DataTypes.TEXT,
    allowNull: false
  },
  isAdminReply: { // Flaga do odróżnienia odpowiedzi admina od odpowiedzi użytkownika
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Domyślnie odpowiedź nie jest od admina
    allowNull: false
  }
  // Pola createdAt i updatedAt zostaną automatycznie dodane przez Sequelize
});

module.exports = SupportReply;
