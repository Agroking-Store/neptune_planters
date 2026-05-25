import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/User.model';
import type { UserRole } from '../models/User.model';

// ─────────────────────────────────────────────
// Extend Express Request to carry user context
// ─────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

// ─────────────────────────────────────────────
// authenticate — verifies Bearer access token
// ─────────────────────────────────────────────
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No access token provided');
    }

    const token = authHeader.slice(7); // Remove "Bearer "
    const payload = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await User.findById(payload.userId).select('isActive role email').exec();
    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }
    if (!user.isActive) {
      throw ApiError.forbidden('Account has been deactivated');
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────
// authorize — role-based access guard
// Usage: authorize('admin') or authorize('admin', 'staff')
// ─────────────────────────────────────────────
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}`
        )
      );
    }
    next();
  };
}
