// Fallback API base URL used when the embed snippet doesn't set `data-api-url`.
// Replace with the production API origin before shipping a build meant for real tenant sites,
// or always pass `data-api-url` explicitly in the embed snippet (recommended).
export const DEFAULT_API_URL = 'https://api.nextlevel.app';

export const WIDGET_SESSION_STORAGE_KEY = 'nextlevel_widget_session';

export const MAX_HISTORY_MESSAGES = 20;
