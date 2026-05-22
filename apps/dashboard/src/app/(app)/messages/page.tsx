'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Wifi } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

type Message = {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  author_name: string | null;
  created_at: string;
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initial load: fetch history + grab tenant_id from JWT
  useEffect(() => {
    async function init() {
      const supabase = getSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const activeTenantId = (session.user.app_metadata?.active_tenant_id as string | undefined) ?? null;
      setTenantId(activeTenantId);

      const res = await fetch(`${API}/messages`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // API returns camelCase, Realtime returns snake_case — normalise
        setMessages(data.map(normalise));
      }
      setLoading(false);
    }
    init();
  }, []);

  // Supabase Realtime subscription — replaces 15s polling entirely
  useEffect(() => {
    if (!tenantId) return;
    const supabase = getSupabaseBrowser();

    const channel = supabase
      .channel(`messages:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_messages',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev; // deduplicate
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [tenantId]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function normalise(m: Record<string, unknown>): Message {
    return {
      id: m.id as string,
      direction: (m.direction ?? m.direction) as 'inbound' | 'outbound',
      content: m.content as string,
      author_name: (m.authorName ?? m.author_name ?? null) as string | null,
      created_at: (m.createdAt ?? m.created_at) as string,
    };
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const supabase = getSupabaseBrowser();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSending(false); return; }

    await fetch(`${API}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text.trim() }),
    });
    // Don't add to state manually — Realtime will push it back
    setText('');
    setSending(false);
  }

  return (
    <div className="flex flex-col h-full space-y-6" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">Communiquez avec l'équipe NextLevel.</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${connected ? 'bg-green-50 text-green-700' : 'bg-muted text-muted-foreground'}`}>
          <Wifi className="h-3 w-3" />
          {connected ? 'En ligne' : 'Connexion…'}
        </div>
      </div>

      <div className="rounded-lg border bg-card flex flex-col flex-1 overflow-hidden">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground py-8">Chargement…</p>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">Démarrez la conversation</p>
              <p className="text-xs text-muted-foreground mt-1">
                Votre conseiller NextLevel vous répondra ici et par courriel sous 24h.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.direction === 'inbound' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm ${
                  msg.direction === 'inbound'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}>
                  {msg.direction === 'outbound' && msg.author_name && (
                    <p className="text-xs font-medium mb-1 opacity-70">{msg.author_name} · NextLevel</p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-60 text-right">
                    {new Date(msg.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {new Date(msg.created_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); }
              }}
              placeholder="Écrivez votre message… (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)"
              rows={2}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm resize-none"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 self-end"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
