import { Router } from 'express';
import { InventoryController } from './controller';
import { InventoryGetter } from './getter';
import { authenticateToken, requireRoles } from '../../helpers/middleware/auth.middleware';

const router = Router();

// Protected: Get inventory movement history
router.get('/', authenticateToken, InventoryGetter.getAll);

// Protected: Get real-time stock balance from ERPNext for a product
router.get('/stock-balance/:productId', authenticateToken, InventoryController.getErpStockBalance);

// Protected: Get single transaction by ID
router.get('/:id', authenticateToken, InventoryGetter.getById);

// Protected: Record stock adjustment / damage / return (Admin & Manager) - auto-syncs Stock Entry to ERPNext
router.post('/', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), InventoryController.add);

// Protected: Manual / Retry ERPNext Stock Entry sync
router.post('/:id/sync', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), InventoryController.syncToErp);

// Protected: Delete transaction (Admin only)
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), InventoryController.delete);

export default router;
