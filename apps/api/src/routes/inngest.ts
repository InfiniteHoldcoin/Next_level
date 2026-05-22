import { serve } from 'inngest/node';
import type { FastifyInstance } from 'fastify';
import { inngest, functions } from '@nextlevel/inngest';

const handler = serve({ client: inngest, functions });

export async function inngestRoutes(app: FastifyInstance) {
  app.route({
    method: ['GET', 'POST', 'PUT'],
    url: '/',
    config: { rawBody: true },
    handler: async (req, reply) => {
      reply.hijack();
      await handler(req.raw, reply.raw);
    },
  });
}
