import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function healthRoutes(app: FastifyInstance) {
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      response: {
        200: z.object({ status: z.literal('ok'), uptime: z.number(), now: z.string() }),
      },
    },
    handler: async () => ({
      status: 'ok' as const,
      uptime: process.uptime(),
      now: new Date().toISOString(),
    }),
  });
}
