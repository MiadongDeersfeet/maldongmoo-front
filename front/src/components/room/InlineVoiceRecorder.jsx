import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Pause, Play, Send, X } from 'lucide-react';
import { playRecordingStartSound, playRecordingStopSound } from '@/utils/recordingFeedbackSound.js';
import { createVoiceUploadFile, MAX_VOICE_UPLOAD_BYTES } from '@/utils/voiceFile.js';
import './InlineCheckInPanel.css';
import './InlineVoiceRecorder.css';

const WAVE_BARS = Array.from({ length: 28 }, (_, i) => i);
const WAVE_BAR_COUNT = WAVE_BARS.length;
const IDLE_BAR_LEVEL = 0.22;

const MAX_RECORD_SECONDS = 600;

function createIdleBarLevels() {
  return Array.from({ length: WAVE_BAR_COUNT }, () => IDLE_BAR_LEVEL);
}

function measureBarLevels(analyser) {
  const bins = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(bins);

  let sum = 0;
  for (let i = 0; i < bins.length; i += 1) {
    sum += bins[i];
  }
  const averageLevel = bins.length > 0 ? sum / bins.length / 255 : 0;

  return WAVE_BARS.map((_, index) => {
    const binIndex = Math.min(
      bins.length - 1,
      Math.floor((index / WAVE_BAR_COUNT) * bins.length * 0.72),
    );
    const bandLevel = bins[binIndex] / 255;
    const combined = averageLevel * 0.5 + bandLevel * 0.5;
    const normalized = Math.min(combined * 1.65, 1);
    return IDLE_BAR_LEVEL + normalized * (0.95 - IDLE_BAR_LEVEL);
  });
}

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
  const [isRecording, setIsRecording] = useState(false);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [hasReachedMaxDuration, setHasReachedMaxDuration] = useState(false);
  const [barLevels, setBarLevels] = useState(createIdleBarLevels);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeTypeRef = useRef('');
  const hasReachedMaxDurationRef = useRef(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const levelAnimationRef = useRef(null);

  const closeAudioAnalysis = useCallback(() => {
    if (levelAnimationRef.current) {
      cancelAnimationFrame(levelAnimationRef.current);
      levelAnimationRef.current = null;
    }

    analyserRef.current = null;

    const audioContext = audioContextRef.current;
    audioContextRef.current = null;

    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch(() => {});
    }
  }, []);

  const stopStream = useCallback(() => {
    closeAudioAnalysis();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, [closeAudioAnalysis]);

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

  const handleMaxDurationReached = useCallback(() => {
    if (hasReachedMaxDurationRef.current) {
      return;
    }

    hasReachedMaxDurationRef.current = true;
    setHasReachedMaxDuration(true);

    const recorder = mediaRecorderRef.current;
    if (recorder?.state === 'recording') {
      try {
        recorder.pause();
      } catch {
        // ignore
      }
    }

    setIsPaused(true);
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (
      isRecording
      || isStartingRecording
      || isSubmitting
      || isFinalizing
      || errorMessage
      || typeof MediaRecorder === 'undefined'
      || !navigator.mediaDevices?.getUserMedia
    ) {
      return;
    }

    setIsStartingRecording(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

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

      await playRecordingStartSound();

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPaused(false);
    } catch {
      stopRecorder();
      stopStream();
      setErrorMessage('마이크 권한이 필요해요.');
    } finally {
      setIsStartingRecording(false);
    }
  }, [
    isRecording,
    isStartingRecording,
    isSubmitting,
    isFinalizing,
    errorMessage,
    stopRecorder,
    stopStream,
  ]);

  useEffect(() => {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('이 브라우저에서는 음성 인증을 사용할 수 없어요.');
    }

    return () => {
      stopRecorder();
      stopStream();
    };
  }, [stopRecorder, stopStream]);

  useEffect(() => {
    const isWaveformFrozen =
      !isRecording
      || Boolean(errorMessage)
      || isSubmitting
      || isFinalizing
      || isPaused
      || hasReachedMaxDuration;

    if (isWaveformFrozen || !analyserRef.current) {
      setBarLevels(createIdleBarLevels());
      return undefined;
    }

    const analyser = analyserRef.current;

    const tick = () => {
      setBarLevels(measureBarLevels(analyser));
      levelAnimationRef.current = requestAnimationFrame(tick);
    };

    levelAnimationRef.current = requestAnimationFrame(tick);

    return () => {
      if (levelAnimationRef.current) {
        cancelAnimationFrame(levelAnimationRef.current);
        levelAnimationRef.current = null;
      }
    };
  }, [
    isRecording,
    errorMessage,
    isSubmitting,
    isFinalizing,
    isPaused,
    hasReachedMaxDuration,
  ]);

  useEffect(() => {
    if (isPaused || isSubmitting || isFinalizing || !isRecording || errorMessage) {
      return undefined;
    }
    if (seconds >= MAX_RECORD_SECONDS) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setSeconds((prev) => {
        if (prev >= MAX_RECORD_SECONDS) {
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isPaused, isSubmitting, isFinalizing, isRecording, errorMessage, seconds]);

  useEffect(() => {
    if (seconds < MAX_RECORD_SECONDS) {
      return undefined;
    }

    handleMaxDurationReached();
    return undefined;
  }, [seconds, handleMaxDurationReached]);

  const statusLabel = errorMessage
    ? errorMessage
    : isSubmitting
      ? '전송 중…'
      : isFinalizing
        ? '녹음 저장 중…'
        : isStartingRecording
          ? '마이크 준비 중…'
          : !isRecording
            ? '녹음 준비'
            : hasReachedMaxDuration
              ? '최대 10분까지 녹음할 수 있어요'
              : isPaused
                ? '일시정지'
                : '녹음 중';

  const handleRecordButtonClick = () => {
    if (!isRecording) {
      handleStartRecording();
      return;
    }

    handlePauseToggle();
  };

  const handlePauseToggle = () => {
    if (hasReachedMaxDuration) {
      return;
    }

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
        recorder.onstop = async () => {
          const sourceMimeType = mimeTypeRef.current || recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(chunksRef.current, { type: sourceMimeType });

          if (audioBlob.size === 0) {
            reject(new Error('empty recording'));
            return;
          }

          if (audioBlob.size > MAX_VOICE_UPLOAD_BYTES) {
            reject(new Error('file too large'));
            return;
          }

          stopStream();
          await playRecordingStopSound();
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

      onComplete(audioFile);
    } catch (error) {
      if (error instanceof Error && error.message === 'file too large') {
        setErrorMessage('녹음 파일이 너무 커요. 더 짧게 녹음해 주세요.');
      } else {
        setErrorMessage('녹음 파일을 만들지 못했어요.');
      }
      setIsFinalizing(false);
    }
  };

  const isBusy = isSubmitting || isFinalizing || isStartingRecording;

  return (
    <div className="inline-check-in-panel inline-voice-recorder" role="region" aria-label="녹음 인증">
      <div className="inline-check-in-panel__handle" aria-hidden="true" />

      <div className="inline-voice-recorder__top">
        <div className="inline-voice-recorder__status">
          {isRecording && !errorMessage && (
            <span className="inline-voice-recorder__recording-dot" aria-hidden="true" />
          )}
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
          className={`inline-voice-recorder__waveform ${!isRecording || isPaused || isBusy || errorMessage ? 'inline-voice-recorder__waveform--paused' : ''}`}
          aria-hidden="true"
        >
          {WAVE_BARS.map((bar) => (
            <span
              key={bar}
              className="inline-voice-recorder__bar"
              style={{ height: `${barLevels[bar] * 100}%` }}
            />
          ))}
        </div>
        <button
          type="button"
          className={`inline-voice-recorder__pause-btn ${!isRecording ? 'inline-voice-recorder__pause-btn--start' : ''}`}
          onClick={handleRecordButtonClick}
          disabled={isBusy || Boolean(errorMessage) || hasReachedMaxDuration}
          aria-label={
            !isRecording
              ? '녹음 시작'
              : isPaused
                ? '녹음 재개'
                : '녹음 일시정지'
          }
        >
          {!isRecording ? (
            <Mic size={20} strokeWidth={2.25} />
          ) : isPaused ? (
            <Play size={20} strokeWidth={2.25} />
          ) : (
            <Pause size={20} strokeWidth={2.25} />
          )}
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
          disabled={isBusy || seconds === 0 || Boolean(errorMessage) || !isRecording}
        >
          {isBusy ? '전송 중…' : '완료하기'}
          {!isBusy && <Send size={16} strokeWidth={2.25} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
