import { Router } from 'express';
import authRoutes from './auth.routes';
import inventoryRoutes from './inventory.routes';
import customerRoutes from './customer.routes';
import quotationRoutes from './quotation.routes';

const router = Router();

// ─────────────────────────────────────────────
// Mount all API routes here
// ─────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/customers', customerRoutes);
router.use('/quotations', quotationRoutes);

// Health check (unauthenticated)
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Neptune Planters API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
