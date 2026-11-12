import { Router } from 'express';
import { ProductController } from './controller';
import { ProductGetter } from './getter';
import { authenticateToken, requireRoles } from '../../helpers/middleware/auth.middleware';

const router = Router();

// Public: Get all products
router.get('/', ProductGetter.getAll);

// Protected: Get low stock alert products
router.get('/alerts/low-stock', authenticateToken, ProductGetter.getLowStock);

// Public: Get product by ID
router.get('/:id', ProductGetter.getById);

// Protected: Add product (Admin & Manager)
router.post('/', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), ProductController.add);

// Protected: Manual / Retry sync product to ERPNext
router.post('/:id/sync', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), ProductController.syncToErp);

// Protected: Update product (Admin & Manager)
router.put('/:id', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), ProductController.update);

// Protected: Delete product (Admin only)
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), ProductController.delete);

// Protected: Add variant to product
router.post('/:id/variants', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), ProductController.addVariant);

// Protected: Delete variant
router.delete('/variants/:variantId', authenticateToken, requireRoles(['ADMIN']), ProductController.deleteVariant);

export default router;
