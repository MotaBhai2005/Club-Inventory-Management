import { Router } from 'express';
import { LendingsController } from '../controllers/lendings.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const lendingsRouter = Router();

// Member or Admin fetching
lendingsRouter.get('/', authenticateToken, requirePermission('borrows', ['read_own', 'read_all']), LendingsController.getLendings);

// PENDING request from Member
lendingsRouter.post('/request', authenticateToken, requirePermission('borrows', 'request_self'), LendingsController.requestBorrow);

// APPROVE
lendingsRouter.post('/:id/approve', authenticateToken, requirePermission('borrows', 'approve'), LendingsController.approveBorrow);

// REJECT
lendingsRouter.post('/:id/reject', authenticateToken, requirePermission('borrows', 'reject'), LendingsController.rejectBorrow);

// CREATE ON BEHALF (Active direct)
lendingsRouter.post('/on-behalf', authenticateToken, requirePermission('borrows', 'create_on_behalf'), LendingsController.createOnBehalf);

// BULK CREATE ON BEHALF
lendingsRouter.post('/bulk-on-behalf', authenticateToken, requirePermission('borrows', 'create_on_behalf'), LendingsController.createBulkOnBehalf);

// RETURN (Checkout -> Return Checkin)
lendingsRouter.post('/:id/return', authenticateToken, requirePermission('borrows', 'process_checkin_checkout'), LendingsController.returnLending);

const historyRouter = Router();
historyRouter.get('/', authenticateToken, requirePermission('borrows', 'read_all'), LendingsController.getHistory);

export { lendingsRouter, historyRouter };
