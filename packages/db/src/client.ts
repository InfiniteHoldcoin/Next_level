import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

// Cache keyed by connection string — prevents singleton from returning wrong pool
const _clients = new Map<string, ReturnType<typeof drizzle<typeof schema>>>();

export function getDb(connectionString = process.env.SUPABASE_DB_URL) {
  if (!connectionString) throw new Error('SUPABASE_DB_URL is not set');
  const cached = _clients.get(connectionString);
  if (cached) return cached;
  const sql = postgres(connectionString, {
    max: Number(process.env.PG_POOL_MAX ?? 10),
    idle_timeout: 30,
    max_lifetime: 60 * 30,
    prepare: false,
    connection: {
      // Kill runaway queries — never hold a DB connection for longer than this
      statement_timeout: process.env.PG_STATEMENT_TIMEOUT ?? '15s',
    },
  });
  const client = drizzle(sql, { schema });
  _clients.set(connectionString, client);
  return client;
}

export type Db = ReturnType<typeof getDb>;
export { schema };
