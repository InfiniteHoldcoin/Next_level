import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb } from '@nextlevel/db';
import { schema } from '@nextlevel/db';
import { eq } from 'drizzle-orm';
import { env } from '../env.js';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

async function updateSupabaseAppMetadata(userId: string, tenantId: string) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return;
  await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_metadata: { tenant_ids: [tenantId], active_tenant_id: tenantId },
    }),
  });
}

export async function onboardingRoutes(app: FastifyInstance) {
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      body: z.object({
        companyName: z.string().min(1).max(100),
        businessType: z.enum(['products', 'services']),
        websiteUrl: z.string().url().optional().or(z.literal('')),
        city: z.string().max(100).optional(),
      }),
      response: {
        200: z.object({ tenantId: z.string(), slug: z.string() }),
      },
    },
    handler: async (req, reply) => {
      const user = req.requireAuth();
      const { companyName, businessType, websiteUrl, city } = req.body as {
        companyName: string;
        businessType: 'products' | 'services';
        websiteUrl?: string;
        city?: string;
      };

      const db = getDb();

      // Check if user already has a tenant
      const existing = await db
        .select()
        .from(schema.userTenants)
        .where(eq(schema.userTenants.userId, user.id))
        .limit(1);

      if (existing.length > 0) {
        const tenant = await db
          .select()
          .from(schema.tenants)
          .where(eq(schema.tenants.id, existing[0].tenantId))
          .limit(1);
        return reply.send({ tenantId: existing[0].tenantId, slug: tenant[0]?.slug ?? '' });
      }

      // Create tenant
      const baseSlug = slugify(companyName);
      const slug = `${baseSlug}-${Date.now().toString(36)}`;

      const [tenant] = await db
        .insert(schema.tenants)
        .values({
          slug,
          name: companyName,
          businessType,
          websiteUrl: websiteUrl || null,
          city: city || null,
          clientStatus: 'nouveau',
        })
        .returning();

      // Link user to tenant
      await db.insert(schema.userTenants).values({
        userId: user.id,
        tenantId: tenant.id,
        role: 'owner',
      });

      // Update Supabase app_metadata so the JWT contains tenant_ids on next refresh
      await updateSupabaseAppMetadata(user.id, tenant.id);

      return reply.send({ tenantId: tenant.id, slug: tenant.slug });
    },
  });

  // Check onboarding status — returns tenant if exists, null if not
  app.route({
    method: 'GET',
    url: '/status',
    schema: {
      response: {
        200: z.object({
          onboarded: z.boolean(),
          tenantId: z.string().nullable(),
          companyName: z.string().nullable(),
          businessType: z.string().nullable(),
        }),
      },
    },
    handler: async (req, reply) => {
      const user = req.requireAuth();
      const db = getDb();

      const rows = await db
        .select({ tenantId: schema.userTenants.tenantId })
        .from(schema.userTenants)
        .where(eq(schema.userTenants.userId, user.id))
        .limit(1);

      if (!rows.length) {
        return reply.send({ onboarded: false, tenantId: null, companyName: null, businessType: null });
      }

      const [tenant] = await db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.id, rows[0].tenantId))
        .limit(1);

      return reply.send({
        onboarded: true,
        tenantId: tenant.id,
        companyName: tenant.name,
        businessType: tenant.businessType,
      });
    },
  });

  // DELETE /onboarding/account — right to erasure (Loi 25 Art. 28)
  // Deletes tenant + all associated data via CASCADE, then deletes Supabase user
  app.route({
    method: 'DELETE',
    url: '/account',
    handler: async (req, reply) => {
      const user = req.requireAuth();
      const db = getDb();

      const rows = await db
        .select()
        .from(schema.userTenants)
        .where(eq(schema.userTenants.userId, user.id))
        .limit(1);

      if (rows.length) {
        // CASCADE deletes: knowledge_documents, data_sources, contacts, services,
        // catalog_products, client_messages, cost_events, etc.
        await db.delete(schema.tenants).where(eq(schema.tenants.id, rows[0].tenantId));
      }

      // Delete Supabase Auth user (removes login access permanently)
      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          },
        });
      }

      return reply.send({ deleted: true });
    },
  });
}
