const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  database: 'my_database',
  dialect: 'sqlite',
  storage: './database.sqlite',
});

module.exports = sequelize;
