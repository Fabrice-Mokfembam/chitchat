const Sequelize = require('sequelize');
const sequelize = require('../database')

const Message = sequelize.define('Messages', {
  Message: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  SenderId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  MessageId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  ReceiverId: {
    type: Sequelize.STRING,
    allowNull: false,
    },
}, {
  freezeTableName: true
});

module.exports = Message;