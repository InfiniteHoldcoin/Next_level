-- RLS policies for tenant-scoped tables.
-- Two access paths exist:
--   1. Via Fastify API: sets app.tenant_id GUC → app_current_tenant() returns it
--   2. Via Supabase direct (JS client / Realtime): GUC not set, use JWT claims instead
-- Service role always bypasses RLS (Supabase implicit behaviour).

-- Helper: reads GUC set by Fastify tenantContextPlugin
CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$;

-- Helper: reads active_tenant_id from Supabase JWT (used for Realtime subscriptions)
CREATE OR REPLACE FUNCTION jwt_current_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    auth.jwt()->'app_metadata'->>'active_tenant_id',
    ''
  )::uuid;
$$;

-- Combined helper: works for BOTH access paths
CREATE OR REPLACE FUNCTION current_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(app_current_tenant(), jwt_current_tenant());
$$;

-- Generic enabler for all standard tables (Fastify path only — GUC-based)
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'tenant_features',
      'audit_log',
      'cost_events',
      'cost_caps',
      'tenant_prompt_overrides',
      'approvals',
      'learning_events',
      'data_sources',
      'knowledge_documents',
      'catalog_products'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($f$
      DROP POLICY IF EXISTS tenant_isolation ON %I;
      CREATE POLICY tenant_isolation ON %I
        USING (tenant_id = app_current_tenant())
        WITH CHECK (tenant_id = app_current_tenant());
    $f$, t, t);
  END LOOP;
END$$;

-- contacts & services: Fastify path only (never accessed via Supabase direct)
-- Extra isolation for Loi 25: NEVER accessible via Realtime, GUC required
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['contacts', 'services', 'widget_messages'])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($f$
      DROP POLICY IF EXISTS tenant_isolation ON %I;
      CREATE POLICY tenant_isolation ON %I
        USING (tenant_id = app_current_tenant() AND app_current_tenant() IS NOT NULL)
        WITH CHECK (tenant_id = app_current_tenant() AND app_current_tenant() IS NOT NULL);
    $f$, t, t);
  END LOOP;
END$$;

-- client_messages: dual-path (Fastify GUC + Supabase Realtime JWT)
-- This table is subscribed via Supabase Realtime in the dashboard
ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_messages FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON client_messages;
CREATE POLICY tenant_isolation ON client_messages
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

-- Grant DML to the `authenticated` role on all tenant-scoped tables.
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'tenants',
      'tenant_features',
      'audit_log',
      'cost_events',
      'cost_caps',
      'tenant_prompt_overrides',
      'approvals',
      'learning_events',
      'data_sources',
      'knowledge_documents',
      'contacts',
      'services',
      'catalog_products',
      'client_messages',
      'widget_messages'
    ])
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', t);
  END LOOP;
END$$;

-- tenants table: members only see their own tenant
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_self ON tenants;
CREATE POLICY tenant_self ON tenants
  USING (id = current_tenant())
  WITH CHECK (id = current_tenant());
