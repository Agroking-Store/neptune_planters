import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  listDepartments,
  listCategories,
  listBrands,
  listProducts,
  createProductHandler,
  getProductByIdHandler,
  updateProductHandler,
  deleteProductHandler,
} from '../controllers/inventory.controller';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

// ─────────────────────────────────────────────
// Lookup routes (read-only)
// ─────────────────────────────────────────────
router.get('/departments', listDepartments);
router.get('/categories', listCategories);
router.get('/brands', listBrands);

// ─────────────────────────────────────────────
// Product routes
// ─────────────────────────────────────────────
router.get('/products', listProducts);
router.post('/products', createProductHandler);
router.get('/products/:id', getProductByIdHandler);
router.put('/products/:id', updateProductHandler);
router.delete('/products/:id', deleteProductHandler);

export default router;
