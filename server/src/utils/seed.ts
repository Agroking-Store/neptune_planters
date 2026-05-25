/**
 * Seed Script — creates the initial admin user if none exists.
 * Run with: npm run seed
 *
 * This will NOT overwrite an existing admin user.
 */

import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../models/User.model';
import { logger } from './logger';

const SEED_ADMIN = {
  name: 'Admin',
  email: 'admin@neptuneplanters.com',
  password: 'Admin@12345',
  role: 'admin' as const,
  isActive: true,
};

async function seed(): Promise<void> {
  logger.info('Connecting to database...');
  await mongoose.connect(env.MONGODB_URI);
  logger.info('Connected to MongoDB');

  const existingAdmin = await User.findOne({ role: 'admin' }).exec();
  if (existingAdmin) {
    logger.warn(`Admin user already exists: ${existingAdmin.email}`);
    logger.warn('Skipping seed to avoid overwriting existing admin.');
    await mongoose.disconnect();
    return;
  }

  const admin = new User(SEED_ADMIN);
  await admin.save();

  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('  Admin user created successfully!');
  logger.info(`  Email    : ${SEED_ADMIN.email}`);
  logger.info(`  Password : ${SEED_ADMIN.password}`);
  logger.info('  ⚠️  Please change the password after first login!');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  logger.info('Disconnected. Seed complete.');
}

seed().catch((error: unknown) => {
  const err = error as Error;
  logger.error('Seed failed:', err.message);
  process.exit(1);
});
