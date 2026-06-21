import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play, Send, X } from 'lucide-react';
import { createVoiceUploadFile } from '@/utils/voiceFile.js';
import './InlineCheckInPanel.css';
import './InlineVoiceRecorder.css';

const WAVE_BARS = Array.from({ length: 28 }, (_, i) => i);

const MAX_RECORD_SECONDS = 120;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getSupportedMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

export default function InlineVoiceRecorder({ onCancel, onComplete, isSubmitting = false }) {
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isRecorderReady, setIsRecorderReady] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeTypeRef = useRef('');

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopRecorder = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('이 브라우저에서는 음성 인증을 사용할 수 없어요.');
      return undefined;
    }

    let ignore = false;

    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (ignore) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        chunksRef.current = [];

        const mimeType = getSupportedMimeType();
        mimeTypeRef.current = mimeType;
        const recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.start(250);
        mediaRecorderRef.current = recorder;
        setIsRecorderReady(true);
      } catch {
        if (!ignore) {
          setErrorMessage('마이크 권한이 필요해요.');
        }
      }
    }

    startRecording();

    return () => {
      ignore = true;
      stopRecorder();
      stopStream();
    };
  }, [stopRecorder, stopStream]);

  useEffect(() => {
    if (isPaused || isSubmitting || isFinalizing || !isRecorderReady || errorMessage) {
      return undefined;
    }
    if (seconds >= MAX_RECORD_SECONDS) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setSeconds((prev) => (prev >= MAX_RECORD_SECONDS ? prev : prev + 1));
    }, 1000);

    return () => clearInterval(timerId);
  }, [isPaused, isSubmitting, isFinalizing, isRecorderReady, errorMessage, seconds]);

  const statusLabel = errorMessage
    ? errorMessage
    : isSubmitting
      ? '전송 중…'
      : isFinalizing
        ? '녹음 저장 중…'
        : isPaused
          ? '일시정지'
          : '녹음 중';

  const handlePauseToggle = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || errorMessage) return;

    try {
      if (isPaused) {
        if (recorder.state === 'paused') {
          recorder.resume();
        }
        setIsPaused(false);
      } else if (recorder.state === 'recording') {
        recorder.pause();
        setIsPaused(true);
      } else {
        setIsPaused((prev) => !prev);
      }
    } catch {
      setIsPaused((prev) => !prev);
    }
  };

  const handleCancel = () => {
    stopRecorder();
    stopStream();
    onCancel();
  };

  const handleComplete = async () => {
    if (isSubmitting || isFinalizing || seconds === 0 || errorMessage || !mediaRecorderRef.current) {
      return;
    }

    setIsFinalizing(true);

    const recorder = mediaRecorderRef.current;

    try {
      const audioFile = await new Promise((resolve, reject) => {
        recorder.onstop = () => {
          const sourceMimeType = mimeTypeRef.current || recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(chunksRef.current, { type: sourceMimeType });

          if (audioBlob.size === 0) {
            reject(new Error('empty recording'));
            return;
          }

          resolve(createVoiceUploadFile(audioBlob, sourceMimeType));
        };

        recorder.onerror = () => {
          reject(new Error('recorder error'));
        };

        if (recorder.state === 'recording' || recorder.state === 'paused') {
          if (typeof recorder.requestData === 'function') {
            recorder.requestData();
          }
          recorder.stop();
        } else {
          reject(new Error('recorder inactive'));
        }
      });

      stopStream();
      onComplete(audioFile);
    } catch {
      setErrorMessage('녹음 파일을 만들지 못했어요.');
      setIsFinalizing(false);
    }
  };

  const isBusy = isSubmitting || isFinalizing;

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
          onClick={handleCancel}
          disabled={isBusy}
          aria-label="닫기"
        >
          <X size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="inline-voice-recorder__wave-row">
        <div
          className={`inline-voice-recorder__waveform ${isPaused || isBusy || errorMessage ? 'inline-voice-recorder__waveform--paused' : ''}`}
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
          onClick={handlePauseToggle}
          disabled={isBusy || Boolean(errorMessage) || !isRecorderReady}
          aria-label={isPaused ? '녹음 재개' : '녹음 일시정지'}
        >
          {isPaused ? <Play size={20} strokeWidth={2.25} /> : <Pause size={20} strokeWidth={2.25} />}
        </button>
      </div>

      <div className="inline-check-in-panel__actions">
        <button
          type="button"
          className="inline-check-in-panel__btn inline-check-in-panel__btn--secondary"
          onClick={handleCancel}
          disabled={isBusy}
        >
          취소
        </button>
        <button
          type="button"
          className="inline-check-in-panel__btn inline-check-in-panel__btn--primary"
          onClick={handleComplete}
          disabled={isBusy || seconds === 0 || Boolean(errorMessage) || !isRecorderReady}
        >
          {isBusy ? '전송 중…' : '완료하기'}
          {!isBusy && <Send size={16} strokeWidth={2.25} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
