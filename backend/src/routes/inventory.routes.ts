import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// Members and admins can hit getInventory (handled by global token validation or separate if needed, but original code had no auth limit on GET /api/inventory, oh wait... the comment said "Members and admins can view inventory availability" but there was no explicit requireMemberOrAdmin middleware attached to it. Wait, checking original server.ts: `app.get('/api/inventory', async (req: Request, res: Response) => { ... })`. It had no middleware!
router.get('/', authenticateToken, requirePermission('inventory', 'read'), InventoryController.getInventory);
router.post('/', authenticateToken, requirePermission('inventory', 'create'), InventoryController.addItem);
router.put('/:id', authenticateToken, requirePermission('inventory', 'update'), InventoryController.updateItem);
router.delete('/:id', authenticateToken, requirePermission('inventory', 'delete'), InventoryController.deleteItem);

export default router;
