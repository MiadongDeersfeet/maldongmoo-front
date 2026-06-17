import { useNavigate } from 'react-router-dom';
import LandingBrandIcon from '@/components/onboarding/LandingBrandIcon.jsx';
import LandingLeafDeco from '@/components/onboarding/LandingLeafDeco.jsx';
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

export default function LandingPage() {
  const navigate = useNavigate();

  const handleKakaoStart = () => {
    navigate('/onboarding/name');
  };

  const handleAltLogin = () => {
    navigate('/login');
  };

  return (
    <div className="landing-page">
      <div className="landing-page__shell">
        <LandingLeafDeco />

        <div className="landing-page__main">
          <LandingBrandIcon />
          <h1 className="landing-page__title">말동무</h1>
          <p className="landing-page__caption">
            오직 여호와의 토라를 즐거워하여
            <br />
            그의 토라를 밤낮으로 묵상하는도다
          </p>

          <div className="landing-page__actions">
            <button type="button" className="landing-page__kakao-btn" onClick={handleKakaoStart}>
              <KakaoIcon />
              카카오로 시작하기
            </button>
            <button type="button" className="landing-page__alt-btn" onClick={handleAltLogin}>
              다른 방법으로 로그인
            </button>
          </div>
        </div>

        <p className="landing-page__legal">
          로그인 시 서비스 이용약관 및 개인정보 처리방침에 동의한 것으로 간주합니다.
        </p>
      </div>
    </div>
  );
}
