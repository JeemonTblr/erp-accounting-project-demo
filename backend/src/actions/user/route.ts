import { Router } from 'express';
import { UserController } from './controller';
import { UserGetter } from './getter';
import { authenticateToken, requireRoles } from '../../helpers/middleware/auth.middleware';
import { validateBody } from '../../helpers/middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../../helpers/validations/auth.validation';

const router = Router();

// Public: Login
router.post('/login', validateBody(loginSchema), UserController.login);

// Public / Admin: Register or Add User
router.post('/', validateBody(registerSchema), UserController.add);

// Protected: Get current user profile
router.get('/me', authenticateToken, UserGetter.getMe);

// Protected: Get all users (Admin & Manager)
router.get('/', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), UserGetter.getAll);

// Protected: Get user by ID
router.get('/:id', authenticateToken, UserGetter.getById);

// Protected: Update user
router.put('/:id', authenticateToken, requireRoles(['ADMIN']), UserController.update);

// Protected: Change password
router.post('/change-password', authenticateToken, validateBody(changePasswordSchema), UserController.changePassword);

// Protected: Delete user
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), UserController.delete);

export default router;

