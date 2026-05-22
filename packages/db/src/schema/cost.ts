import { pgTable, uuid, text, timestamp, integer, numeric, jsonb, index, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenants.js';

export const costEvents = pgTable(
  'cost_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    agent: text('agent').notNull(),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    operation: text('operation').notNull(),
    inputTokens: integer('input_tokens').notNull().default(0),
    cachedInputTokens: integer('cached_input_tokens').notNull().default(0),
    outputTokens: integer('output_tokens').notNull().default(0),
    costUsd: numeric('cost_usd', { precision: 12, scale: 6 }).notNull().default('0'),
    status: text('status').notNull().default('completed'), // 'pending' | 'completed' | 'cancelled'
    traceId: text('trace_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantTimeIdx: index('cost_events_tenant_time_idx').on(t.tenantId, t.createdAt),
    tenantAgentIdx: index('cost_events_tenant_agent_idx').on(t.tenantId, t.agent, t.createdAt),
  }),
);

export const costCaps = pgTable('cost_caps', {
  tenantId: uuid('tenant_id').primaryKey().references(() => tenants.id, { onDelete: 'cascade' }),
  dailyCapUsd: numeric('daily_cap_usd', { precision: 10, scale: 2 }).notNull().default('5'),
  monthlyCapUsd: numeric('monthly_cap_usd', { precision: 10, scale: 2 }).notNull().default('100'),
  hardKill: boolean('hard_kill').notNull().default(true),
  alertThresholdPct: integer('alert_threshold_pct').notNull().default(80),
  perAgentCaps: jsonb('per_agent_caps').$type<Record<string, number>>().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
