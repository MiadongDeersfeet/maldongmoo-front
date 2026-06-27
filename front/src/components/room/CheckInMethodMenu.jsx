import { useEffect, useCallback } from 'react';
import { BarChart3, BookOpen, Hash, Mic, Share2, Users, X } from 'lucide-react';
import './CheckInMethodMenu.css';

function playCheckInOpenSound() {
  // const audio = new Audio('/sounds/check-in-open.mp3');
  // audio.play().catch(() => {});
}

const SIDE_ACTIONS_LEFT = [
  { id: 'section', label: '본문', icon: BookOpen },
  { id: 'members', label: '멤버', icon: Users },
];

const SIDE_ACTIONS_RIGHT = [
  { id: 'stats', label: '기록', icon: BarChart3 },
  { id: 'share', label: '초대', icon: Share2 },
];

function getFabLabel(isOpen, hasCheckedInToday) {
  if (isOpen) return '닫기';
  if (hasCheckedInToday) return '추가 인증';
  return '인증';
}

export default function CheckInMethodMenu({
  isOpen,
  onToggle,
  onSelectVoice,
  onSelectCounter,
  onSectionClick,
  onMembersClick,
  onStatsClick,
  onShareClick,
  showShare = false,
  hasCheckedInToday = false,
  isSectionActive = false,
  isMembersActive = false,
}) {
  const close = useCallback(() => {
    if (isOpen) onToggle();
  }, [isOpen, onToggle]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  const handleMainClick = () => {
    playCheckInOpenSound();
    onToggle();
  };

  const handleSelectVoice = () => {
    playCheckInOpenSound();
    onSelectVoice();
  };

  const handleSelectCounter = () => {
    playCheckInOpenSound();
    onSelectCounter();
  };

  const handleSideAction = (actionId) => {
    if (actionId === 'section' && onSectionClick) {
      onSectionClick();
      return;
    }
    if (actionId === 'members' && onMembersClick) {
      onMembersClick();
      return;
    }
    if (actionId === 'stats' && onStatsClick) {
      onStatsClick();
      return;
    }
    if (actionId === 'share' && onShareClick) {
      onShareClick();
    }
  };

  const fabLabel = getFabLabel(isOpen, hasCheckedInToday);

  return (
    <div className={`check-in-footer-layer ${isOpen ? 'check-in-footer-layer--open' : ''}`}>
      {isOpen && (
        <button
          type="button"
          className="check-in-footer-layer__backdrop"
          aria-label="인증 메뉴 닫기"
          onClick={close}
        />
      )}

      <div className={`check-in-footer-layer__menu ${isOpen ? 'check-in-footer-layer__menu--open' : ''}`}>
        <button
          type="button"
          className="check-in-footer-layer__option check-in-footer-layer__option--voice"
          onClick={handleSelectVoice}
          aria-label="녹음 인증"
        >
          <span className="check-in-footer-layer__option-circle">
            <Mic size={22} strokeWidth={2} />
          </span>
          <span className="check-in-footer-layer__option-label">녹음</span>
        </button>
        <button
          type="button"
          className="check-in-footer-layer__option check-in-footer-layer__option--counter"
          onClick={handleSelectCounter}
          aria-label="계수기 인증"
        >
          <span className="check-in-footer-layer__option-circle">
            <Hash size={22} strokeWidth={2} />
          </span>
          <span className="check-in-footer-layer__option-label">계수기</span>
        </button>
      </div>

      <footer className="footer-action-bar" aria-label="인증">
        <div className="footer-action-bar__side footer-action-bar__side--left">
          {SIDE_ACTIONS_LEFT.map((action) => {
            const Icon = action.icon;
            const isActive =
              (action.id === 'section' && isSectionActive)
              || (action.id === 'members' && isMembersActive);
            return (
              <button
                key={action.id}
                type="button"
                className={`footer-action-bar__action ${isActive ? 'footer-action-bar__action--active' : ''}`}
                onClick={() => handleSideAction(action.id)}
                aria-label={action.label}
                aria-current={isActive ? 'true' : undefined}
              >
                <Icon size={20} strokeWidth={2} aria-hidden="true" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={`footer-action-bar__fab ${isOpen ? 'footer-action-bar__fab--open' : ''}`}
          onClick={handleMainClick}
          aria-expanded={isOpen}
          aria-label={fabLabel}
        >
          {isOpen ? (
            <X size={22} strokeWidth={2.25} />
          ) : (
            <Mic size={22} strokeWidth={2.25} />
          )}
          <span className="footer-action-bar__fab-label">{fabLabel}</span>
        </button>

        <div className="footer-action-bar__side footer-action-bar__side--right">
          {SIDE_ACTIONS_RIGHT.map((action) => {
            const Icon = action.icon;
            const isShare = action.id === 'share';
            const disabled = isShare && !showShare;
            return (
              <button
                key={action.id}
                type="button"
                className="footer-action-bar__action"
                onClick={() => handleSideAction(action.id)}
                aria-label={action.label}
                disabled={disabled}
              >
                <Icon size={20} strokeWidth={2} aria-hidden="true" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
