import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAsTestAccount, redirectToKakaoLogin } from '@/api/authApi.js';
import { useAuth } from '@/hooks/useAuth.js';
import { isLocalDevEnvironment } from '@/utils/env.js';
import AppShell from '@/components/layout/AppShell.jsx';
import PageContainer from '@/components/layout/PageContainer.jsx';
import './LoginPage.css';

function KakaoIcon() {
  return (
    <svg
      className="login-page__kakao-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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

export default function LoginPage() {
  const navigate = useNavigate();
  const { authError, refreshSession } = useAuth();
  const [testLoginError, setTestLoginError] = useState(null);
  const [pendingAccountKey, setPendingAccountKey] = useState(null);
  const showTestLogin = isLocalDevEnvironment();

  const handleKakaoLogin = () => {
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
    <AppShell title="로그인">
      <PageContainer>
        <div className="login-page">
          <p className="login-page__intro">
            카카오 계정으로 로그인하고 말동무 암송방에 참여해 보세요.
          </p>

          {showTestLogin && (
            <>
              <div className="login-page__test-panel">
                <p className="login-page__test-title">로컬 테스트 계정</p>
                <p className="login-page__test-desc">
                  2계정 채팅 테스트: 일반 창에서 A, 시크릿 창에서 B로 접속하세요.
                </p>
                <div className="login-page__test-buttons">
                  {TEST_ACCOUNTS.map((account) => (
                    <button
                      key={account.key}
                      type="button"
                      className="login-page__test-btn"
                      disabled={pendingAccountKey !== null}
                      onClick={() => handleTestLogin(account.key)}
                    >
                      {pendingAccountKey === account.key ? '접속 중...' : account.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="login-page__divider">또는</div>
            </>
          )}

          <button
            type="button"
            className="login-page__kakao-btn"
            onClick={handleKakaoLogin}
          >
            <KakaoIcon />
            카카오로 시작하기
          </button>

          {(authError || testLoginError) && (
            <p className="login-page__error" role="alert">
              {testLoginError ?? authError}
            </p>
          )}

          <p className="login-page__notice">
            {showTestLogin
              ? '테스트 계정은 localhost + local API에서만 사용할 수 있습니다.'
              : '카카오 프로필 이름으로 가입·로그인됩니다. 로그인 후 세션 쿠키로 인증 상태가 유지됩니다.'}
          </p>
        </div>
      </PageContainer>
    </AppShell>
  );
}
