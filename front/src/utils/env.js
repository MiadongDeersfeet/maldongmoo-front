/**
 * True when running Vite dev server on localhost (local-only UI such as test login).
 */
export function isLocalDevEnvironment() {
  if (!import.meta.env.DEV) {
    return false;
  }

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}
