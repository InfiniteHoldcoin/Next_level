import fp from 'fastify-plugin';
import { jwtVerify } from 'jose';
import { env } from '../env.js';

export interface AuthUser {
  id: string;
  email?: string;
  tenantIds: string[];
  activeTenantId?: string;
  role?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
    requireAuth(): AuthUser;
    requireTenant(): { user: AuthUser; tenantId: string };
  }
}

export const authPlugin = fp(async (app) => {
  const rawSecret = env.SUPABASE_JWT_SECRET;

  // Fail at startup in production rather than silently running without auth
  if (!rawSecret && env.NODE_ENV === 'production') {
    throw new Error('SUPABASE_JWT_SECRET is required in production');
  }

  const secret = rawSecret ? new TextEncoder().encode(rawSecret) : null;

  app.decorateRequest('requireAuth', function (this: import('fastify').FastifyRequest) {
    if (!this.user) throw app.httpErrors.unauthorized('authentication required');
    return this.user;
  });
  app.decorateRequest('requireTenant', function (this: import('fastify').FastifyRequest) {
    const user = this.requireAuth();
    if (!user.activeTenantId) throw app.httpErrors.forbidden('no active tenant');
    return { user, tenantId: user.activeTenantId };
  });

  app.addHook('onRequest', async (req) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return;
    const token = auth.slice(7);

    if (!secret) {
      // Dev-only mock token: "dev:<userId>:<tenantId>" — NEVER active in production
      if (env.NODE_ENV === 'production') {
        req.log.error('SUPABASE_JWT_SECRET not set in production — rejecting all requests');
        return;
      }
      const [tag, userId, tenantId] = token.split(':');
      if (tag === 'dev' && userId && tenantId) {
        req.user = { id: userId, tenantIds: [tenantId], activeTenantId: tenantId };
      }
      return;
    }

    try {
      const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
      const sub = payload.sub;
      if (!sub) return;
      const meta = (payload.app_metadata ?? {}) as {
        tenant_ids?: string[];
        active_tenant_id?: string;
        role?: string;
      };
      const headerTenant = req.headers['x-tenant-id'];
      const activeTenant =
        (typeof headerTenant === 'string' ? headerTenant : undefined) ??
        meta.active_tenant_id ??
        meta.tenant_ids?.[0];
      const tenantIds = meta.tenant_ids ?? [];
      if (activeTenant && !tenantIds.includes(activeTenant)) {
        req.log.warn({ sub, activeTenant }, 'tenant not in user scope — ignoring');
        return;
      }
      if (!tenantIds.length) {
        req.log.debug({ sub }, 'JWT has no tenant_ids — user may not be onboarded yet');
      }
      req.user = {
        id: sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        tenantIds,
        activeTenantId: activeTenant,
        role: meta.role,
      };
    } catch (err) {
      req.log.warn({ err }, 'jwt verify failed');
    }
  });
});
