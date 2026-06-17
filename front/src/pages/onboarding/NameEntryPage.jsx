import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.js';
import './NameEntryPage.css';

export default function NameEntryPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !isSubmitting;

  const handleBack = () => {
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    setIsSubmitting(true);
    try {
      await login({
        kakaoId: `kakao_onboarding_${Date.now()}`,
        name: trimmedName,
        profileImg: null,
      });
      navigate('/home', { replace: true });
    } catch {
      setError('로그인에 실패했습니다. 다시 시도해 주세요.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="name-entry-page">
      <div className="name-entry-page__shell">
        <header className="name-entry-page__header">
          <button
            type="button"
            className="name-entry-page__back"
            onClick={handleBack}
            aria-label="뒤로 가기"
          >
            <ArrowLeft size={24} strokeWidth={2} />
          </button>
        </header>

        <main className="name-entry-page__main">
          <div className="name-entry-page__avatar-wrap" aria-hidden="true">
            <div className="name-entry-page__avatar">
              <User size={40} strokeWidth={1.75} />
            </div>
            <span className="name-entry-page__avatar-badge">
              <Pencil size={12} strokeWidth={2.5} />
            </span>
          </div>

          <h1 className="name-entry-page__title">이름을 입력해주세요</h1>
          <p className="name-entry-page__desc">말동무에서 사용할 이름을 알려주세요.</p>

          <form className="name-entry-page__form" onSubmit={handleSubmit}>
            <input
              id="onboarding-name"
              type="text"
              className="name-entry-page__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름 입력"
              maxLength={20}
              autoComplete="name"
              autoFocus
              aria-label="이름 입력"
            />

            <button
              type="submit"
              className={`name-entry-page__submit ${canSubmit ? 'name-entry-page__submit--active' : ''}`}
              disabled={!canSubmit}
            >
              다음
            </button>
          </form>

          {error && (
            <p className="name-entry-page__error" role="alert">
              {error}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
