import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  listQuotations,
  getQuotationByIdHandler,
  createQuotationHandler,
  updateQuotationHandler,
  deleteQuotationHandler,
  patchQuotationStatusHandler,
} from '../controllers/quotation.controller';

const router = Router();

// All quotation routes require authentication
router.use(authenticate);

// ─────────────────────────────────────────────
// Quotation routes
// ─────────────────────────────────────────────
router.get('/', listQuotations);
router.post('/', createQuotationHandler);
router.get('/:id', getQuotationByIdHandler);
router.put('/:id', updateQuotationHandler);
router.delete('/:id', deleteQuotationHandler);
router.patch('/:id/status', patchQuotationStatusHandler);

export default router;
