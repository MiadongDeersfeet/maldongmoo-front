import { Bell, BellOff, LogOut } from 'lucide-react';
import './HomeHeader.css';

export default function HomeHeader({
  onLogout,
  pushToggle,
}) {
  const notifyLabel = pushToggle?.paused ? '알림 켜기' : '알림 끄기';

  return (
    <header className="home-header">
      <span className="home-header__brand">말동무</span>
      <div className="home-header__actions">
        {pushToggle?.available && (
          <button
            type="button"
            className={`home-header__action home-header__notify${pushToggle.paused ? ' is-off' : ''}`}
            onClick={pushToggle.onToggle}
            disabled={pushToggle.loading}
            aria-pressed={!pushToggle.paused}
            aria-label={notifyLabel}
            title={notifyLabel}
          >
            {pushToggle.paused ? (
              <BellOff size={18} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Bell size={18} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        )}
        <button
          type="button"
          className="home-header__action home-header__logout"
          onClick={onLogout}
          aria-label="로그아웃"
          title="로그아웃"
        >
          <LogOut size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
