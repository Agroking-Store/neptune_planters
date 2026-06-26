import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from '../utils/jwt';
import {
  loginUser,
  refreshAccessToken,
  logoutUser,
} from '../services/auth.service';
import { User } from '../models/User.model';

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body as {
    email: string;
    password: string;
    rememberMe?: boolean;
  };

  const { accessToken, refreshToken } = await loginUser(email, password);

  // Remember Me: 30 days if checked, 7 days if not
  const cookieOptions = {
    ...refreshCookieOptions,
    maxAge: rememberMe
      ? 30 * 24 * 60 * 60 * 1000  // 30 days
      : 7  * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);

  res.status(200).json(
    ApiResponse.success('Login successful', { accessToken }).toJSON()
  );
});

// ─────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  // Token can come from cookie (preferred) or body (fallback for non-browser clients)
  const incomingToken =
    (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE_NAME] ??
    (req.body as { refreshToken?: string }).refreshToken;

  if (!incomingToken) {
    throw ApiError.unauthorized('No refresh token provided');
  }

  const { accessToken, refreshToken: newRefreshToken } = await refreshAccessToken(
    incomingToken
  );

  // Rotate cookie
  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions);

  res.status(200).json(
    ApiResponse.success('Token refreshed successfully', { accessToken }).toJSON()
  );
});

// ─────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken =
    (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE_NAME];

  if (req.user) {
    await logoutUser(req.user.userId, refreshToken);
  }

  // Clear cookie
  res.clearCookie(REFRESH_COOKIE_NAME, { path: refreshCookieOptions.path });

  res.status(200).json(
    ApiResponse.success('Logged out successfully').toJSON()
  );
});

// ─────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Not authenticated');
  }

  const user = await User.findById(req.user.userId).select('-__v').exec();
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  res.status(200).json(
    ApiResponse.success('User profile retrieved', user.toJSON()).toJSON()
  );
});

// ─────────────────────────────────────────────
// PUT /api/auth/me
// ─────────────────────────────────────────────
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Not authenticated');
  }

  const user = await User.findById(req.user.userId).exec();
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (name) user.name = name;
  if (email) {
    const existing = await User.findOne({ email });
    if (existing && existing._id.toString() !== user._id.toString()) {
      throw ApiError.badRequest('Email already in use');
    }
    user.email = email;
  }
  if (password) {
    user.password = password;
  }

  await user.save();

  res.status(200).json(
    ApiResponse.success('Profile updated successfully', user.toJSON()).toJSON()
  );
});

// ─────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────
import { sendOtpEmail } from '../utils/mailer';
import crypto from 'crypto';

export const forgotPassword = asyncHandler(async (_req: Request, res: Response) => {
  // Find the single admin in the system
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    throw ApiError.notFound('Admin user not found in the system');
  }

  // Generate a 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  
  // Set OTP and expiry (10 minutes from now)
  admin.resetPasswordOtp = otp;
  admin.resetPasswordOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await admin.save();

  // Send email to admin
  await sendOtpEmail(admin.email, otp);

  res.status(200).json(
    ApiResponse.success('OTP sent to admin email successfully').toJSON()
  );
});

// ─────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { otp, newPassword } = req.body as { otp: string; newPassword: string };

  if (!otp || !newPassword) {
    throw ApiError.badRequest('OTP and newPassword are required');
  }

  // Find admin user with this OTP that hasn't expired
  const admin = await User.findOne({
    role: 'admin',
    resetPasswordOtp: otp,
    resetPasswordOtpExpiry: { $gt: new Date() } // expiry is strictly greater than now
  });

  if (!admin) {
    throw ApiError.badRequest('Invalid or expired OTP');
  }

  // Update password and clear OTP
  admin.password = newPassword;
  admin.resetPasswordOtp = undefined;
  admin.resetPasswordOtpExpiry = undefined;
  
  await admin.save();

  res.status(200).json(
    ApiResponse.success('Password has been reset successfully').toJSON()
  );
});
