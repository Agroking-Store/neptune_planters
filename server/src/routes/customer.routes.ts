import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  listCustomers,
  getCustomerByIdHandler,
  createCustomerHandler,
  updateCustomerHandler,
  deleteCustomerHandler,
} from '../controllers/customer.controller';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// ─────────────────────────────────────────────
// Customer routes
// ─────────────────────────────────────────────
router.get('/', listCustomers);
router.post('/', createCustomerHandler);
router.get('/:id', getCustomerByIdHandler);
router.put('/:id', updateCustomerHandler);
router.delete('/:id', deleteCustomerHandler);

export default router;
