import { Router } from 'express';
import { PurchaseController } from './controller';
import { PurchaseGetter } from './getter';
import { authenticateToken, requireRoles } from '../../helpers/middleware/auth.middleware';

const router = Router();

// Protected: Get today's purchase summary
router.get('/summary/today', authenticateToken, PurchaseGetter.getTodaySummary);

// Protected: Get all purchases history
router.get('/', authenticateToken, PurchaseGetter.getAll);

// Protected: Get single purchase by ID
router.get('/:id', authenticateToken, PurchaseGetter.getById);

// Protected: Create new purchase (Admin & Manager) - auto-syncs Purchase Invoice + Supplier Payment to ERPNext
router.post('/', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), PurchaseController.add);

// Protected: Manual / Retry ERPNext sync for a specific purchase
router.post('/:id/sync', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), PurchaseController.syncToErp);

// Protected: Delete purchase (Admin only)
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), PurchaseController.delete);

export default router;
