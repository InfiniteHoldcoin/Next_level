import { z } from 'zod';
import { loadEnv } from '@nextlevel/shared';

const apiEnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3001'),
  SUPABASE_DB_URL: z.string().url(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  // Required in production — fail at boot rather than silently disabling auth
  SUPABASE_JWT_SECRET: z.string().min(32).optional(),
  SENTRY_DSN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  ADMIN_SECRET: z.string().min(16).optional(),
});

export const env = loadEnv(apiEnvSchema);
export type ApiEnv = typeof env;
