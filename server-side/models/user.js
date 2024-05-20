const Sequelize = require('sequelize');
const sequelize = require('../database')

const User = sequelize.define('User', {
  UserId: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false,
  },
  UserEmail: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  UserPassword: {
    type: Sequelize.STRING,
    allowNull: false,
    },
}, {
  freezeTableName: true
});

module.exports = User;
