import { useEffect, useRef, useState } from 'preact/hooks';
import { MAX_HISTORY_MESSAGES } from './config.js';
import { WIDGET_CSS } from './styles.js';

export interface ChatProps {
  tenantSlug: string;
  apiUrl: string;
  sessionId: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

const ERROR_MESSAGE = 'Une erreur est survenue. / An error occurred.';

function newId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function Chat({ tenantSlug, apiUrl, sessionId }: ChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-runs on message/loading/open changes to auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const history = messages
      .filter((m) => !m.error)
      .slice(-MAX_HISTORY_MESSAGES)
      .map(({ role, content }) => ({ role, content }));

    setMessages((prev) => [...prev, { id: newId(), role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/widget/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, sessionId, message: text, history }),
      });
      if (!res.ok) throw new Error(`widget chat failed: ${res.status}`);
      const data = (await res.json()) as { reply: string };
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'assistant', content: ERROR_MESSAGE, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="nlw-root">
      <style>{WIDGET_CSS}</style>

      {open && (
        // biome-ignore lint/a11y/useSemanticElements: native <dialog> is modal; this is a non-modal floating panel
        <div className="nlw-panel" role="dialog" aria-label="Assistant virtuel">
          <div className="nlw-header">
            <div>
              <div className="nlw-header-title">Assistant virtuel</div>
              <div className="nlw-header-sub">Répond habituellement en quelques secondes</div>
            </div>
            <button
              type="button"
              className="nlw-close"
              aria-label="Fermer"
              onClick={() => setOpen(false)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="nlw-messages" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="nlw-empty">
                Posez-nous une question — nous sommes là pour vous aider.
                <br />
                Ask us anything — we&apos;re here to help.
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`nlw-row ${m.role}`}>
                <div className={`nlw-bubble ${m.role}${m.error ? ' error' : ''}`}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="nlw-row assistant">
                <div className="nlw-bubble assistant">
                  <span className="nlw-typing">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="nlw-footer">
            <textarea
              className="nlw-textarea"
              placeholder="Écrivez votre message…"
              rows={1}
              value={input}
              onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className="nlw-send"
              disabled={!input.trim() || loading}
              onClick={handleSend}
              aria-label="Envoyer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="nlw-launcher"
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
