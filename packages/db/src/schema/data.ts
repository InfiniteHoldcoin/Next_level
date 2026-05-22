import { pgTable, uuid, text, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants.js';

// Tracks every connected data source per tenant
export const dataSources = pgTable(
  'data_sources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'document' | 'website' | 'shopify' | 'csv_contacts' | 'csv_services'
    name: text('name').notNull(),
    status: text('status').notNull().default('active'), // 'active' | 'pending' | 'error'
    sourceUrl: text('source_url'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  },
  (t) => ({
    tenantIdx: index('data_sources_tenant_idx').on(t.tenantId, t.createdAt),
  }),
);

// Extracted text content from all sources — used by agents for context
export const knowledgeDocuments = pgTable(
  'knowledge_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    sourceId: uuid('source_id').references(() => dataSources.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    sourceType: text('source_type').notNull(), // 'document' | 'website' | 'manual'
    sourceUrl: text('source_url'),
    charCount: integer('char_count').notNull().default(0),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('knowledge_docs_tenant_idx').on(t.tenantId, t.createdAt),
  }),
);

// Normalized customer contacts from all sources
export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name'),
    email: text('email'),
    phone: text('phone'),
    source: text('source').notNull().default('manual'), // 'csv' | 'shopify' | 'booking' | 'manual'
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('contacts_tenant_idx').on(t.tenantId, t.createdAt),
  }),
);

// Service catalog for service businesses (salons, clinics, etc.)
export const services = pgTable(
  'services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    durationMin: integer('duration_min'),
    price: text('price'), // stored as string to avoid float issues
    active: text('active').notNull().default('true'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('services_tenant_idx').on(t.tenantId),
  }),
);

// Client ↔ NextLevel team messaging
export const clientMessages = pgTable(
  'client_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    direction: text('direction').notNull(), // 'inbound' (client→team) | 'outbound' (team→client)
    content: text('content').notNull(),
    authorName: text('author_name'), // team member name for outbound, null for inbound
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('client_messages_tenant_idx').on(t.tenantId, t.createdAt),
  }),
);

// Product catalog for e-commerce businesses
export const catalogProducts = pgTable(
  'catalog_products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    externalId: text('external_id'),
    title: text('title').notNull(),
    description: text('description'),
    price: text('price'),
    imageUrl: text('image_url'),
    source: text('source').notNull().default('manual'), // 'shopify' | 'csv' | 'manual'
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('catalog_products_tenant_idx').on(t.tenantId),
  }),
);
