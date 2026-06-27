let sharedAudioContext = null;

function getAudioContext() {
  if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
    return null;
  }

  const AudioContextClass = AudioContext || webkitAudioContext;

  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContextClass();
  }

  return sharedAudioContext;
}

async function ensureAudioContextRunning(audioContext) {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
}

function scheduleUiClick(audioContext, startAt, volume = 0.06) {
  const bufferSize = Math.max(1, Math.floor(audioContext.sampleRate * 0.018));
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    const decay = 1 - i / bufferSize;
    channel[i] = (Math.random() * 2 - 1) * decay * decay;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  const filter = audioContext.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1800, startAt);
  filter.Q.setValueAtTime(0.7, startAt);

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(volume, startAt);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.018);

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start(startAt);
  source.stop(startAt + 0.02);
}

function scheduleChirpNote(
  audioContext,
  { frequency, startAt, durationMs, volume = 0.16, wave = 'triangle' },
) {
  const durationSec = durationMs / 1000;

  const oscillator = audioContext.createOscillator();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, startAt);

  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(frequency * 2.4, 4200), startAt);
  filter.Q.setValueAtTime(0.4, startAt);

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.008);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec);

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + durationSec + 0.02);
}

function playChirpSequence(notes, { withClick = false, volume = 0.16 } = {}) {
  const audioContext = getAudioContext();
  if (!audioContext) {
    return Promise.resolve();
  }

  return ensureAudioContextRunning(audioContext)
    .then(() => {
      const baseTime = audioContext.currentTime + 0.01;

      notes.forEach((note) => {
        const startAt = baseTime + (note.delayMs ?? 0) / 1000;
        scheduleChirpNote(audioContext, {
          frequency: note.frequency,
          startAt,
          durationMs: note.durationMs,
          volume: note.volume ?? volume,
          wave: note.wave ?? 'triangle',
        });
      });

      if (withClick && notes.length > 0) {
        scheduleUiClick(audioContext, baseTime, volume * 0.45);
      }

      const totalMs = notes.reduce(
        (maxEnd, note) => Math.max(maxEnd, (note.delayMs ?? 0) + note.durationMs),
        0,
      );

      return new Promise((resolve) => {
        window.setTimeout(resolve, totalMs + 50);
      });
    })
    .catch(() => {});
}

/**
 * KakaoTalk / iOS Voice Memos inspired start cue:
 * soft click + ascending two-note chirp.
 */
export function playRecordingStartSound() {
  return playChirpSequence(
    [
      { frequency: 784, durationMs: 58, delayMs: 0 },
      { frequency: 1047, durationMs: 72, delayMs: 52 },
    ],
    { withClick: true, volume: 0.15 },
  );
}

/**
 * Android / iOS voice memo stop cue:
 * descending two-note confirmation.
 */
export function playRecordingStopSound() {
  return playChirpSequence(
    [
      { frequency: 988, durationMs: 62, delayMs: 0 },
      { frequency: 659, durationMs: 88, delayMs: 58 },
    ],
    { withClick: true, volume: 0.14 },
  );
}
