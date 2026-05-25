import { createApp } from './app';
import { connectDB, disconnectDB } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';
import http from 'http';

// ─────────────────────────────────────────────
// Bootstrap the server
// ─────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  // 1. Connect to MongoDB first
  await connectDB();

  // 2. Create Express app
  const app = createApp();

  // 3. Create HTTP server
  const server = http.createServer(app);

  // 4. Start listening
  server.listen(env.PORT, () => {
    logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    logger.info(`  Neptune Planters API`);
    logger.info(`  Environment : ${env.NODE_ENV}`);
    logger.info(`  Port        : ${env.PORT}`);
    logger.info(`  URL         : http://localhost:${env.PORT}`);
    logger.info(`  API Base    : http://localhost:${env.PORT}/api`);
    logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  });

  // ─────────────────────────────────────────────
  // Graceful shutdown
  // ─────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.warn(`\nReceived ${signal}. Shutting down gracefully...`);

    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDB();
      logger.info('Shutdown complete. Goodbye! 👋');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // ─────────────────────────────────────────────
  // Unhandled rejection / uncaught exception guards
  // ─────────────────────────────────────────────
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Promise Rejection:', reason);
    void shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    void shutdown('uncaughtException');
  });
}

bootstrap().catch((error: unknown) => {
  const err = error as Error;
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
