import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import postgres from 'postgres';
import { randomUUID } from 'node:crypto';

const url = process.env.SUPABASE_DB_URL;
if (!url) throw new Error('SUPABASE_DB_URL is not set');

// `prepare: false` — required for pgbouncer-style pooled connections (Supabase).
// `max: 4` — small pool for tests, keep under PG max.
const sql = postgres(url, { max: 4, prepare: false });

const tenantA = randomUUID();
const tenantB = randomUUID();

beforeAll(async () => {
  await sql`INSERT INTO tenants (id, slug, name) VALUES (${tenantA}, ${'tenant-a-' + tenantA.slice(0, 8)}, 'A')`;
  await sql`INSERT INTO tenants (id, slug, name) VALUES (${tenantB}, ${'tenant-b-' + tenantB.slice(0, 8)}, 'B')`;
});

afterAll(async () => {
  // audit_log has onDelete: 'no action' for Loi 25 retention — clear it first.
  await sql`DELETE FROM audit_log WHERE tenant_id IN (${tenantA}, ${tenantB})`;
  await sql`DELETE FROM tenants WHERE id IN (${tenantA}, ${tenantB})`;
  await sql.end();
});

async function asTenant<T>(tenantId: string, fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
  return (await sql.begin(async (tx) => {
    await tx`SET LOCAL ROLE authenticated`;
    await tx`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return fn(tx);
  })) as T;
}

describe('RLS — tenant_features', () => {
  it('tenant B cannot read rows inserted by tenant A', async () => {
    await asTenant(tenantA, async (tx) => {
      await tx`INSERT INTO tenant_features (tenant_id, feature, enabled) VALUES (${tenantA}, 'feat-x', true)`;
    });

    const visibleToA = await asTenant(tenantA, async (tx) => {
      const rows = await tx`SELECT count(*)::int AS n FROM tenant_features`;
      return rows[0]!.n;
    });
    expect(visibleToA).toBe(1);

    const visibleToB = await asTenant(tenantB, async (tx) => {
      const rows = await tx`SELECT count(*)::int AS n FROM tenant_features`;
      return rows[0]!.n;
    });
    expect(visibleToB).toBe(0);
  });

  it('rejects insert with mismatched tenant_id (WITH CHECK)', async () => {
    await expect(
      asTenant(tenantA, async (tx) => {
        await tx`INSERT INTO tenant_features (tenant_id, feature, enabled) VALUES (${tenantB}, 'foo', true)`;
      }),
    ).rejects.toThrow();
  });

  it('rejects update that flips tenant_id to another tenant', async () => {
    await expect(
      asTenant(tenantA, async (tx) => {
        await tx`UPDATE tenant_features SET tenant_id = ${tenantB} WHERE tenant_id = ${tenantA}`;
      }),
    ).rejects.toThrow();
  });

  it('returns nothing when no GUC is set (deny-by-default)', async () => {
    const n = (await sql.begin(async (tx) => {
      await tx`SET LOCAL ROLE authenticated`;
      const rows = await tx`SELECT count(*)::int AS n FROM tenant_features`;
      return rows[0]!.n;
    })) as number;
    expect(n).toBe(0);
  });
});

describe('RLS — audit_log', () => {
  it('audit entries are tenant-isolated', async () => {
    await asTenant(tenantA, async (tx) => {
      await tx`INSERT INTO audit_log (tenant_id, actor_type, action, resource_type)
               VALUES (${tenantA}, 'system', 'test.write', 'tenant_features')`;
    });

    const seenByB = await asTenant(tenantB, async (tx) => {
      const rows = await tx`SELECT count(*)::int AS n FROM audit_log`;
      return rows[0]!.n;
    });
    expect(seenByB).toBe(0);
  });
});

describe('RLS — tenants self-visibility', () => {
  it('a tenant only sees its own row in tenants', async () => {
    const seenByA = await asTenant(tenantA, async (tx) => {
      const rows = await tx`SELECT id FROM tenants`;
      return rows.map((r) => r.id);
    });
    expect(seenByA).toEqual([tenantA]);
  });
});
