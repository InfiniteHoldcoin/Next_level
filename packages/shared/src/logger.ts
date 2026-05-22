import { pino } from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { app: process.env.APP_NAME ?? 'nextlevel' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.apiKey',
      '*.api_key',
      '*.password',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
});

export type Logger = typeof logger;
