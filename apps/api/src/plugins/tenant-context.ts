import fp from 'fastify-plugin';
import { sql } from 'drizzle-orm';
import { getDb, type Db } from '@nextlevel/db';
import { env } from '../env.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
  }
  interface FastifyRequest {
    /**
     * Run a callback inside a transaction with `app.tenant_id` GUC set.
     * RLS policies use `app_current_tenant()` which reads this GUC.
     * Defaults to the user's active tenant; throws if none.
     */
    withTenantDb<T>(fn: (tx: Db) => Promise<T>, tenantId?: string): Promise<T>;
  }
}

export const tenantContextPlugin = fp(
  async (app) => {
    const db = getDb(env.SUPABASE_DB_URL);
    app.decorate('db', db);

    app.decorateRequest('withTenantDb', function (
      this: import('fastify').FastifyRequest,
      fn: (tx: Db) => Promise<unknown>,
      tenantId?: string,
    ) {
      const tid = tenantId ?? this.user?.activeTenantId;
      if (!tid) throw app.httpErrors.forbidden('no active tenant');
      // postgres-js requires a literal in SET LOCAL; uuid format is validated upstream by RLS/queries.
      // Using parameterized SET via SELECT set_config is safe against injection.
      return db.transaction(async (tx) => {
        await tx.execute(sql`SET LOCAL ROLE authenticated`);
        await tx.execute(sql`select set_config('app.tenant_id', ${tid}, true)`);
        return fn(tx as unknown as Db);
      });
    });
  },
  { dependencies: [] },
);
