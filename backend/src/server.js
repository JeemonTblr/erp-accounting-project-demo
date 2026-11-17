const app = require("./app");
const { config } = require("./config/env");
const { testDbConnection, sequelize } = require("./config/database");
const { initDatabase } = require("./models");
const { AuthService } = require("./helpers/auth.service");
const startServer = async () => {
  try {
    console.log("=".repeat(65));
    console.log(" Clothing & Textiles Shop Management System - Backend API");
    console.log("=".repeat(65));
    console.log(`Connecting to MariaDB database: "${config.db.name}" at ${config.db.host}:${config.db.port}...`);
    const dbTest = await testDbConnection();
    if (!dbTest.success) {
      console.error(`\u274C MariaDB Connection Failed: ${dbTest.message}`);
      process.exit(1);
    }
    console.log(`\u2705 MariaDB Connection Established! (${dbTest.version})`);
    await initDatabase();
    console.log("\u2705 Sequelize models and MariaDB tables ready.");
    await AuthService.seedDefaultAdmin();
    const server = app.listen(config.port, () => {
      console.log(`\u{1F680} Server running in [${config.env}] mode on http://localhost:${config.port}`);
      console.log(`\u{1F4E1} Health Check:     http://localhost:${config.port}/api/health`);
      console.log(`\u{1F5C4}\uFE0F  Database Test:    http://localhost:${config.port}/api/database/test`);
      console.log(`\u{1F4CB} Database Tables:  http://localhost:${config.port}/api/database/tables`);
      console.log(`\u{1F510} Auth Endpoints:   http://localhost:${config.port}/api/auth/login`);
      console.log("=".repeat(65));
    });
    const gracefulShutdown = async (signal) => {
      console.log(`
Received ${signal}. Gracefully closing HTTP server and MariaDB pool...`);
      server.close(async () => {
        try {
          await sequelize.close();
          console.log("\u2705 MariaDB connection pool closed.");
          process.exit(0);
        } catch (err) {
          console.error("Error during MariaDB pool closure:", err);
          process.exit(1);
        }
      });
    };
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error) {
    console.error("\u274C Server failed to start:", error);
    process.exit(1);
  }
};
startServer();
