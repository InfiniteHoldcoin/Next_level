# syntax=docker/dockerfile:1
FROM node:20-alpine

# Native module support (postgres driver)
RUN apk add --no-cache libc6-compat

# Enable pnpm — pin version to match packageManager in package.json
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Non-root user (security)
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs fastify

WORKDIR /app

# --- Layer cache: copy package manifests before source ---
# pnpm install only re-runs when these files change, not when source changes
COPY --chown=fastify:nodejs package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --chown=fastify:nodejs apps/api/package.json     ./apps/api/
COPY --chown=fastify:nodejs apps/admin/package.json   ./apps/admin/
COPY --chown=fastify:nodejs apps/dashboard/package.json ./apps/dashboard/
COPY --chown=fastify:nodejs apps/widget/package.json  ./apps/widget/
COPY --chown=fastify:nodejs packages/db/package.json      ./packages/db/
COPY --chown=fastify:nodejs packages/llm/package.json     ./packages/llm/
COPY --chown=fastify:nodejs packages/inngest/package.json ./packages/inngest/
COPY --chown=fastify:nodejs packages/shared/package.json  ./packages/shared/
COPY --chown=fastify:nodejs packages/ui/package.json      ./packages/ui/

RUN pnpm install --frozen-lockfile

# --- Source code (after install so source changes don't bust the install cache) ---
COPY --chown=fastify:nodejs . .

USER fastify

EXPOSE 3000

# Health check — waits 30s before first check (app boot time)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# tsx handles TypeScript source directly — workspace packages export .ts files
CMD ["node_modules/.bin/tsx", "apps/api/src/index.ts"]
