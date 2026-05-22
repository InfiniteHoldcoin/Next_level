import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants.js';

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Audit logs survive tenant deletion for compliance (Loi 25 retention).
    // tenant_id is preserved as a value but FK is set null on tenant delete.
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'no action' }),
    actorId: uuid('actor_id'),
    actorType: text('actor_type').notNull(),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id'),
    diff: jsonb('diff').$type<Record<string, unknown>>(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('audit_log_tenant_idx').on(t.tenantId, t.createdAt),
    resourceIdx: index('audit_log_resource_idx').on(t.tenantId, t.resourceType, t.resourceId),
  }),
);
