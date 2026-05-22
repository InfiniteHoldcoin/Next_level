import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb, schema } from '@nextlevel/db';
import { eq, asc, desc, sql, and, gte } from 'drizzle-orm';
import { env } from '../env.js';

function requireAdminSecret(req: { headers: Record<string, string | string[] | undefined> }, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  // Accept ADMIN_SECRET or SUPABASE_SERVICE_ROLE_KEY as fallback for dev environments
  const validSecrets = [env.ADMIN_SECRET, env.SUPABASE_SERVICE_ROLE_KEY].filter(Boolean);
  const header = req.headers['x-admin-secret'];
  if (!validSecrets.length || !validSecrets.includes(header as string)) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  return null;
}

export async function adminRoutes(app: FastifyInstance) {

  // GET /admin/clients — list all tenants with stats
  app.route({
    method: 'GET',
    url: '/clients',
    handler: async (req, reply) => {
      const denied = requireAdminSecret(req as Parameters<typeof requireAdminSecret>[0], reply as Parameters<typeof requireAdminSecret>[1]);
      if (denied) return denied;

      const db = getDb();
      const tenants = await db.select().from(schema.tenants).orderBy(desc(schema.tenants.createdAt));
      return reply.send(tenants);
    },
  });

  // GET /admin/clients/:tenantId — single client detail
  app.route({
    method: 'GET',
    url: '/clients/:tenantId',
    schema: { params: z.object({ tenantId: z.string().uuid() }) },
    handler: async (req, reply) => {
      const denied = requireAdminSecret(req as Parameters<typeof requireAdminSecret>[0], reply as Parameters<typeof requireAdminSecret>[1]);
      if (denied) return denied;

      const { tenantId } = req.params as { tenantId: string };
      const db = getDb();

      const [tenant] = await db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.id, tenantId))
        .limit(1);
      if (!tenant) return reply.code(404).send({ error: 'Not found' });

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [sources, messages, costRows] = await Promise.all([
        db.select().from(schema.dataSources).where(eq(schema.dataSources.tenantId, tenantId)).orderBy(desc(schema.dataSources.createdAt)),
        db.select().from(schema.clientMessages).where(eq(schema.clientMessages.tenantId, tenantId)).orderBy(asc(schema.clientMessages.createdAt)),
        db.select({
          totalCostUsd: sql<string>`COALESCE(SUM(${schema.costEvents.costUsd}), 0)`,
          totalTokens: sql<number>`COALESCE(SUM(${schema.costEvents.inputTokens} + ${schema.costEvents.outputTokens}), 0)`,
          eventCount: sql<number>`COUNT(*)::int`,
        }).from(schema.costEvents).where(
          and(
            eq(schema.costEvents.tenantId, tenantId),
            gte(schema.costEvents.createdAt, startOfMonth),
          )
        ),
      ]);

      const cost = costRows[0] ?? { totalCostUsd: '0', totalTokens: 0, eventCount: 0 };
      return reply.send({ tenant, sources, messages, cost });
    },
  });

  // PATCH /admin/clients/:tenantId — update status/notes/assignedTo
  app.route({
    method: 'PATCH',
    url: '/clients/:tenantId',
    schema: {
      params: z.object({ tenantId: z.string().uuid() }),
      body: z.object({
        clientStatus: z.string().optional(),
        internalNotes: z.string().optional(),
        assignedTo: z.string().optional(),
      }),
    },
    handler: async (req, reply) => {
      const denied = requireAdminSecret(req as Parameters<typeof requireAdminSecret>[0], reply as Parameters<typeof requireAdminSecret>[1]);
      if (denied) return denied;

      const { tenantId } = req.params as { tenantId: string };
      const body = req.body as { clientStatus?: string; internalNotes?: string; assignedTo?: string };
      const db = getDb();

      const updates: Record<string, unknown> = {};
      if (body.clientStatus !== undefined) updates.clientStatus = body.clientStatus;
      if (body.internalNotes !== undefined) updates.internalNotes = body.internalNotes;
      if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo;

      const [updated] = await db
        .update(schema.tenants)
        .set(updates)
        .where(eq(schema.tenants.id, tenantId))
        .returning();

      return reply.send(updated);
    },
  });

  // POST /admin/clients/:tenantId/messages — team sends a message to client
  app.route({
    method: 'POST',
    url: '/clients/:tenantId/messages',
    schema: {
      params: z.object({ tenantId: z.string().uuid() }),
      body: z.object({ content: z.string().min(1).max(2000), authorName: z.string().min(1) }),
    },
    handler: async (req, reply) => {
      const denied = requireAdminSecret(req as Parameters<typeof requireAdminSecret>[0], reply as Parameters<typeof requireAdminSecret>[1]);
      if (denied) return denied;

      const { tenantId } = req.params as { tenantId: string };
      const { content, authorName } = req.body as { content: string; authorName: string };
      const db = getDb();

      const [msg] = await db.insert(schema.clientMessages).values({
        tenantId,
        direction: 'outbound',
        content,
        authorName,
      }).returning();

      return reply.code(201).send(msg);
    },
  });
}
