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

  // 5. Store refresh token in whitelist using atomic update to avoid VersionError
  await User.updateOne(
    { _id: user._id },
    { $push: { refreshTokens: refreshToken } }
  );

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

  // 2. Find user
  const user = await User.findById(payload.userId).exec();
  if (!user) {
    throw ApiError.unauthorized('User not found. Please login again.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Account has been deactivated.');
  }

  // 3. Rotate: remove old, issue new pair
  const tokenPayload = {
    userId: (user._id as { toString(): string }).toString(),
    email: user.email,
    role: user.role,
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken({ userId: tokenPayload.userId });

  // 4. Atomically replace the old refresh token with the new one
  const result = await User.updateOne(
    { _id: user._id, refreshTokens: incomingRefreshToken },
    { $set: { 'refreshTokens.$': newRefreshToken } }
  );

  // If no document was modified, the incoming token wasn't in the array
  if (result.modifiedCount === 0) {
    // Possible token reuse attack — invalidate ALL sessions atomically
    await User.updateOne({ _id: user._id }, { $set: { refreshTokens: [] } });
    logger.warn(`Refresh token reuse detected for user: ${user.email}`);
    throw ApiError.unauthorized('Refresh token already used. Please login again.');
  }

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
  if (refreshToken) {
    // Invalidate only the current session's token
    await User.updateOne(
      { _id: userId },
      { $pull: { refreshTokens: refreshToken } }
    );
  } else {
    // Logout from all sessions
    await User.updateOne(
      { _id: userId },
      { $set: { refreshTokens: [] } }
    );
  }
  
  logger.info(`User logged out: ${userId}`);
}

