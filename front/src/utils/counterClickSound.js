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

function createNoiseBuffer(audioContext, durationSec, curvePower = 4.2) {
  const bufferSize = Math.max(1, Math.floor(audioContext.sampleRate * durationSec));
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    const progress = i / bufferSize;
    const envelope = (1 - progress) ** curvePower;
    channel[i] = (Math.random() * 2 - 1) * envelope;
  }

  return buffer;
}

function scheduleWoodKnock(
  audioContext,
  startAt,
  {
    durationSec,
    volume,
    frequency,
    q = 1.4,
    curvePower = 4.2,
    filterType = 'bandpass',
  },
) {
  const source = audioContext.createBufferSource();
  source.buffer = createNoiseBuffer(audioContext, durationSec, curvePower);

  const filter = audioContext.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(frequency, startAt);
  filter.Q.setValueAtTime(q, startAt);

  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.001);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec);

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source.start(startAt);
  source.stop(startAt + durationSec + 0.012);
}

/** Wooden drumstick knock — dry "딱" / "tok". */
function scheduleWoodStickHit(audioContext, startAt, { direction = 'up', intensity = 1 } = {}) {
  const isUp = direction === 'up';
  const scale = intensity;
  const pitch = isUp ? 1 : 0.92;

  scheduleWoodKnock(audioContext, startAt, {
    durationSec: 0.016,
    volume: 0.46 * scale,
    frequency: 920 * pitch,
    q: 2.2,
    curvePower: 4.8,
  });

  scheduleWoodKnock(audioContext, startAt + 0.001, {
    durationSec: 0.022,
    volume: 0.32 * scale,
    frequency: 580 * pitch,
    q: 1.05,
    curvePower: 3.8,
  });

  scheduleWoodKnock(audioContext, startAt + 0.0005, {
    durationSec: 0.009,
    volume: 0.24 * scale,
    frequency: 1680 * pitch,
    q: 2.4,
    curvePower: 5.5,
  });

  scheduleWoodKnock(audioContext, startAt + 0.0055, {
    durationSec: 0.008,
    volume: 0.14 * scale,
    frequency: 1240 * pitch,
    q: 1.8,
    curvePower: 6,
  });
}

function playMechanicalClick({ direction = 'up', bulk = false } = {}) {
  const audioContext = getAudioContext();
  if (!audioContext) {
    return Promise.resolve();
  }

  return ensureAudioContextRunning(audioContext)
    .then(() => {
      const startAt = audioContext.currentTime + 0.002;

      if (bulk) {
        const tickCount = 3;
        const gapSec = 0.036;

        for (let i = 0; i < tickCount; i += 1) {
          scheduleWoodStickHit(audioContext, startAt + i * gapSec, {
            direction,
            intensity: 1 - i * 0.06,
          });
        }
        return;
      }

      scheduleWoodStickHit(audioContext, startAt, { direction, intensity: 1 });
    })
    .catch(() => {});
}

/** Wood stick click for +1 / -1. */
export function playAnalogCounterClick(direction = 'up') {
  return playMechanicalClick({ direction, bulk: false });
}

/** Triple wood knock for ±10. */
export function playAnalogCounterBulkClick(direction = 'up') {
  return playMechanicalClick({ direction, bulk: true });
}
