'use client';

import { useState, useEffect, useRef } from 'react';
import { Plug, Globe, FileText, Users, Scissors, Trash2, RefreshCw } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

type Source = {
  id: string;
  type: string;
  name: string;
  status: string;
  source_url: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  website: <Globe className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  csv_contacts: <Users className="h-4 w-4" />,
  csv_services: <Scissors className="h-4 w-4" />,
};

const TYPE_LABELS: Record<string, string> = {
  website: 'Site web',
  document: 'Document',
  csv_contacts: 'Contacts CSV',
  csv_services: 'Services CSV',
};

async function getToken(): Promise<string | null> {
  const { data } = await getSupabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

export default function ConnectionsPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'website' | 'document' | 'contacts' | 'services'>('website');
  const [url, setUrl] = useState('');
  const [crawling, setCrawling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadSources() {
    setLoading(true);
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${API}/data/sources`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setSources(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadSources(); }, []);

  function showFeedback(msg: string, ok: boolean) {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleCrawl(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setCrawling(true);
    const token = await getToken();
    const res = await fetch(`${API}/data/crawl`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
    });
    setCrawling(false);
    if (res.ok) {
      setUrl('');
      showFeedback('Site web indexé avec succès.', true);
      loadSources();
    } else {
      const err = await res.json();
      showFeedback(err.error ?? 'Erreur inconnue.', false);
    }
  }

  async function handleFileUpload(endpoint: string) {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    const token = await getToken();
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API}/data/${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
    if (res.ok) {
      const data = await res.json();
      const msg = data.imported
        ? `${data.imported} entrées importées.`
        : `Document indexé (${data.charCount?.toLocaleString()} caractères).`;
      showFeedback(msg, true);
      loadSources();
    } else {
      const err = await res.json();
      showFeedback(err.error ?? 'Erreur inconnue.', false);
    }
  }

  async function handleDelete(id: string) {
    const token = await getToken();
    await fetch(`${API}/data/sources/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setSources((prev) => prev.filter((s) => s.id !== id));
  }

  const tabs = [
    { key: 'website' as const, label: 'Site web', icon: <Globe className="h-4 w-4" /> },
    { key: 'document' as const, label: 'Document', icon: <FileText className="h-4 w-4" /> },
    { key: 'contacts' as const, label: 'Contacts CSV', icon: <Users className="h-4 w-4" /> },
    { key: 'services' as const, label: 'Services CSV', icon: <Scissors className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mes connexions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connectez vos données pour que nos agents puissent travailler pour vous.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-md px-4 py-3 text-sm ${feedback.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {feedback.msg}
        </div>
      )}

      {/* Add connection */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <p className="text-sm font-medium">Ajouter une connexion</p>
        </div>
        <div className="p-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-muted/40 rounded-md p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 flex-1 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Website crawl */}
          {activeTab === 'website' && (
            <form onSubmit={handleCrawl} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://votre-site.com"
                required
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={crawling}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {crawling ? 'Indexation…' : 'Indexer'}
              </button>
            </form>
          )}

          {/* Document upload */}
          {activeTab === 'document' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Formats acceptés : .txt, .md, .csv (max 10 MB)</p>
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept=".txt,.md,.csv" className="flex-1 text-sm" />
                <button
                  onClick={() => handleFileUpload('upload')}
                  disabled={uploading}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {uploading ? 'Upload…' : 'Uploader'}
                </button>
              </div>
            </div>
          )}

          {/* Contacts CSV */}
          {activeTab === 'contacts' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                CSV avec colonnes : <code className="bg-muted px-1 rounded">name, email, phone</code>
              </p>
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept=".csv" className="flex-1 text-sm" />
                <button
                  onClick={() => handleFileUpload('csv/contacts')}
                  disabled={uploading}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {uploading ? 'Import…' : 'Importer'}
                </button>
              </div>
            </div>
          )}

          {/* Services CSV */}
          {activeTab === 'services' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                CSV avec colonnes : <code className="bg-muted px-1 rounded">name, description, duration_min, price</code>
              </p>
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept=".csv" className="flex-1 text-sm" />
                <button
                  onClick={() => handleFileUpload('csv/services')}
                  disabled={uploading}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {uploading ? 'Import…' : 'Importer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sources list */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <p className="text-sm font-medium">Données connectées ({sources.length})</p>
          <button onClick={loadSources} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Chargement…</div>
        ) : sources.length === 0 ? (
          <div className="p-8 text-center">
            <Plug className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Aucune donnée connectée pour l'instant.</p>
          </div>
        ) : (
          <div className="divide-y">
            {sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">{TYPE_ICONS[s.type] ?? <Plug className="h-4 w-4" />}</div>
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {TYPE_LABELS[s.type] ?? s.type} ·{' '}
                      {new Date(s.created_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                      {(s.metadata as {count?: number}).count ? ` · ${(s.metadata as {count: number}).count} entrées` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {s.status === 'active' ? 'Actif' : 'En cours'}
                  </span>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
