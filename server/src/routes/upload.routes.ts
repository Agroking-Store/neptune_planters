import { Router } from 'express';
import { uploadImages, uploadMiddleware } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ─────────────────────────────────────────────
// Upload routes
// ─────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  uploadMiddleware.array('images', 10), // Allow up to 10 images at once
  uploadImages
);

export default router;
