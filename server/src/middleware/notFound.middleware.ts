import type { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse';

// ─────────────────────────────────────────────
// 404 catch-all for unregistered routes
// ─────────────────────────────────────────────
export function notFound(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json(
    ApiResponse.error(`Route not found: [${req.method}] ${req.originalUrl}`).toJSON()
  );
}
