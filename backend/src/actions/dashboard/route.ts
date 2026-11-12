import { Router } from 'express';
import { DashboardController } from './controller';
import { authenticateToken } from '../../helpers/middleware/auth.middleware';

const router = Router();

// Protected: Get unified dashboard metrics (Today's activities + ERPNext official accounting balances)
router.get('/', authenticateToken, DashboardController.getSummary);

export default router;

