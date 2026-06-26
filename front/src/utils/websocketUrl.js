const WS_PATH = '/ws';

/**
 * STOMP WebSocket endpoint. Uses VITE_API_BASE_URL in production (cross-origin API).
 * Falls back to the current host for local Vite proxy when VITE_API_BASE_URL is unset.
 */
export function buildWebSocketUrl() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

  if (apiBaseUrl) {
    const url = new URL(apiBaseUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}${WS_PATH}`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${WS_PATH}`;
}
