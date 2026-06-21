const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'audio/webm',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/wave',
]);

export function normalizeVoiceMimeType(mimeType) {
  const base = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();

  if (base === 'video/webm') {
    return 'audio/webm';
  }

  if (ALLOWED_UPLOAD_MIME_TYPES.has(base)) {
    return base;
  }

  return 'audio/webm';
}

export function getExtensionForVoiceMimeType(mimeType) {
  const normalized = normalizeVoiceMimeType(mimeType);

  if (normalized === 'audio/mp4' || normalized === 'audio/x-m4a') {
    return 'm4a';
  }
  if (normalized === 'audio/mpeg') {
    return 'mp3';
  }
  if (normalized === 'audio/wav' || normalized === 'audio/wave') {
    return 'wav';
  }

  return 'webm';
}

export function createVoiceUploadFile(audioBlob, sourceMimeType = 'audio/webm') {
  const mimeType = normalizeVoiceMimeType(sourceMimeType);
  const extension = getExtensionForVoiceMimeType(mimeType);

  return new File(
    [audioBlob],
    `voice-check-in-${Date.now()}.${extension}`,
    { type: mimeType },
  );
}

export function normalizeVoiceUploadFile(voiceFile) {
  if (!(voiceFile instanceof Blob)) {
    return voiceFile;
  }

  const mimeType = normalizeVoiceMimeType(voiceFile.type);
  const extension = getExtensionForVoiceMimeType(mimeType);
  const name =
    voiceFile instanceof File && voiceFile.name.includes('.')
      ? voiceFile.name
      : `voice-check-in-${Date.now()}.${extension}`;

  if (voiceFile instanceof File && voiceFile.type === mimeType && voiceFile.name === name) {
    return voiceFile;
  }

  return new File([voiceFile], name, { type: mimeType });
}
