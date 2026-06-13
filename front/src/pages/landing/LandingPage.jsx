import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  function handleKakaoStart() {
    navigate('/login');
  }

  return (
    <div className="landing-page">
      <div className="landing-image-wrapper">
        <img
          src="/images/landing-reference.png"
          alt="말동무 — 함께 말씀을 암송하고, 매일 인증하며, 서로 아멘으로 격려하는 암송방"
          className="landing-reference-image"
        />
        <button
          type="button"
          className="landing-kakao-overlay-button"
          aria-label="카카오로 시작하기"
          title="카카오로 시작하기"
          onClick={handleKakaoStart}
        />
      </div>
    </div>
  );
}
