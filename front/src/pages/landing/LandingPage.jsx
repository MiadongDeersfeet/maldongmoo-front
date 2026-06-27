import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAsTestAccount, redirectToKakaoLogin } from '@/api/authApi.js';
import { useAuth } from '@/hooks/useAuth.js';
import { isLocalDevEnvironment } from '@/utils/env.js';
import './LandingPage.css';

function KakaoIcon() {
  return (
    <svg className="landing-page__kakao-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.87 5.34 4.68 6.84-.15.55-.54 2-.62 2.32 0 0-.01.08.05.12.07.04.15.03.22-.01.97-.67 3.82-2.52 4.42-2.95.72.1 1.46.16 2.25.16 5.52 0 10-3.58 10-8.08S17.52 3 12 3z"
        fill="currentColor"
      />
    </svg>
  );
}

const TEST_ACCOUNTS = [
  { key: 'a', label: '테스트 A (방장)' },
  { key: 'b', label: '테스트 B (멤버)' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { authError, refreshSession } = useAuth();
  const [testLoginError, setTestLoginError] = useState(null);
  const [pendingAccountKey, setPendingAccountKey] = useState(null);
  const showTestLogin = isLocalDevEnvironment();

  const handleKakaoStart = () => {
    redirectToKakaoLogin();
  };

  const handleTestLogin = async (accountKey) => {
    setTestLoginError(null);
    setPendingAccountKey(accountKey);

    try {
      await loginAsTestAccount(accountKey);
      await refreshSession();
      navigate('/home', { replace: true });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : '테스트 계정 로그인에 실패했습니다.';
      setTestLoginError(message);
    } finally {
      setPendingAccountKey(null);
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-page__ambient" aria-hidden="true">
        <span className="landing-page__glow landing-page__glow--sage" />
        <span className="landing-page__glow landing-page__glow--coral" />
        <span className="landing-page__glow landing-page__glow--gold" />
      </div>

      <div className="landing-page__shell">
        <div className="landing-page__hero">
          <div className="landing-page__icon-wrap">
            <img
              className="landing-page__icon"
              src="/icons/icon-192.png"
              srcSet="/icons/icon-192.png 1x, /icons/icon-512.png 2x"
              width={120}
              height={120}
              alt=""
            />
          </div>

          <h1 className="landing-page__title">말동무</h1>
          <p className="landing-page__eyebrow">말씀과 동행하는 무리들</p>
          <blockquote className="landing-page__scripture">
            <p className="landing-page__scripture-text">
              오직 여호와의 율법을 즐거워하여
              <br />
              그의 율법을 주야로 묵상하는도다
            </p>
          </blockquote>
        </div>

        <div className="landing-page__footer">
          {showTestLogin && (
            <div className="landing-page__test-panel">
              <p className="landing-page__test-title">로컬 테스트 계정</p>
              <p className="landing-page__test-desc">
                2계정 채팅 테스트: 일반 창에서 A, 시크릿 창에서 B로 접속하세요.
              </p>
              <div className="landing-page__test-buttons">
                {TEST_ACCOUNTS.map((account) => (
                  <button
                    key={account.key}
                    type="button"
                    className="landing-page__test-btn"
                    disabled={pendingAccountKey !== null}
                    onClick={() => handleTestLogin(account.key)}
                  >
                    {pendingAccountKey === account.key ? '접속 중...' : account.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="button" className="landing-page__kakao-btn" onClick={handleKakaoStart}>
            <KakaoIcon />
            카카오로 시작하기
          </button>

          {(authError || testLoginError) && (
            <p className="landing-page__error" role="alert">
              {testLoginError ?? authError}
            </p>
          )}

          <p className="landing-page__legal">
            {showTestLogin
              ? '테스트 계정은 localhost + local API에서만 사용할 수 있습니다.'
              : '로그인 시 서비스 이용약관 및 개인정보 처리방침에 동의한 것으로 간주합니다.'}
          </p>
        </div>
      </div>
    </div>
  );
}
