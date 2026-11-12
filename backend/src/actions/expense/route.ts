import { Router } from 'express';
import { ExpenseController } from './controller';
import { ExpenseGetter } from './getter';
import { authenticateToken, requireRoles } from '../../helpers/middleware/auth.middleware';

const router = Router();

// Protected: Get all expenses
router.get('/', authenticateToken, ExpenseGetter.getAll);

// Protected: Get today's expenses summary
router.get('/summary/today', authenticateToken, ExpenseGetter.getTodaySummary);

// Protected: Get expense by ID
router.get('/:id', authenticateToken, ExpenseGetter.getById);

// Protected: Record an expense (Admin & Manager) - auto-syncs Journal Entry to ERPNext
router.post('/', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), ExpenseController.add);

// Protected: Manual / Retry ERPNext Journal Entry sync
router.post('/:id/sync', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), ExpenseController.syncToErp);

// Protected: Update expense
router.put('/:id', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), ExpenseController.update);

// Protected: Delete expense (Admin only)
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), ExpenseController.delete);

export default router;
