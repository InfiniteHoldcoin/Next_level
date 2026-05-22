import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb, schema } from '@nextlevel/db';
import { eq, asc } from 'drizzle-orm';

export async function messageRoutes(app: FastifyInstance) {

  // GET /messages — list all messages for the authenticated tenant
  app.route({
    method: 'GET',
    url: '/',
    handler: async (req, reply) => {
      const user = req.requireAuth();
      const db = getDb();

      const tenantRow = await db
        .select()
        .from(schema.userTenants)
        .where(eq(schema.userTenants.userId, user.id))
        .limit(1);
      if (!tenantRow.length) return reply.send([]);

      const messages = await db
        .select()
        .from(schema.clientMessages)
        .where(eq(schema.clientMessages.tenantId, tenantRow[0].tenantId))
        .orderBy(asc(schema.clientMessages.createdAt));

      return reply.send(messages);
    },
  });

  // POST /messages — client sends a message to the NextLevel team
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      body: z.object({ content: z.string().min(1).max(2000) }),
    },
    handler: async (req, reply) => {
      const user = req.requireAuth();
      const { content } = req.body as { content: string };
      const db = getDb();

      const tenantRow = await db
        .select()
        .from(schema.userTenants)
        .where(eq(schema.userTenants.userId, user.id))
        .limit(1);
      if (!tenantRow.length) return reply.code(403).send({ error: 'Not onboarded' });

      const [msg] = await db.insert(schema.clientMessages).values({
        tenantId: tenantRow[0].tenantId,
        direction: 'inbound',
        content,
      }).returning();

      return reply.code(201).send(msg);
    },
  });
}
