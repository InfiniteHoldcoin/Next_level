import { and, desc, eq } from 'drizzle-orm';
import { schema, type Db } from '@nextlevel/db';

const CACHE_TTL = 60_000;

interface CachedEntry {
  content: string;
  model?: string;
  temperature?: number;
  expiresAt: number;
}

const cache = new Map<string, CachedEntry>();

export async function getPrompt(
  db: Db,
  agent: string,
  name: string,
  tenantId?: string,
): Promise<{ content: string; model?: string; temperature?: number }> {
  const key = `${agent}:${name}:${tenantId ?? '__default__'}`;
  const hit = cache.get(key);
  if (hit && Date.now() < hit.expiresAt) {
    return { content: hit.content, model: hit.model, temperature: hit.temperature };
  }

  if (tenantId) {
    const [override] = await db
      .select({ versionId: schema.tenantPromptOverrides.promptVersionId })
      .from(schema.tenantPromptOverrides)
      .where(
        and(
          eq(schema.tenantPromptOverrides.tenantId, tenantId),
          eq(schema.tenantPromptOverrides.agent, agent),
          eq(schema.tenantPromptOverrides.name, name),
        ),
      )
      .limit(1);

    if (override) {
      const [v] = await db
        .select()
        .from(schema.promptVersions)
        .where(eq(schema.promptVersions.id, override.versionId))
        .limit(1);

      if (v) {
        const entry = toEntry(v);
        cache.set(key, { ...entry, expiresAt: Date.now() + CACHE_TTL });
        return entry;
      }
    }
  }

  const [v] = await db
    .select()
    .from(schema.promptVersions)
    .where(
      and(
        eq(schema.promptVersions.agent, agent),
        eq(schema.promptVersions.name, name),
        eq(schema.promptVersions.isDefault, true),
      ),
    )
    .orderBy(desc(schema.promptVersions.version))
    .limit(1);

  if (!v) throw new Error(`Prompt not found: ${agent}/${name}`);

  const entry = toEntry(v);
  cache.set(key, { ...entry, expiresAt: Date.now() + CACHE_TTL });
  return entry;
}

/**
 * Invalidates cached prompts.
 * - No args: clears entire cache
 * - agent only: clears all prompts for that agent
 * - agent + name: clears specific prompt (all tenants)
 * - agent + name + tenantId: clears specific tenant override
 */
export function invalidatePromptCache(agent?: string, name?: string, tenantId?: string) {
  if (!agent) {
    cache.clear();
    return;
  }
  // Use strict separator to avoid 'chat' matching 'chatbot'
  const prefix = name ? `${agent}:${name}:` : `${agent}:`;
  for (const k of cache.keys()) {
    if (k.startsWith(prefix) && (!tenantId || k.endsWith(`:${tenantId}`))) {
      cache.delete(k);
    }
  }
}

function toEntry(v: typeof schema.promptVersions.$inferSelect) {
  return {
    content: v.content,
    model: v.model ?? undefined,
    temperature: v.temperature != null ? Number(v.temperature) : undefined,
  };
}
