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

// API call logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);

  // Log request body for POST/PUT requests
  if (req.method === "POST" || req.method === "PUT") {
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
  }

  // Log query parameters if they exist
  if (Object.keys(req.query).length > 0) {
    console.log("Query Params:", JSON.stringify(req.query, null, 2));
  }

  next();
});

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const newsRoutes = require("./routes/news.routes");
const enewspaperRoutes = require("./routes/enewspaper.routes");
const ngoRoutes = require("./routes/ngo.routes");
const subscriptionRoutes = require("./routes/subscription.routes");

const { sequelize } = require("./models");
const schedulerService = require("./services/scheduler.service");
const { testEmailConfiguration } = require("./services/email.service");

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
app.use("/api/subscribe", subscriptionRoutes);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Use `alter: true` in dev, but consider more robust migration strategies for prod
    await sequelize.sync({ alter: true });
    console.log("Database synced successfully.");

    // Test email configuration
    await testEmailConfiguration();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);

      if (process.env.NODE_ENV !== "test") {
        schedulerService.startScheduler();
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
