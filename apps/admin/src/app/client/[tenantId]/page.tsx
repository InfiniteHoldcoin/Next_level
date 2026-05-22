'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const STATUS_OPTIONS = [
  { value: 'nouveau', label: 'Nouveau' },
  { value: 'en_meeting', label: 'En meeting' },
  { value: 'en_setup', label: 'En setup' },
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
];

const STATUS_COLORS: Record<string, string> = {
  nouveau: 'bg-blue-100 text-blue-700',
  en_meeting: 'bg-yellow-100 text-yellow-700',
  en_setup: 'bg-purple-100 text-purple-700',
  actif: 'bg-green-100 text-green-700',
  inactif: 'bg-gray-100 text-gray-600',
};

type Tenant = {
  id: string; name: string; businessType: string | null; websiteUrl: string | null;
  city: string | null; clientStatus: string; internalNotes: string | null; assignedTo: string | null;
  createdAt: string;
};

type Source = { id: string; type: string; name: string; status: string; createdAt: string };
type Message = { id: string; direction: string; content: string; authorName: string | null; createdAt: string };
type Cost = { totalCostUsd: string; totalTokens: number; eventCount: number };
type ClientData = { tenant: Tenant; sources: Source[]; messages: Message[]; cost: Cost };

export default function ClientDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [status, setStatus] = useState('');
  const [msgText, setMsgText] = useState('');
  const [authorName, setAuthorName] = useState('Équipe NextLevel');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [saved, setSaved] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/client/${tenantId}`);
    if (res.ok) {
      const d: ClientData = await res.json();
      setData(d);
      setNotes(d.tenant.internalNotes ?? '');
      setAssignedTo(d.tenant.assignedTo ?? '');
      setStatus(d.tenant.clientStatus);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [tenantId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [data?.messages]);

  async function saveStatus() {
    setSavingStatus(true);
    await fetch(`/api/client/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientStatus: status, internalNotes: notes, assignedTo }),
    });
    setSavingStatus(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    await load();
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgText.trim()) return;
    setSendingMsg(true);
    await fetch(`/api/client/${tenantId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: msgText.trim(), authorName }),
    });
    setMsgText('');
    setSendingMsg(false);
    await load();
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement…</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Client introuvable.</div>;

  const { tenant, sources, messages, cost } = data;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Clients</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold">{tenant.name}</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[tenant.clientStatus] ?? 'bg-gray-100 text-gray-600'}`}>
          {tenant.clientStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Info + status */}
        <div className="space-y-4">
          {/* Client info card */}
          <div className="rounded-lg border bg-white p-4 space-y-2 text-sm">
            <p className="font-medium text-gray-700 mb-3">Informations</p>
            <div className="flex gap-2"><span className="text-gray-500 w-24">Type</span><span>{tenant.businessType === 'products' ? 'Produits' : tenant.businessType === 'services' ? 'Services' : '—'}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-24">Ville</span><span>{tenant.city ?? '—'}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-24">Site web</span><span className="truncate text-blue-600">{tenant.websiteUrl ?? '—'}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-24">Inscrit</span><span>{new Date(tenant.createdAt).toLocaleDateString('fr-CA')}</span></div>
          </div>

          {/* Status editor */}
          <div className="rounded-lg border bg-white p-4 space-y-3 text-sm">
            <p className="font-medium text-gray-700">Gestion interne</p>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Statut</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm">
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Assigné à</label>
              <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Prénom de l'équipe" className="w-full border rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Notes internes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border rounded px-2 py-1.5 text-sm resize-none" placeholder="Notes de meeting, observations…" />
            </div>
            <button onClick={saveStatus} disabled={savingStatus} className="w-full bg-gray-900 text-white rounded px-3 py-2 text-sm font-medium disabled:opacity-50">
              {savingStatus ? 'Sauvegarde…' : saved ? '✓ Sauvegardé' : 'Sauvegarder'}
            </button>
          </div>

          {/* LLM Cost this month */}
          <div className="rounded-lg border bg-white p-4 text-sm">
            <p className="font-medium text-gray-700 mb-3">Coûts LLM ce mois-ci</p>
            {cost.eventCount === 0 ? (
              <p className="text-gray-400 text-xs">Aucun appel IA ce mois-ci. Les agents ne sont pas encore actifs.</p>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total tokens</span>
                  <span className="font-mono">{cost.totalTokens.toLocaleString('fr-CA')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Coût USD</span>
                  <span className="font-mono font-medium">${parseFloat(cost.totalCostUsd).toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Appels IA</span>
                  <span>{cost.eventCount}</span>
                </div>
              </div>
            )}
          </div>

          {/* Data sources */}
          <div className="rounded-lg border bg-white p-4 text-sm">
            <p className="font-medium text-gray-700 mb-3">Données connectées ({sources.length})</p>
            {sources.length === 0 ? (
              <p className="text-gray-400">Aucune source.</p>
            ) : (
              <div className="space-y-2">
                {sources.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <span className="text-gray-700">{s.name}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{s.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Messages */}
        <div className="rounded-lg border bg-white flex flex-col" style={{ minHeight: '540px' }}>
          <div className="px-4 py-3 border-b">
            <p className="font-medium text-gray-700 text-sm">Messages avec le client</p>
            <p className="text-xs text-gray-400">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Aucun message pour l'instant.</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.direction === 'inbound' ? 'bg-gray-100 text-gray-800' : 'bg-gray-900 text-white'}`}>
                    {msg.direction === 'outbound' && msg.authorName && (
                      <p className="text-xs opacity-60 mb-0.5">{msg.authorName}</p>
                    )}
                    {msg.direction === 'inbound' && (
                      <p className="text-xs opacity-60 mb-0.5">Client</p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-50 text-right mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {new Date(msg.createdAt).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
          <div className="border-t p-3 space-y-2">
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Votre prénom (ex: Édouard)" className="w-full border rounded px-2 py-1.5 text-xs text-gray-600" />
            <form onSubmit={sendMessage} className="flex gap-2">
              <textarea
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as unknown as React.FormEvent); }}}
                rows={2}
                placeholder="Répondre au client… (Entrée pour envoyer)"
                className="flex-1 border rounded px-2 py-1.5 text-sm resize-none"
              />
              <button type="submit" disabled={sendingMsg || !msgText.trim()} className="bg-gray-900 text-white rounded px-3 py-2 text-sm self-end disabled:opacity-50">
                {sendingMsg ? '…' : '→'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
