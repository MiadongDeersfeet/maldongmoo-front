import { useNavigate } from 'react-router-dom';
import { Copy } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge.jsx';
import RoomProfileStack from '@/components/room/RoomProfileStack.jsx';
import './RoomCard.css';

export default function RoomCard({ roomData }) {
  const navigate = useNavigate();
  const { room, memberCount = 0, isTodayCompleted, roomRole, participants = [] } = roomData;
  const isLeader = roomRole === 'LEADER';
  const canCopyInviteCode = Boolean(room.inviteCode);
  const profileParticipants = participants.slice(0, 4);

  const handleEnter = () => {
    navigate(`/rooms/${room.roomId}`);
  };

  const handleCopyInvite = async (e) => {
    e.stopPropagation();
    if (!room.inviteCode) return;

    try {
      await navigator.clipboard.writeText(room.inviteCode);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <article className="room-card">
      <div className="room-card__header">
        <div className="room-card__main">
          <RoomProfileStack participants={profileParticipants} />
          <div className="room-card__title-block">
            <h2 className="room-card__title">{room.roomName}</h2>
            <span className={`room-card__role-badge room-card__role-badge--${roomRole.toLowerCase()}`}>
              {isLeader ? '방장' : '멤버'}
            </span>
          </div>
        </div>
        <div className="room-card__today-status">
          <StatusBadge variant={isTodayCompleted ? 'done' : 'pending'}>
            {isTodayCompleted ? '오늘 완료' : '인증 전'}
          </StatusBadge>
        </div>
      </div>

      <div className="room-card__meta-row">
        <div className="room-card__member-summary">
          <span className="room-card__member-count">
            {memberCount}/{room.memberLimit ?? 0}명
          </span>
        </div>
        {canCopyInviteCode && (
          <button
            type="button"
            className="room-card__invite-copy"
            onClick={handleCopyInvite}
            aria-label="초대코드 복사"
          >
            <Copy size={14} strokeWidth={2} aria-hidden="true" />
            초대코드 복사
          </button>
        )}
      </div>

      <button type="button" className="room-card__enter-btn" onClick={handleEnter}>
        입장하기
      </button>
    </article>
  );
}
