import { Router } from 'express';
import { CustomerController } from './controller';
import { CustomerGetter } from './getter';
import { authenticateToken, requireRoles } from '../../helpers/middleware/auth.middleware';

const router = Router();

// Protected: Get all customers
router.get('/', authenticateToken, CustomerGetter.getAll);

// Protected: Get customer by ID
router.get('/:id', authenticateToken, CustomerGetter.getById);

// Protected: Add customer (automatically syncs to ERPNext)
router.post('/', authenticateToken, CustomerController.add);

// Protected: Manual / Retry sync customer to ERPNext
router.post('/:id/sync', authenticateToken, CustomerController.syncToErp);

// Protected: Update customer
router.put('/:id', authenticateToken, CustomerController.update);

// Protected: Delete customer (Admin only)
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), CustomerController.delete);

export default router;
