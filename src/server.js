const express = require("express");
const cors = require("cors");
const path = require("path");

// Only load config.env in development, not in test or production
if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
  require("dotenv").config({ path: path.resolve(__dirname, "..", "config.env") });
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const newsRoutes = require("./routes/news.routes");
const enewspaperRoutes = require("./routes/enewspaper.routes");
const ngoRoutes = require("./routes/ngo.routes");
const { sequelize } = require("./models");
const { startScheduler } = require("./services/scheduler.service");
const { testEmailConfig } = require("./utils/email");

app.get("/", (req, res) => {
  res.send("Server is running!");
});

// API Routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/enewspapers", enewspaperRoutes);
app.use("/api/ngo", ngoRoutes);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Use `alter: true` in dev, but consider more robust migration strategies for prod
    await sequelize.sync({ alter: true });
    console.log("Database synced successfully.");

    // Verify email configuration before starting the server
    if (process.env.NODE_ENV !== 'test') {
      const isEmailConfigValid = await testEmailConfig();
      if (!isEmailConfigValid) {
        console.error("Application startup failed due to invalid email configuration. Please check your .env file.");
        process.exit(1); // Exit with a failure code
      }
    }

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      if (process.env.NODE_ENV !== 'test') {
        startScheduler();
      }
    });
    return server;
  } catch (err) {
    console.error("Unable to start the application:", err);
    throw err; // Re-throw the error for the caller to handle
  }
}

// Start the server only if this file is run directly (e.g., `node src/server.js`)
if (require.main === module) {
  start();
}

module.exports = { app, start };
