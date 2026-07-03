import { WIDGET_SESSION_STORAGE_KEY } from './config.js';

// Visitor session id, persisted in localStorage so the conversation can resume across page loads
// on the same site. Falls back to an ephemeral in-memory id when storage is unavailable
// (private browsing, third-party storage blocked, etc).
export function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(WIDGET_SESSION_STORAGE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(WIDGET_SESSION_STORAGE_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
