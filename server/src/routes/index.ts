import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// ─────────────────────────────────────────────
// Mount all API routes here
// Future modules: /inventory, /quotations, etc.
// ─────────────────────────────────────────────
router.use('/auth', authRoutes);

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
