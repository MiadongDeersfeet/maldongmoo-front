import { redirectToKakaoLogin } from '@/api/authApi.js';
import AppShell from '@/components/layout/AppShell.jsx';
import PageContainer from '@/components/layout/PageContainer.jsx';
import { useAuth } from '@/hooks/useAuth.js';
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

export default function LoginPage() {
  const { authError } = useAuth();

  const handleKakaoLogin = () => {
    redirectToKakaoLogin();
  };

  return (
    <AppShell title="로그인">
      <PageContainer>
        <div className="login-page">
          <p className="login-page__intro">
            카카오 계정으로 로그인하고 말동무 암송방에 참여해 보세요.
          </p>

          <button
            type="button"
            className="login-page__kakao-btn"
            onClick={handleKakaoLogin}
          >
            <KakaoIcon />
            카카오로 시작하기
          </button>

          {authError && (
            <p className="login-page__error" role="alert">
              {authError}
            </p>
          )}

          <p className="login-page__notice">
            로그인 후 세션 쿠키로 인증 상태가 유지됩니다.
          </p>
        </div>
      </PageContainer>
    </AppShell>
  );
}
