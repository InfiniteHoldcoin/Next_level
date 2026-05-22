import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants.js';

export const learningEvents = pgTable(
  'learning_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    agent: text('agent').notNull(),
    kind: text('kind').notNull(),
    traceId: text('trace_id'),
    input: jsonb('input').$type<Record<string, unknown>>(),
    originalOutput: jsonb('original_output').$type<Record<string, unknown>>(),
    correctedOutput: jsonb('corrected_output').$type<Record<string, unknown>>(),
    correctionReason: text('correction_reason'),
    promotedToEval: text('promoted_to_eval'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantAgentIdx: index('learning_events_tenant_agent_idx').on(t.tenantId, t.agent, t.createdAt),
  }),
);
