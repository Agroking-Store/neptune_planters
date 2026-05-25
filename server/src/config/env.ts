import dotenv from 'dotenv';
import path from 'path';

// Load .env from the server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─────────────────────────────────────────────
// Helper: assert a required env variable exists
// ─────────────────────────────────────────────
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
  return value.trim();
}

function optionalEnv(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

// ─────────────────────────────────────────────
// Exported typed environment configuration
// ─────────────────────────────────────────────
export const env = {
  // Server
  PORT: parseInt(optionalEnv('PORT', '5000'), 10),
  NODE_ENV: optionalEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',

  // Database
  MONGODB_URI: requireEnv('MONGODB_URI'),

  // JWT
  JWT_ACCESS_SECRET: requireEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: optionalEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: optionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),

  // Security
  BCRYPT_SALT_ROUNDS: parseInt(optionalEnv('BCRYPT_SALT_ROUNDS', '12'), 10),
  ALLOWED_ORIGINS: optionalEnv('ALLOWED_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  // Derived
  IS_PRODUCTION: optionalEnv('NODE_ENV', 'development') === 'production',
  IS_DEVELOPMENT: optionalEnv('NODE_ENV', 'development') === 'development',
} as const;
