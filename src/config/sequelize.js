const { Sequelize } = require('sequelize');

require('dotenv').config({ path: './config.env' });

const databaseUrl = process.env.PG_DATABASE_URL || process.env.DATABASE_URL;

let sequelize;

if (databaseUrl && databaseUrl.startsWith('postgres')) {
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
  });
} else {
  const host = process.env.PG_HOST || '127.0.0.1';
  const port = Number(process.env.PG_PORT || 5432);
  const database = process.env.PG_DB || 'news_ngo';
  const username = process.env.PG_USER || 'postgres';
  const password = process.env.PG_PASSWORD || '';

  sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: 'postgres',
    logging: false,
  });
}

module.exports = sequelize;

