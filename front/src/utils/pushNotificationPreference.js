const STORAGE_KEY = 'maldongmoo:push-paused';

export const PUSH_PREFERENCE_CHANGED = 'maldongmoo:push-preference-changed';

export function isPushPaused() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setPushPaused(paused) {
  try {
    if (paused) {
      localStorage.setItem(STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }

  window.dispatchEvent(new CustomEvent(PUSH_PREFERENCE_CHANGED));
}
