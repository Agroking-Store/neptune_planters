import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from './ApiError';

// ─────────────────────────────────────────────
// JWT Payload types
// ─────────────────────────────────────────────
export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

// ─────────────────────────────────────────────
// Token generation
// ─────────────────────────────────────────────
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'neptune-planters',
    audience: 'neptune-planters-client',
  });
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'neptune-planters',
    audience: 'neptune-planters-client',
  });
}

// ─────────────────────────────────────────────
// Token verification
// ─────────────────────────────────────────────
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'neptune-planters',
      audience: 'neptune-planters-client',
    }) as AccessTokenPayload;
    return payload;
  } catch (error) {
    const err = error as Error;
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token expired');
    }
    if (err.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid access token');
    }
    throw ApiError.unauthorized('Token verification failed');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'neptune-planters',
      audience: 'neptune-planters-client',
    }) as RefreshTokenPayload;
    return payload;
  } catch (error) {
    const err = error as Error;
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token expired. Please login again.');
    }
    if (err.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    throw ApiError.unauthorized('Token verification failed');
  }
}

// ─────────────────────────────────────────────
// Cookie config for refresh token
// ─────────────────────────────────────────────
export const REFRESH_COOKIE_NAME = 'neptune_refresh_token';

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.IS_PRODUCTION,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/auth',
};
