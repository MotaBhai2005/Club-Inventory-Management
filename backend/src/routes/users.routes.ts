import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateToken, requirePermission('users', 'read'), UsersController.getUsers);
router.post('/', authenticateToken, requirePermission('users', 'create'), UsersController.createUser);
router.put('/:id', authenticateToken, requirePermission('users', 'update'), UsersController.updateUser);
router.post('/:id/role', authenticateToken, requirePermission('users', 'assign_roles'), UsersController.assignRole);
router.delete('/:id', authenticateToken, requirePermission('users', 'delete'), UsersController.deleteUser);

export default router;
