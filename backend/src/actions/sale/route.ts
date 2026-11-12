import { Router } from 'express';
import { SaleController } from './controller';
import { SaleGetter } from './getter';
import { authenticateToken, requireRoles } from '../../helpers/middleware/auth.middleware';

const router = Router();

// Protected: Get today's sales summary
router.get('/summary/today', authenticateToken, SaleGetter.getTodaySummary);

// Protected: Get all sales history with filters
router.get('/', authenticateToken, SaleGetter.getAll);

// Protected: Get single sale by ID
router.get('/:id', authenticateToken, SaleGetter.getById);

// Protected: Create new sale (Cashier, Manager, Admin) - auto-syncs Invoice + Payment to ERPNext
router.post('/', authenticateToken, requireRoles(['ADMIN', 'MANAGER', 'CASHIER']), SaleController.add);

// Protected: Manual / Retry ERPNext sync for a specific sale
router.post('/:id/sync', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), SaleController.syncToErp);

// Protected: Delete sale (Admin only)
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), SaleController.delete);

export default router;
