import { redirectToKakaoLogin } from '@/api/authApi.js';
import './KakaoLoginButton.css';

function KakaoIcon() {
  return (
    <svg
      className="kakao-login-button__icon"
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

export default function KakaoLoginButton() {
  return (
    <button
      type="button"
      className="kakao-login-button"
      onClick={() => redirectToKakaoLogin()}
    >
      <KakaoIcon />
      카카오로 시작하기
    </button>
  );
}
