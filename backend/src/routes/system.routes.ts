import { Router } from 'express';
import { SystemController } from '../controllers/system.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/audit-logs', authenticateToken, requirePermission('system', 'audit_logs'), SystemController.getAuditLogs);

export default router;
