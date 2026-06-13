import { BookOpen, ChevronUp, Pencil } from 'lucide-react';
import RecitationText from './RecitationText.jsx';
import { PASSAGE_LABEL } from '@/utils/recitationText.js';
import './RecitationCardExpanded.css';

export default function RecitationCardExpanded({
  section,
  isLeader,
  onCollapse,
  onOpenFullscreen,
  onRegister,
}) {
  if (!section) {
    return (
      <section className="recitation-expanded recitation-expanded--empty">
        <div className="recitation-expanded__empty-icon" aria-hidden="true">
          <BookOpen size={28} strokeWidth={1.75} />
        </div>
        <p className="recitation-expanded__empty-title">아직 등록된 암송 본문이 없어요</p>
        {isLeader ? (
          <>
            <p className="recitation-expanded__empty-desc">함께 암송할 본문을 등록해 주세요.</p>
            <button type="button" className="recitation-expanded__btn-primary" onClick={onRegister}>
              암송 본문 등록
            </button>
          </>
        ) : (
          <p className="recitation-expanded__empty-desc">
            방장이 본문을 등록하면 함께 암송할 수 있어요.
          </p>
        )}
        <button
          type="button"
          className="recitation-expanded__collapse-btn"
          onClick={onCollapse}
          aria-label="이번주 본문 접기"
        >
          <ChevronUp size={18} strokeWidth={2} />
          접기
        </button>
      </section>
    );
  }

  return (
    <section className="recitation-expanded" aria-label={PASSAGE_LABEL}>
      <header className="recitation-expanded__header">
        <div className="recitation-expanded__title-block">
          <div className="recitation-expanded__title-row">
            <h2 className="recitation-expanded__title">{PASSAGE_LABEL}</h2>
            {isLeader && onRegister && (
              <button
                type="button"
                className="recitation-expanded__edit-btn"
                onClick={onRegister}
                aria-label="이번주 본문 수정"
              >
                <Pencil size={15} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          className="recitation-expanded__collapse-icon"
          onClick={onCollapse}
          aria-label="이번주 본문 접기"
        >
          <ChevronUp size={20} strokeWidth={2} />
        </button>
      </header>

      <div className="recitation-expanded__body">
        <RecitationText text={section.recitationText} />
      </div>

      <footer className="recitation-expanded__footer">
        <button
          type="button"
          className="recitation-expanded__btn-primary"
          onClick={onOpenFullscreen}
        >
          전체 보기
        </button>
      </footer>
    </section>
  );
}
