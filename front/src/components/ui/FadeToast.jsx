import { useEffect, useState } from 'react';
import './FadeToast.css';

const DEFAULT_DURATION_MS = 2200;
const FADE_OUT_MS = 420;

export default function FadeToast({
  message,
  duration = DEFAULT_DURATION_MS,
  onDone,
  nowrap = false,
}) {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeStartDelay = Math.max(duration - FADE_OUT_MS, 0);
    const fadeTimer = window.setTimeout(() => setIsFading(true), fadeStartDelay);
    const doneTimer = window.setTimeout(() => onDone?.(), duration);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [duration, message, onDone]);

  return (
    <div
      className={`fade-toast ${nowrap ? 'fade-toast--nowrap' : ''} ${isFading ? 'fade-toast--out' : 'fade-toast--in'}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
