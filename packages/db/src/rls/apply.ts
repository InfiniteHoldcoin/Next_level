import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error('SUPABASE_DB_URL is not set');
  const here = dirname(fileURLToPath(import.meta.url));
  const sqlText = readFileSync(resolve(here, 'policies.sql'), 'utf8');
  const sql = postgres(url, { max: 1 });
  await sql.unsafe(sqlText);
  await sql.end();
  console.log('RLS policies applied');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
