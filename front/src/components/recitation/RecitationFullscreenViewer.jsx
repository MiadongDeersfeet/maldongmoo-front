import { Pencil, X } from 'lucide-react';
import RecitationText from './RecitationText.jsx';
import { PASSAGE_LABEL } from '@/utils/recitationText.js';
import './RecitationFullscreenViewer.css';

export default function RecitationFullscreenViewer({
  section,
  isLeader,
  onClose,
  onRegister,
  isInlineActive = false,
}) {
  const panelClass = [
    'recitation-fullscreen-panel',
    isInlineActive ? 'recitation-fullscreen-panel--flush-bottom' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={panelClass}
      role="dialog"
      aria-modal="true"
      aria-label="이번주 본문 전체 보기"
    >
      <header className="recitation-fullscreen-panel__header">
        <button
          type="button"
          className="recitation-fullscreen-panel__icon-btn"
          onClick={onClose}
          aria-label="이번주 본문 닫기"
        >
          <X size={24} strokeWidth={2} />
        </button>
        <p className="recitation-fullscreen-panel__title">{PASSAGE_LABEL}</p>
        <div className="recitation-fullscreen-panel__header-end">
          {isLeader ? (
            <button
              type="button"
              className="recitation-fullscreen-panel__icon-btn"
              aria-label="이번주 본문 수정"
              onClick={onRegister}
            >
              <Pencil size={24} strokeWidth={2} />
            </button>
          ) : (
            <span className="recitation-fullscreen-panel__header-spacer" aria-hidden="true" />
          )}
        </div>
      </header>

      <div className="recitation-fullscreen-panel__body scrollbar-soft">
        {section ? (
          <article className="recitation-fullscreen-panel__article">
            <RecitationText text={section.recitationText} size="fullscreen" />
          </article>
        ) : (
          <div className="recitation-fullscreen-panel__empty">
            <p>아직 등록된 암송 본문이 없어요.</p>
            {isLeader && (
              <button
                type="button"
                className="recitation-fullscreen-panel__register"
                onClick={onRegister}
              >
                암송 본문 등록
              </button>
            )}
          </div>
        )}
      </div>

      <footer className="recitation-fullscreen-panel__footer">
        <button type="button" className="recitation-fullscreen-panel__close-btn" onClick={onClose}>
          닫기
        </button>
      </footer>
    </div>
  );
}
