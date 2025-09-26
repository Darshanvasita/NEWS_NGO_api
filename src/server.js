const express = require("express");
const cors = require("cors");
const path = require("path");

// Load environment from project root config.env explicitly so cwd differences
// (CI/deploy) don't prevent env variables from being found.
// Only load config.env in non-production environments
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.resolve(__dirname, "..", "config.env") });
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const newsRoutes = require("./routes/news.routes");
const enewspaperRoutes = require("./routes/enewspaper.routes");
const ngoRoutes = require("./routes/ngo.routes");
const { sequelize } = require("./models");

app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/enewspapers", enewspaperRoutes);
app.use("/api/ngo", ngoRoutes);

const PORT = process.env.PORT || 3000;

async function connectToDb() {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    await sequelize.sync({ alter: true });
    console.log("Database synced successfully.");
  } catch (err) {
    console.error("Unable to connect to the database:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
  connectToDb();
}

module.exports = { app, connectToDb };
