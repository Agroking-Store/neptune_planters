import { Router } from 'express';
import { login, refresh, logout, getMe, updateMe, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { loginSchema } from '../validators/auth.validator';

const router = Router();

// ─────────────────────────────────────────────
// Public routes
// ─────────────────────────────────────────────

// POST /api/auth/login
router.post('/login', validate({ body: loginSchema }), login);

// POST /api/auth/refresh  (refresh token in cookie or body)
router.post('/refresh', refresh);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

// ─────────────────────────────────────────────
// Protected routes
// ─────────────────────────────────────────────

// POST /api/auth/logout
router.post('/logout', authenticate, logout);

// GET /api/auth/me
router.get('/me', authenticate, getMe);

// PUT /api/auth/me
router.put('/me', authenticate, updateMe);

export default router;
