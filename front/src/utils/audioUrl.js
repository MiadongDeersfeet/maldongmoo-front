export function resolveAudioUrl(audioUrl) {
  if (!audioUrl?.trim()) {
    return null;
  }

  const trimmed = audioUrl.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

  if (baseUrl) {
    return `${baseUrl}${path}`;
  }

  return path;
}
