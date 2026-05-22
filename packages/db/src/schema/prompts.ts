import { pgTable, uuid, text, timestamp, integer, numeric, jsonb, boolean, primaryKey, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants.js';

export const promptVersions = pgTable(
  'prompt_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agent: text('agent').notNull(),
    name: text('name').notNull(),
    version: integer('version').notNull(),
    content: text('content').notNull(),
    outputSchema: jsonb('output_schema').$type<Record<string, unknown>>(),
    model: text('model'),
    temperature: numeric('temperature', { precision: 4, scale: 3 }),
    isDefault: boolean('is_default').notNull().default(false),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    agentNameVerIdx: index('prompt_versions_agent_name_ver_idx').on(t.agent, t.name, t.version),
  }),
);

export const tenantPromptOverrides = pgTable(
  'tenant_prompt_overrides',
  {
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    agent: text('agent').notNull(),
    name: text('name').notNull(),
    promptVersionId: uuid('prompt_version_id').notNull().references(() => promptVersions.id),
    shadow: boolean('shadow').notNull().default(false),
    note: text('note'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.tenantId, t.agent, t.name] }) }),
);
