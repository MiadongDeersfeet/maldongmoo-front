import { ArrowLeft, MoreVertical } from 'lucide-react';
import './RoomHeader.css';

function getSubtitle(todayCompletedCount, totalMemberCount) {
  if (totalMemberCount === 0) return '참여 멤버가 없습니다';
  return `오늘 ${todayCompletedCount}명 인증 · ${totalMemberCount}명 참여 중`;
}

export default function RoomHeader({
  roomName,
  memberCount,
  todayCompletedCount = 0,
  onBack,
  onMoreClick,
}) {
  return (
    <header className="room-header">
      <button type="button" className="room-header__back" onClick={onBack} aria-label="뒤로">
        <ArrowLeft size={22} strokeWidth={2} />
      </button>
      <div className="room-header__info">
        <h1 className="room-header__title">{roomName}</h1>
        <p className="room-header__subtitle">{getSubtitle(todayCompletedCount, memberCount)}</p>
      </div>
      <button
        type="button"
        className="room-header__more"
        aria-label="더보기"
        onClick={onMoreClick}
        disabled={!onMoreClick}
      >
        <MoreVertical size={20} strokeWidth={2} />
      </button>
    </header>
  );
}
