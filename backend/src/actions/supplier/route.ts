import { Router } from 'express';
import { SupplierController } from './controller';
import { SupplierGetter } from './getter';
import { authenticateToken, requireRoles } from '../../helpers/middleware/auth.middleware';

const router = Router();

// Protected: Get all suppliers
router.get('/', authenticateToken, SupplierGetter.getAll);

// Protected: Get supplier by ID
router.get('/:id', authenticateToken, SupplierGetter.getById);

// Protected: Add supplier (automatically syncs to ERPNext)
router.post('/', authenticateToken, SupplierController.add);

// Protected: Manual / Retry sync supplier to ERPNext
router.post('/:id/sync', authenticateToken, SupplierController.syncToErp);

// Protected: Update supplier
router.put('/:id', authenticateToken, SupplierController.update);

// Protected: Delete supplier (Admin only)
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), SupplierController.delete);

export default router;
