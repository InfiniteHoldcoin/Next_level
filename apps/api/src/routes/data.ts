import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getDb, schema } from '@nextlevel/db';
import { eq, and } from 'drizzle-orm';
import { parse as htmlParse } from 'node-html-parser';

// Strip HTML and clean up whitespace
function extractTextFromHtml(html: string): string {
  const root = htmlParse(html);
  // Remove script/style tags
  root.querySelectorAll('script, style, nav, footer, header').forEach((el) => el.remove());
  const text = root.text;
  return text.replace(/\s+/g, ' ').trim().slice(0, 50000);
}

// Parse a simple CSV into rows (handles quoted fields)
function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

export async function dataRoutes(app: FastifyInstance) {

  // GET /data/sources — list data sources for the authenticated tenant
  app.route({
    method: 'GET',
    url: '/sources',
    handler: async (req, reply) => {
      const user = req.requireAuth();
      const db = getDb();
      const rows = await db
        .select()
        .from(schema.userTenants)
        .where(eq(schema.userTenants.userId, user.id))
        .limit(1);
      if (!rows.length) return reply.send([]);

      const sources = await db
        .select()
        .from(schema.dataSources)
        .where(eq(schema.dataSources.tenantId, rows[0].tenantId));
      return reply.send(sources);
    },
  });

  // POST /data/crawl — crawl a website URL and extract text
  app.route({
    method: 'POST',
    url: '/crawl',
    schema: {
      body: z.object({ url: z.string().url() }),
    },
    handler: async (req, reply) => {
      const user = req.requireAuth();
      const { url } = req.body as { url: string };
      const db = getDb();

      const tenantRow = await db
        .select()
        .from(schema.userTenants)
        .where(eq(schema.userTenants.userId, user.id))
        .limit(1);
      if (!tenantRow.length) return reply.code(403).send({ error: 'Not onboarded' });
      const tenantId = tenantRow[0].tenantId;

      // Fetch the page
      let html: string;
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'NextLevel-Bot/1.0' },
          signal: AbortSignal.timeout(10000),
        });
        html = await res.text();
      } catch {
        return reply.code(400).send({ error: 'Impossible de récupérer cette URL.' });
      }

      const content = extractTextFromHtml(html);
      if (content.length < 50) {
        return reply.code(400).send({ error: 'Pas assez de contenu extrait.' });
      }

      const hostname = new URL(url).hostname;

      // Create data source record
      const [source] = await db.insert(schema.dataSources).values({
        tenantId,
        type: 'website',
        name: hostname,
        status: 'active',
        sourceUrl: url,
        lastSyncAt: new Date(),
      }).returning();

      // Store extracted content
      await db.insert(schema.knowledgeDocuments).values({
        tenantId,
        sourceId: source.id,
        title: `Site web — ${hostname}`,
        content,
        sourceType: 'website',
        sourceUrl: url,
        charCount: content.length,
      });

      return reply.send({ id: source.id, name: source.name, charCount: content.length });
    },
  });

  // POST /data/upload — upload a text document
  app.route({
    method: 'POST',
    url: '/upload',
    handler: async (req, reply) => {
      const user = req.requireAuth();
      const db = getDb();

      const tenantRow = await db
        .select()
        .from(schema.userTenants)
        .where(eq(schema.userTenants.userId, user.id))
        .limit(1);
      if (!tenantRow.length) return reply.code(403).send({ error: 'Not onboarded' });
      const tenantId = tenantRow[0].tenantId;

      const data = await req.file();
      if (!data) return reply.code(400).send({ error: 'Aucun fichier reçu.' });

      const allowed = ['.txt', '.md', '.csv'];
      const ext = data.filename.slice(data.filename.lastIndexOf('.')).toLowerCase();
      if (!allowed.includes(ext)) {
        return reply.code(400).send({ error: `Format non supporté. Accepté: ${allowed.join(', ')}` });
      }

      const buffer = await data.toBuffer();
      const content = buffer.toString('utf-8').slice(0, 50000);

      const [source] = await db.insert(schema.dataSources).values({
        tenantId,
        type: 'document',
        name: data.filename,
        status: 'active',
        lastSyncAt: new Date(),
      }).returning();

      await db.insert(schema.knowledgeDocuments).values({
        tenantId,
        sourceId: source.id,
        title: data.filename,
        content,
        sourceType: 'document',
        charCount: content.length,
      });

      return reply.send({ id: source.id, name: data.filename, charCount: content.length });
    },
  });

  // POST /data/csv/contacts — import contacts from CSV
  app.route({
    method: 'POST',
    url: '/csv/contacts',
    handler: async (req, reply) => {
      const user = req.requireAuth();
      const db = getDb();

      const tenantRow = await db
        .select()
        .from(schema.userTenants)
        .where(eq(schema.userTenants.userId, user.id))
        .limit(1);
      if (!tenantRow.length) return reply.code(403).send({ error: 'Not onboarded' });
      const tenantId = tenantRow[0].tenantId;

      const data = await req.file();
      if (!data) return reply.code(400).send({ error: 'Aucun fichier reçu.' });

      const buffer = await data.toBuffer();
      const rows = parseCsv(buffer.toString('utf-8'));

      if (!rows.length) return reply.code(400).send({ error: 'CSV vide ou mal formaté.' });

      // Expected columns: name, email, phone (flexible)
      const contactsToInsert = rows
        .filter((r) => r.email || r.name)
        .map((r) => ({
          tenantId,
          name: r.name || r.nom || null,
          email: r.email || r.courriel || null,
          phone: r.phone || r.telephone || r.tel || null,
          source: 'csv' as const,
        }));

      if (!contactsToInsert.length) {
        return reply.code(400).send({ error: 'Aucune ligne valide. Colonnes attendues: name, email, phone' });
      }

      await db.insert(schema.contacts).values(contactsToInsert);

      const [source] = await db.insert(schema.dataSources).values({
        tenantId,
        type: 'csv_contacts',
        name: `Contacts — ${data.filename}`,
        status: 'active',
        lastSyncAt: new Date(),
        metadata: { count: contactsToInsert.length },
      }).returning();

      return reply.send({ id: source.id, imported: contactsToInsert.length });
    },
  });

  // POST /data/csv/services — import service catalog from CSV
  app.route({
    method: 'POST',
    url: '/csv/services',
    handler: async (req, reply) => {
      const user = req.requireAuth();
      const db = getDb();

      const tenantRow = await db
        .select()
        .from(schema.userTenants)
        .where(eq(schema.userTenants.userId, user.id))
        .limit(1);
      if (!tenantRow.length) return reply.code(403).send({ error: 'Not onboarded' });
      const tenantId = tenantRow[0].tenantId;

      const data = await req.file();
      if (!data) return reply.code(400).send({ error: 'Aucun fichier reçu.' });

      const buffer = await data.toBuffer();
      const rows = parseCsv(buffer.toString('utf-8'));

      if (!rows.length) return reply.code(400).send({ error: 'CSV vide ou mal formaté.' });

      const servicesToInsert = rows
        .filter((r) => r.name || r.nom)
        .map((r) => ({
          tenantId,
          name: r.name || r.nom || '',
          description: r.description || r.desc || null,
          durationMin: r.duration_min || r.duree ? parseInt(r.duration_min || r.duree, 10) || null : null,
          price: r.price || r.prix || null,
        }));

      if (!servicesToInsert.length) {
        return reply.code(400).send({ error: 'Aucune ligne valide. Colonnes attendues: name, description, duration_min, price' });
      }

      await db.insert(schema.services).values(servicesToInsert);

      const [source] = await db.insert(schema.dataSources).values({
        tenantId,
        type: 'csv_services',
        name: `Services — ${data.filename}`,
        status: 'active',
        lastSyncAt: new Date(),
        metadata: { count: servicesToInsert.length },
      }).returning();

      return reply.send({ id: source.id, imported: servicesToInsert.length });
    },
  });

  // DELETE /data/sources/:id — remove a data source
  app.route({
    method: 'DELETE',
    url: '/sources/:id',
    schema: { params: z.object({ id: z.string().uuid() }) },
    handler: async (req, reply) => {
      const user = req.requireAuth();
      const { id } = req.params as { id: string };
      const db = getDb();

      const tenantRow = await db
        .select()
        .from(schema.userTenants)
        .where(eq(schema.userTenants.userId, user.id))
        .limit(1);
      if (!tenantRow.length) return reply.code(403).send({ error: 'Not onboarded' });

      await db.delete(schema.dataSources).where(
        and(
          eq(schema.dataSources.id, id),
          eq(schema.dataSources.tenantId, tenantRow[0].tenantId),
        ),
      );

      return reply.send({ ok: true });
    },
  });
}
