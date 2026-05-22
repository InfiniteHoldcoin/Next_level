# NextLevel — Platform Monorepo

> AI marketing agency platform. Multi-tenant. FR/EN bilingual. Built solo by Edouard.

📚 **Documentation complète** : [`/NextLevel-Vault/`](../NextLevel-Vault/)
🎯 **Phase actuelle** : voir `../NextLevel-Vault/STATUS.md`
🤖 **Reprendre une session** : voir `../CLAUDE.md`

---

## Structure

```
nextlevel/
├── apps/
│   ├── api/          # Fastify backend (LLM, agents, webhooks)
│   ├── dashboard/    # Next.js — client-facing (le client gère son équipe IA)
│   ├── admin/        # Next.js — interne NextLevel (cockpit multi-clients)
│   └── widget/       # Preact + Shadow DOM — chatbot embeddable
├── packages/
│   ├── db/           # Drizzle ORM, schemas, migrations, RLS tests
│   ├── shared/       # Types, Zod validators, utils
│   ├── llm/          # LLM abstraction layer (Claude wrapped)
│   ├── inngest/      # Workflows + events orchestration
│   └── ui/           # Composants shadcn/ui partagés
├── infra/
│   ├── langfuse/     # Docker-compose pour Langfuse self-host
│   └── supabase/     # Migrations DB + seed
├── .github/
│   └── workflows/    # CI (lint, types, tests, RLS, eval)
└── (configs racine)
```

## Setup local

### Prérequis
- Node.js 20.10+
- pnpm 9+
- Docker (pour Langfuse + Postgres local)

### Installation
```bash
pnpm install
cp .env.example .env
# Remplir .env avec les credentials
```

### Dev
```bash
pnpm dev              # Lance tout en parallèle
pnpm --filter api dev # Juste l'API
```

### Tests
```bash
pnpm test             # Unitaires
pnpm test:rls         # Isolation multi-tenant
pnpm test:eval        # Eval IA (Promptfoo)
```

### DB
```bash
pnpm db:generate      # Génère migrations Drizzle depuis schemas
pnpm db:migrate       # Applique migrations
pnpm db:studio        # GUI Drizzle Studio
```

## Conventions

- **TypeScript strict** partout
- **Zod** à toutes les boundaries (API, jobs, webhooks)
- **Drizzle** pour Postgres (pas de SQL raw sauf migrations)
- **RLS** sur toute table avec `tenant_id` — test auto en CI
- **Biome** pour lint + format (rapide, no config)
- **Audit log** pour toute action critique
- **i18n FR/EN** : pas de strings hardcodés UI

## Liens

- [Vault docs](../NextLevel-Vault/)
- [Roadmap v3](../NextLevel-Vault/docs/20-Roadmap/Roadmap%20Master.md)
- [Quality Gates](../NextLevel-Vault/docs/30-Architecture/Quality%20Gates.md)
- [Stack Outils](../NextLevel-Vault/docs/50-Operations/Stack%20Outils.md)
