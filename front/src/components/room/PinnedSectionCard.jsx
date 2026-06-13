import { BookOpen, Pin } from 'lucide-react';
import './PinnedSectionCard.css';

function truncateText(text, max = 72) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

export default function PinnedSectionCard({ section, isLeader, onRegister, variant = 'default' }) {
  const isSheet = variant === 'sheet';

  if (!section) {
    return (
      <section className={`pinned-section pinned-section--empty ${isSheet ? 'pinned-section--sheet' : ''}`}>
        <Pin className="pinned-section__pin" size={16} strokeWidth={2} aria-hidden="true" />
        <div className="pinned-section__empty-icon" aria-hidden="true">
          <BookOpen size={28} strokeWidth={1.75} />
        </div>
        <p className="pinned-section__empty-title">아직 등록된 암송 본문이 없어요</p>
        {isLeader ? (
          <>
            <p className="pinned-section__empty-desc">함께 암송할 본문을 등록해 주세요.</p>
            <button
              type="button"
              className="pinned-section__register-btn"
              onClick={onRegister}
            >
              암송 본문 등록
            </button>
          </>
        ) : (
          <p className="pinned-section__empty-desc">
            방장이 본문을 등록하면 함께 암송할 수 있어요.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className={`pinned-section ${isSheet ? 'pinned-section--sheet' : ''}`}>
      {!isSheet && (
        <Pin className="pinned-section__pin" size={16} strokeWidth={2} aria-hidden="true" />
      )}
      <p className="pinned-section__label">현재 암송 본문</p>
      <h2 className="pinned-section__title">{section.sectionTitle}</h2>
      {section.weeklyRange && (
        <p className="pinned-section__range">{section.weeklyRange}</p>
      )}
      <p className="pinned-section__text">{truncateText(section.recitationText)}</p>
      {isLeader && onRegister && (
        <button type="button" className="pinned-section__edit-btn" onClick={onRegister}>
          본문 수정
        </button>
      )}
    </section>
  );
}
