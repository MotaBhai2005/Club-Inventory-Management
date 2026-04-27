import { Router } from 'express';
import { MetricsController } from '../controllers/metrics.controller';

import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// Will pass if user has either "basic" or "full" in "reports" since both grant access to the base endpoint
router.get('/', authenticateToken, requirePermission('reports', 'basic'), MetricsController.getMetrics);

export default router;
