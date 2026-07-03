import { type Db, getDb, schema } from '@nextlevel/db';
import { createLLMClient } from '@nextlevel/llm';
import { CostCapExceededError } from '@nextlevel/shared';
import { and, desc, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const MAX_KNOWLEDGE_DOCS = 3;
const MAX_DOC_CHARS = 1500;
const MAX_SERVICES = 10;

const FALLBACK_MESSAGE =
  'Service temporairement indisponible, réessayez plus tard. / Temporarily unavailable, please try again later.';

async function buildSystemPrompt(tx: Db, tenantId: string, tenantName: string): Promise<string> {
  const docs = await tx
    .select({ title: schema.knowledgeDocuments.title, content: schema.knowledgeDocuments.content })
    .from(schema.knowledgeDocuments)
    .where(eq(schema.knowledgeDocuments.tenantId, tenantId))
    .orderBy(desc(schema.knowledgeDocuments.createdAt))
    .limit(MAX_KNOWLEDGE_DOCS);

  const activeServices = await tx
    .select({
      name: schema.services.name,
      description: schema.services.description,
      price: schema.services.price,
    })
    .from(schema.services)
    .where(and(eq(schema.services.tenantId, tenantId), eq(schema.services.active, 'true')))
    .limit(MAX_SERVICES);

  const docsText = docs
    .map((d) => `# ${d.title}\n${d.content.slice(0, MAX_DOC_CHARS)}`)
    .join('\n\n');

  const servicesText = activeServices
    .map(
      (s) =>
        `- ${s.name}${s.price ? ` (${s.price})` : ''}${s.description ? `: ${s.description}` : ''}`,
    )
    .join('\n');

  const context =
    [docsText, servicesText].filter(Boolean).join('\n\n') ||
    'Aucune information disponible pour le moment.';

  return `Tu es l'assistant virtuel de ${tenantName}. Réponds dans la langue du visiteur (français ou anglais). Voici ce que tu sais sur l'entreprise :\n\n${context}\n\nSi tu ne sais pas répondre, dis-le honnêtement et invite le visiteur à contacter l'entreprise directement. Reste concis et professionnel.`;
}

export async function widgetRoutes(app: FastifyInstance) {
  // Public widget routes are embedded on third-party sites and carry no cookies/credentials,
  // so a wildcard Access-Control-Allow-Origin is safe here. The global @fastify/cors plugin
  // in server.ts is registered with `fastify-plugin`, which makes it apply to the whole app
  // regardless of encapsulation — registering a second @fastify/cors instance scoped to this
  // plugin would therefore also leak globally and fight the first one. A manual onRequest hook
  // scoped to this plugin's own (non-fp) encapsulation context is the reliable way to relax
  // CORS for just these routes.
  app.addHook('onRequest', async (req, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      reply.code(204).send();
    }
  });

  // Fastify only runs a route's onRequest hooks once its method+path has actually matched —
  // there is no implicit OPTIONS route, so the preflight needs its own explicit registration
  // (its handler never runs: the onRequest hook above already replies 204 and short-circuits).
  app.route({
    method: 'OPTIONS',
    url: '/chat',
    handler: async (_req, reply) => {
      reply.code(204).send();
    },
  });

  app.route({
    method: 'POST',
    url: '/chat',
    config: {
      rateLimit: { max: 20, timeWindow: '1 minute' },
    },
    schema: {
      body: z.object({
        tenantSlug: z.string().min(1),
        sessionId: z.string().uuid(),
        message: z.string().min(1).max(2000),
        history: z
          .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
          .max(20)
          .optional(),
      }),
    },
    handler: async (req, reply) => {
      const { tenantSlug, sessionId, message, history } = req.body as {
        tenantSlug: string;
        sessionId: string;
        message: string;
        history?: { role: 'user' | 'assistant'; content: string }[];
      };

      const db = getDb();
      // Public, unauthenticated lookup — the only legitimate place to query tenants without
      // tenant scoping, since the caller has no session yet, only the public slug.
      const [tenant] = await db
        .select()
        .from(schema.tenants)
        .where(and(eq(schema.tenants.slug, tenantSlug), eq(schema.tenants.status, 'active')))
        .limit(1);

      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      try {
        const replyText = await req.withTenantDb(async (tx) => {
          const system = await buildSystemPrompt(tx, tenant.id, tenant.name);

          const llm = createLLMClient(app.db);
          const result = await llm.complete({
            tenantId: tenant.id,
            agent: 'chatbot',
            operation: 'widget_chat',
            system,
            messages: [...(history ?? []), { role: 'user', content: message }],
            maxTokens: 500,
          });

          await tx.insert(schema.widgetMessages).values([
            { tenantId: tenant.id, sessionId, role: 'user', content: message },
            { tenantId: tenant.id, sessionId, role: 'assistant', content: result.content },
          ]);

          return result.content;
        }, tenant.id);

        return reply.send({ reply: replyText });
      } catch (err) {
        if (err instanceof CostCapExceededError) {
          return reply.code(429).send({ reply: FALLBACK_MESSAGE });
        }
        throw err;
      }
    },
  });
}
