import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function authRoutes(app: FastifyInstance) {
  app.route({
    method: 'GET',
    url: '/me',
    schema: {
      response: {
        200: z.object({
          authenticated: z.boolean(),
          user: z
            .object({
              id: z.string(),
              email: z.string().optional(),
              activeTenantId: z.string().optional(),
              tenantIds: z.array(z.string()),
              role: z.string().optional(),
            })
            .nullable(),
        }),
      },
    },
    handler: async (req) => ({
      authenticated: Boolean(req.user),
      user: req.user ?? null,
    }),
  });
}
