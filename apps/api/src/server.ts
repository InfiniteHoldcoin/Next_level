import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { logger, AppError } from '@nextlevel/shared';
import { env } from './env.js';
import { tenantContextPlugin } from './plugins/tenant-context.js';
import { authPlugin } from './plugins/auth.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { inngestRoutes } from './routes/inngest.js';
import { onboardingRoutes } from './routes/onboarding.js';
import { dataRoutes } from './routes/data.js';
import { messageRoutes } from './routes/messages.js';
import { adminRoutes } from './routes/admin.js';
import multipart from '@fastify/multipart';

export async function buildServer() {
  const app = Fastify({
    loggerInstance: logger,
    trustProxy: true,
    disableRequestLogging: false,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  });
  await app.register(cookie);
  await app.register(sensible);
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  await app.register(authPlugin);
  await app.register(tenantContextPlugin);

  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(inngestRoutes, { prefix: '/inngest' });
  await app.register(onboardingRoutes, { prefix: '/onboarding' });
  await app.register(dataRoutes, { prefix: '/data' });
  await app.register(messageRoutes, { prefix: '/messages' });
  await app.register(adminRoutes, { prefix: '/admin' });

  app.setErrorHandler((err: FastifyError, _req, reply) => {
    app.log.error({ err }, 'unhandled error');
    const status = err.statusCode ?? 500;
    const safeToExpose =
      err instanceof AppError ||
      (typeof err.code === 'string' && status < 500) || // Fastify HTTP errors (FST_ERR_*)
      ('validation' in err && Array.isArray((err as Record<string, unknown>).validation)); // Zod
    reply.status(status).send({
      error: err.name ?? 'InternalServerError',
      message: safeToExpose ? err.message : 'Internal server error',
    });
  });

  return app;
}
