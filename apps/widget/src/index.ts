import { h, render } from 'preact';
import { Chat } from './Chat.js';
import { DEFAULT_API_URL } from './config.js';
import { getOrCreateSessionId } from './session.js';

// Must be captured synchronously at module evaluation time — `document.currentScript` is only
// valid while this script is actively executing, so it would be null by the time a deferred
// DOMContentLoaded callback runs (e.g. when the embed <script> uses `defer`/`async`).
const embedScriptEl = document.currentScript as HTMLScriptElement | null;

function mount() {
  const tenantSlug = embedScriptEl?.dataset.tenant;

  if (!tenantSlug) {
    console.warn(
      '[nextlevel-widget] missing data-tenant attribute on the embed <script> tag — widget not mounted.',
    );
    return;
  }

  const apiUrl = (embedScriptEl?.dataset.apiUrl ?? DEFAULT_API_URL).replace(/\/$/, '');
  const sessionId = getOrCreateSessionId();

  const host = document.createElement('div');
  host.id = 'nextlevel-widget-host';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);

  render(h(Chat, { tenantSlug, apiUrl, sessionId }), mountPoint);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
