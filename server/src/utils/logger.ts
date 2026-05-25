// ─────────────────────────────────────────────
// Simple structured logger with timestamps
// ─────────────────────────────────────────────
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const COLORS: Record<LogLevel, string> = {
  info: '\x1b[36m',   // Cyan
  warn: '\x1b[33m',   // Yellow
  error: '\x1b[31m',  // Red
  debug: '\x1b[35m',  // Magenta
};
const RESET = '\x1b[0m';

function formatTimestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, message: string, ...meta: unknown[]): void {
  const color = COLORS[level];
  const prefix = `${color}[${level.toUpperCase()}]${RESET}`;
  const timestamp = `\x1b[90m${formatTimestamp()}\x1b[0m`;

  if (meta.length > 0) {
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `${timestamp} ${prefix}`,
      message,
      ...meta
    );
  } else {
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `${timestamp} ${prefix}`,
      message
    );
  }
}

export const logger = {
  info: (message: string, ...meta: unknown[]) => log('info', message, ...meta),
  warn: (message: string, ...meta: unknown[]) => log('warn', message, ...meta),
  error: (message: string, ...meta: unknown[]) => log('error', message, ...meta),
  debug: (message: string, ...meta: unknown[]) => {
    if (process.env['NODE_ENV'] !== 'production') {
      log('debug', message, ...meta);
    }
  },
};
