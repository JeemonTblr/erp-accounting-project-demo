import { Router } from 'express';
import { PaymentController } from './controller';
import { PaymentGetter } from './getter';
import { authenticateToken, requireRoles } from '../../helpers/middleware/auth.middleware';

const router = Router();

// Protected: Get all payments
router.get('/', authenticateToken, PaymentGetter.getAll);

// Protected: Get payment by ID
router.get('/:id', authenticateToken, PaymentGetter.getById);

// Protected: Record a payment
router.post('/', authenticateToken, PaymentController.add);

// Protected: Delete payment (Admin only)
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), PaymentController.delete);

export default router;

