const { Router } = require("express");
const { HealthController } = require("./controller");
const router = Router();
router.get("/health", HealthController.getHealth);
router.get("/database/test", HealthController.testDatabase);
router.get("/database/tables", HealthController.getDatabaseTables);
router.get("/database/tables/:tableName/data", HealthController.getTableData);
module.exports = router;
