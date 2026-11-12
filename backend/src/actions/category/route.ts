import { Router } from 'express';
import { CategoryController } from './controller';
import { CategoryGetter } from './getter';
import { authenticateToken, requireRoles } from '../../helpers/middleware/auth.middleware';

const router = Router();

// Public: Get all categories
router.get('/', CategoryGetter.getAll);

// Public: Get category by ID
router.get('/:id', CategoryGetter.getById);

// Protected: Add category (Admin & Manager)
router.post('/', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), CategoryController.add);

// Protected: Update category (Admin & Manager)
router.put('/:id', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), CategoryController.update);

// Protected: Delete category (Admin only)
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), CategoryController.delete);

export default router;

