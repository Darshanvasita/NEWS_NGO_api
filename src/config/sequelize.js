const { Sequelize } = require("sequelize");

const databaseUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

if (isProduction) {
  if (!databaseUrl) {
    throw new Error("FATAL: DATABASE_URL environment variable is not set. This is required for production deployment on services like Render.");
  }
  sequelize = new Sequelize(databaseUrl, {
    dialect: "postgres",
    protocol: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Required for services like Render
      },
    },
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for Render's managed PostgreSQL
      }
    }
  });
} else {
  // Fallback for local development if DATABASE_URL is not set
  const devDatabaseUrl = process.env.PG_DATABASE_URL || databaseUrl;
  if (devDatabaseUrl) {
    sequelize = new Sequelize(devDatabaseUrl, {
      dialect: "postgres",
      logging: false,
    });
  } else {
    const host = process.env.PG_HOST || "127.0.0.1";
    const port = Number(process.env.PG_PORT || 5432);
    const database = process.env.PG_DB || "news_ngo";
    const username = process.env.PG_USER || "postgres";
    const password = process.env.PG_PASSWORD || "";

    sequelize = new Sequelize(database, username, password, {
      host,
      port,
      dialect: "postgres",
      logging: false,
    });
  }
}

module.exports = sequelize;