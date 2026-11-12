import { Router } from 'express';
import { HealthController } from './controller';

const router = Router();

// Application health check
router.get('/health', HealthController.getHealth);

// MariaDB connection test endpoint
router.get('/database/test', HealthController.testDatabase);

// MariaDB tables inspection endpoint
router.get('/database/tables', HealthController.getDatabaseTables);

// MariaDB table data viewer endpoint
router.get('/database/tables/:tableName/data', HealthController.getTableData);

export default router;

