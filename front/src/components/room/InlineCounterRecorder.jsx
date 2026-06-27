import { useState } from 'react';
import { Check, Minus, Plus, RotateCcw, X } from 'lucide-react';
import {
  playAnalogCounterBulkClick,
  playAnalogCounterClick,
} from '@/utils/counterClickSound.js';
import './InlineCheckInPanel.css';
import './InlineCounterRecorder.css';

const GOAL_COUNT = 100;

export default function InlineCounterRecorder({ onCancel, onComplete, isSubmitting = false }) {
  const [count, setCount] = useState(0);

  const handleDecrease = () => {
    setCount((prev) => {
      if (prev <= 0) {
        return prev;
      }
      playAnalogCounterClick('down');
      return prev - 1;
    });
  };

  const handleIncrease = () => {
    playAnalogCounterClick('up');
    setCount((prev) => prev + 1);
  };

  const handleStep = (delta) => {
    setCount((prev) => {
      const next = Math.max(0, prev + delta);
      if (next === prev) {
        return prev;
      }
      playAnalogCounterBulkClick(delta > 0 ? 'up' : 'down');
      return next;
    });
  };

  const handleReset = () => {
    setCount(0);
  };

  const handleComplete = () => {
    if (isSubmitting || count <= 0) return;
    onComplete(count);
  };

  return (
    <div className="inline-check-in-panel inline-counter-recorder" role="region" aria-label="계수기 인증">
      <div className="inline-check-in-panel__handle" aria-hidden="true" />

      <div className="inline-counter-recorder__header">
        <div className="inline-counter-recorder__title-row">
          <h2 className="inline-counter-recorder__title">계수기 진행 중</h2>
          <span className="inline-counter-recorder__goal">목표 {GOAL_COUNT}회</span>
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

      <div className="inline-counter-recorder__main">
        <button
          type="button"
          className="inline-counter-recorder__quick-btn"
          onClick={() => handleStep(-10)}
          disabled={isSubmitting || count < 10}
          aria-label="10회 줄이기"
        >
          -10
        </button>
        <button
          type="button"
          className="inline-counter-recorder__step-btn"
          onClick={handleDecrease}
          disabled={isSubmitting || count <= 0}
          aria-label="횟수 줄이기"
        >
          <Minus size={24} strokeWidth={2.25} />
        </button>
        <div className="inline-counter-recorder__value-wrap">
          <span className="inline-counter-recorder__value" aria-live="polite">
            {count}
          </span>
          <span className="inline-counter-recorder__unit">회</span>
        </div>
        <button
          type="button"
          className="inline-counter-recorder__step-btn"
          onClick={handleIncrease}
          disabled={isSubmitting}
          aria-label="횟수 늘리기"
        >
          <Plus size={24} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          className="inline-counter-recorder__quick-btn"
          onClick={() => handleStep(10)}
          disabled={isSubmitting}
          aria-label="10회 늘리기"
        >
          +10
        </button>
      </div>

      <button
        type="button"
        className="inline-counter-recorder__reset"
        onClick={handleReset}
        disabled={isSubmitting || count === 0}
      >
        <RotateCcw size={14} strokeWidth={2.25} aria-hidden="true" />
        초기화
      </button>

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
          disabled={isSubmitting || count <= 0}
        >
          {isSubmitting ? '전송 중…' : '완료하기'}
          {!isSubmitting && <Check size={16} strokeWidth={2.5} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
