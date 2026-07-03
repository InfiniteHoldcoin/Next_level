import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { tenants } from './tenants.js';

// Chat history for the embeddable widget (apps/widget) — visitor ↔ AI agent on the tenant's own site.
// Not to be confused with client_messages (NextLevel ↔ client conversation in the dashboard).
export const widgetMessages = pgTable(
  'widget_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').notNull(),
    role: text('role').notNull(), // 'user' | 'assistant'
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantSessionIdx: index('widget_messages_tenant_session_idx').on(
      t.tenantId,
      t.sessionId,
      t.createdAt,
    ),
  }),
);
