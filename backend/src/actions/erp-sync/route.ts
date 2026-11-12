import { Router } from 'express';
import { ErpSyncController } from './controller';
import { ErpSyncGetter } from './getter';
import { authenticateToken, requireRoles } from '../../helpers/middleware/auth.middleware';

const router = Router();

// Protected: Get all sync logs
router.get('/', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), ErpSyncGetter.getAll);

// Protected: Get pending sync logs
router.get('/pending', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), ErpSyncGetter.getPending);

// Protected: Get sync log by ID
router.get('/:id', authenticateToken, requireRoles(['ADMIN', 'MANAGER']), ErpSyncGetter.getById);

// Protected: Manually create sync log entry
router.post('/', authenticateToken, requireRoles(['ADMIN']), ErpSyncController.add);

// Protected: Delete sync log entry
router.delete('/:id', authenticateToken, requireRoles(['ADMIN']), ErpSyncController.delete);

export default router;

