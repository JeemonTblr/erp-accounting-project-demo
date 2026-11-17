const { Router } = require("express");
const { DashboardController } = require("./controller");
const { authenticateToken } = require("../../helpers/middleware/auth.middleware");
const router = Router();
router.get("/", authenticateToken, DashboardController.getSummary);
module.exports = router;
