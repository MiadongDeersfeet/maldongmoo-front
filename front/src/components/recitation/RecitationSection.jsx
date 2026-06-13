import './RecitationSection.css';

export default function RecitationSection({ section, isLeader, onRegister }) {
  if (!section) {
    return (
      <section className="recitation-section recitation-section--empty">
        <p className="recitation-section__empty-title">
          아직 등록된 암송 본문이 없습니다.
        </p>
        {isLeader ? (
          <button
            type="button"
            className="recitation-section__register-btn"
            onClick={onRegister}
          >
            암송 본문 등록하기
          </button>
        ) : (
          <p className="recitation-section__empty-desc">
            방장이 암송 본문을 등록하면 함께 암송할 수 있어요.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="recitation-section">
      <h2 className="recitation-section__title">{section.sectionTitle}</h2>
      <p className="recitation-section__range">{section.weeklyRange}</p>
      <p className="recitation-section__text">{section.recitationText}</p>
      {isLeader && onRegister && (
        <button
          type="button"
          className="recitation-section__edit-btn"
          onClick={onRegister}
        >
          본문 수정하기
        </button>
      )}
    </section>
  );
}
