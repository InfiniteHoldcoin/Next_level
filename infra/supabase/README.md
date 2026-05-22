# Supabase Infra

> Setup local et production Supabase. Région **ca-central-1** (data residency Canada).

## Setup local (dev)

Option A — Supabase CLI (recommandé) :
```bash
npx supabase init
npx supabase start
```

Option B — Postgres local + pgvector via Docker :
```bash
docker run -d --name nextlevel-pg \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

## Setup production

1. Créer projet sur supabase.com
2. **Région : ca-central-1** (Canada Central) — critique pour Loi 25
3. Activer extensions :
   - `pgcrypto` (chiffrement colonnes sensibles)
   - `vector` (pgvector pour embeddings)
   - `pg_stat_statements` (analyse perf)
4. Récupérer URL + anon key + service_role key → Doppler
5. Activer connection pooling (PgBouncer)
6. Configurer Auth (magic link, redirect URLs)

## Migrations

Gérées via Drizzle (`packages/db`). Pas de SQL raw sauf pour :
- Création extensions (run-once)
- Policies RLS (générées par notre script)

## RLS

Politique : **toute table avec `tenant_id` doit avoir RLS active**. Vérification automatique en CI (voir `packages/db/src/test/rls.test.ts`).
