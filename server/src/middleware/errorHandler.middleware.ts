import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// ─────────────────────────────────────────────
// Global Express Error Handler
// Must have 4 parameters for Express to recognize it
// ─────────────────────────────────────────────
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(`[${req.method}] ${req.path} → ${error.message}`, {
    stack: env.IS_DEVELOPMENT ? error.stack : undefined,
  });

  // ── 1. Known operational API errors ──────────
  if (error instanceof ApiError) {
    res.status(error.statusCode).json(
      ApiResponse.error(error.message).toJSON()
    );
    return;
  }

  // ── 2. Mongoose Validation Error ─────────────
  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map((e) => e.message);
    res.status(400).json(
      new ApiResponse(false, 'Validation failed', null, { errors: messages }).toJSON()
    );
    return;
  }

  // ── 3. Mongoose Cast Error (invalid ObjectId) ─
  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json(
      ApiResponse.error(`Invalid value for field: ${error.path}`).toJSON()
    );
    return;
  }

  // ── 4. MongoDB Duplicate Key Error ───────────
  if ((error as NodeJS.ErrnoException).name === 'MongoServerError') {
    const mongoError = error as { code?: number; keyValue?: Record<string, unknown> };
    if (mongoError.code === 11000) {
      const field = Object.keys(mongoError.keyValue ?? {})[0] ?? 'field';
      res.status(409).json(
        ApiResponse.error(`Duplicate value for field: ${field}`).toJSON()
      );
      return;
    }
  }

  // ── 5. JWT Errors (if not caught by middleware) ─
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    res.status(401).json(
      ApiResponse.error('Invalid or expired token').toJSON()
    );
    return;
  }

  // ── 6. Unknown / Unexpected errors ───────────
  logger.error('Unhandled error:', error);
  res.status(500).json(
    ApiResponse.error(
      env.IS_PRODUCTION ? 'Internal server error' : error.message
    ).toJSON()
  );
}
