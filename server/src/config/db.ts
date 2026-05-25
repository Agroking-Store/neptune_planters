import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

// ─────────────────────────────────────────────
// Mongoose event listeners
// ─────────────────────────────────────────────
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connected successfully');
});

mongoose.connection.on('error', (err: Error) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

// ─────────────────────────────────────────────
// Connect with retry logic
// ─────────────────────────────────────────────
export async function connectDB(attempt = 1): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    const err = error as Error;
    logger.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);

    if (attempt >= MAX_RETRIES) {
      logger.error('Max MongoDB connection retries reached. Exiting process.');
      process.exit(1);
    }

    logger.info(`Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s... (${attempt}/${MAX_RETRIES})`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return connectDB(attempt + 1);
  }
}

// ─────────────────────────────────────────────
// Graceful disconnect (called on SIGTERM/SIGINT)
// ─────────────────────────────────────────────
export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed gracefully');
}
