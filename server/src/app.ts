import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import router from './routes/index';
import { errorHandler } from './middleware/errorHandler.middleware';
import { notFound } from './middleware/notFound.middleware';
import { logger } from './utils/logger';
import path from 'path';

// ─────────────────────────────────────────────
// Express application factory
// ─────────────────────────────────────────────
export function createApp(): express.Application {
  const app = express();

  // ── Security Headers (Helmet) ──────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // ── CORS ──────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., Postman, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (env.ALLOWED_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        logger.warn(`Blocked CORS request from: ${origin}`);
        callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ── Global rate limiter ────────────────────
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  });
  app.use(globalLimiter);

  // ── Stricter limiter for auth endpoints ────
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 login attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts. Please wait 15 minutes.' },
  });
  app.use('/api/auth/login', authLimiter);

  // ── Body parsers ──────────────────────────
  // Limit to 2mb to prevent Node.js / MongoDB BSON serializer crashes from massive Base64 strings.
  // Images should ideally be uploaded via the /api/upload endpoint instead.
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // ── Cookie parser ─────────────────────────
  app.use(cookieParser());

  // ── Trust proxy (needed for rate limiting behind reverse proxies) ─
  app.set('trust proxy', 1);

  // ── Static Files ──────────────────────────
  // Must be BEFORE the API router so /api/uploads requests are served
  // as static files instead of falling through to the router's 404 handler.
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

  // ── API Routes ────────────────────────────
  app.use('/api', router);

  // ── 404 Handler ───────────────────────────
  app.use(notFound);

  // ── Global Error Handler ──────────────────
  app.use(errorHandler);

  return app;
}
