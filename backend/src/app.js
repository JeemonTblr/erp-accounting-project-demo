const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
require("./models");
const actionsRouter = require("./actions");
const { errorHandler, notFoundHandler } = require("./helpers/middleware/error.middleware");
const swaggerDocument = require("./helpers/swagger.json");
const app = express();
app.use(
  helmet({
    contentSecurityPolicy: false
    // Allows Swagger UI assets and styles to load cleanly
  })
);
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/api/swagger.json", (_req, res) => {
  res.status(200).json(swaggerDocument);
});
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Clothing & Textiles Shop Management API with ERPNext Accounting Integration",
    version: "1.0.0",
    documentation: {
      swaggerUI: "/api/docs",
      swaggerSpec: "/api/swagger.json",
      healthCheck: "/api/health",
      databaseTest: "/api/database/test",
      databaseTables: "/api/database/tables",
      dashboard: "/api/dashboard"
    }
  });
});
app.use("/api", actionsRouter);
app.use(notFoundHandler);
app.use(errorHandler);
module.exports = app;
