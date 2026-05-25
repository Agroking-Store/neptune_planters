import { z } from 'zod';

// ─────────────────────────────────────────────
// Login schema
// ─────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─────────────────────────────────────────────
// Refresh token schema (from cookie or body)
// ─────────────────────────────────────────────
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token cannot be empty')
    .optional(),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
