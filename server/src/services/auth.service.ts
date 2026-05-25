import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────
// Login: validate credentials, issue token pair
// ─────────────────────────────────────────────
export async function loginUser(
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string }> {
  // 1. Find user (includes password and refreshTokens via static method)
  const user = await User.findByEmail(email);
  if (!user) {
    // Use generic message to prevent user enumeration
    throw ApiError.unauthorized('Invalid email or password');
  }

  // 2. Check account is active
  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Contact support.');
  }

  // 3. Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // 4. Generate token pair
  const tokenPayload = {
    userId: (user._id as { toString(): string }).toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken({
    userId: tokenPayload.userId,
  });

  // 5. Store refresh token in whitelist
  user.refreshTokens.push(refreshToken);
  await user.save();

  logger.info(`User logged in: ${user.email}`);
  return { accessToken, refreshToken };
}

// ─────────────────────────────────────────────
// Refresh: rotate refresh token, issue new pair
// ─────────────────────────────────────────────
export async function refreshAccessToken(
  incomingRefreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  // 1. Verify JWT signature and expiry
  const payload = verifyRefreshToken(incomingRefreshToken);

  // 2. Find user + check whitelist
  const user = await User.findById(payload.userId)
    .select('+refreshTokens')
    .exec();

  if (!user) {
    throw ApiError.unauthorized('User not found. Please login again.');
  }

  const tokenIndex = user.refreshTokens.indexOf(incomingRefreshToken);
  if (tokenIndex === -1) {
    // Possible token reuse attack — invalidate ALL sessions
    user.refreshTokens = [];
    await user.save();
    logger.warn(`Refresh token reuse detected for user: ${user.email}`);
    throw ApiError.unauthorized('Refresh token already used. Please login again.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Account has been deactivated.');
  }

  // 3. Rotate: remove old, issue new pair
  user.refreshTokens.splice(tokenIndex, 1);

  const tokenPayload = {
    userId: (user._id as { toString(): string }).toString(),
    email: user.email,
    role: user.role,
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken({ userId: tokenPayload.userId });

  user.refreshTokens.push(newRefreshToken);
  await user.save();

  logger.info(`Token refreshed for user: ${user.email}`);
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

// ─────────────────────────────────────────────
// Logout: invalidate specific refresh token
// ─────────────────────────────────────────────
export async function logoutUser(
  userId: string,
  refreshToken?: string
): Promise<void> {
  const user = await User.findById(userId).select('+refreshTokens').exec();
  if (!user) return;

  if (refreshToken) {
    // Invalidate only the current session's token
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
  } else {
    // Logout from all sessions
    user.refreshTokens = [];
  }

  await user.save();
  logger.info(`User logged out: ${user.email}`);
}
