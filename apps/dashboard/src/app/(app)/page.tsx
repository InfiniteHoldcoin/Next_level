'use client';

import { useEffect, useState } from 'react';
import { LayoutGrid, Plug, Bot, BarChart2 } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function getToken() {
  const { data } = await getSupabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

export default function OverviewPage() {
  const [sourcesCount, setSourcesCount] = useState<number | null>(null);
  const [messagesCount, setMessagesCount] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      if (!token) return;
      const [srcRes, msgRes] = await Promise.all([
        fetch(`${API}/data/sources`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/messages`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (srcRes.ok) setSourcesCount((await srcRes.json()).length);
      if (msgRes.ok) setMessagesCount((await msgRes.json()).length);
    }
    load();
  }, []);

  const stats = [
    { label: 'Connexions', value: sourcesCount ?? '—', icon: <Plug className="h-4 w-4" />, href: '/connections' },
    { label: 'Agents actifs', value: '0', icon: <Bot className="h-4 w-4" />, href: '/agents' },
    { label: 'Messages', value: messagesCount ?? '—', icon: <BarChart2 className="h-4 w-4" />, href: '/messages' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenue sur NextLevel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Notre équipe configure vos agents IA. Vous serez notifié dès qu'ils sont prêts.
        </p>
      </div>

      {/* Status banner */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">En attente de configuration</p>
        <p className="text-sm text-amber-700 mt-0.5">
          Notre équipe vous contactera sous 24h pour planifier un meeting de découverte.{' '}
          <Link href="/messages" className="underline font-medium">Envoyer un message</Link>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon, href }) => (
          <Link key={label} href={href} className="rounded-lg border bg-card p-4 hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">{icon}<span className="text-xs">{label}</span></div>
            <p className="text-2xl font-bold">{value}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium mb-3">Prochaines étapes</p>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Connectez vos données dans <Link href="/connections" className="text-foreground underline">Mes connexions</Link></li>
          <li>Attendez le contact de l'équipe NextLevel (sous 24h)</li>
          <li>Votre premier agent sera configuré après le meeting</li>
        </ol>
      </div>
    </div>
  );
}
