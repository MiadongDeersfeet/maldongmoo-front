import './HomeHeader.css';

export default function HomeHeader({ onLogout }) {
  return (
    <header className="home-header">
      <span className="home-header__brand">말동무</span>
      <button type="button" className="home-header__logout" onClick={onLogout}>
        로그아웃
      </button>
    </header>
  );
}
