import { useEffect, useState } from 'react';
import { Pause, Play, Send, X } from 'lucide-react';
import './InlineCheckInPanel.css';
import './InlineVoiceRecorder.css';

const WAVE_BARS = Array.from({ length: 28 }, (_, i) => i);

const MAX_RECORD_SECONDS = 120;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function InlineVoiceRecorder({ onCancel, onComplete, isSubmitting = false }) {
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (isPaused || isSubmitting) return undefined;
    const timerId = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [isPaused, isSubmitting]);

  const statusLabel = isSubmitting ? '전송 중…' : isPaused ? '일시정지' : '녹음 중';

  const handleComplete = () => {
    if (isSubmitting || seconds === 0) return;
    onComplete();
  };

  return (
    <div className="inline-check-in-panel inline-voice-recorder" role="region" aria-label="녹음 인증">
      <div className="inline-check-in-panel__handle" aria-hidden="true" />

      <div className="inline-voice-recorder__top">
        <div className="inline-voice-recorder__status">
          <span className="inline-voice-recorder__recording-dot" aria-hidden="true" />
          <span className="inline-voice-recorder__status-text">{statusLabel}</span>
          <span className="inline-voice-recorder__timer">
            {formatTime(seconds)} / {formatTime(MAX_RECORD_SECONDS)}
          </span>
        </div>
        <button
          type="button"
          className="inline-check-in-panel__close"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="닫기"
        >
          <X size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="inline-voice-recorder__wave-row">
        <div
          className={`inline-voice-recorder__waveform ${isPaused || isSubmitting ? 'inline-voice-recorder__waveform--paused' : ''}`}
          aria-hidden="true"
        >
          {WAVE_BARS.map((bar) => (
            <span
              key={bar}
              className="inline-voice-recorder__bar"
              style={{ '--bar-delay': `${(bar % 7) * 0.08}s` }}
            />
          ))}
        </div>
        <button
          type="button"
          className="inline-voice-recorder__pause-btn"
          onClick={() => setIsPaused((prev) => !prev)}
          disabled={isSubmitting}
          aria-label={isPaused ? '녹음 재개' : '녹음 일시정지'}
        >
          {isPaused ? <Play size={20} strokeWidth={2.25} /> : <Pause size={20} strokeWidth={2.25} />}
        </button>
      </div>

      <div className="inline-check-in-panel__actions">
        <button
          type="button"
          className="inline-check-in-panel__btn inline-check-in-panel__btn--secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          취소
        </button>
        <button
          type="button"
          className="inline-check-in-panel__btn inline-check-in-panel__btn--primary"
          onClick={handleComplete}
          disabled={isSubmitting || seconds === 0}
        >
          {isSubmitting ? '전송 중…' : '완료하기'}
          {!isSubmitting && <Send size={16} strokeWidth={2.25} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
