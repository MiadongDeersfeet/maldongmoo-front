import { useNavigate } from 'react-router-dom';
import { BookOpen, Copy } from 'lucide-react';
import AvatarCircle from '@/components/ui/AvatarCircle.jsx';
import StatusBadge from '@/components/ui/StatusBadge.jsx';
import './RoomCard.css';

const ROOM_ICON_VARIANTS = ['mint', 'tan', 'sage'];
const VISIBLE_AVATAR_COUNT = 2;

export default function RoomCard({ roomData }) {
  const navigate = useNavigate();
  const { room, memberCount, isTodayCompleted, roomRole, participants = [] } = roomData;
  const isLeader = roomRole === 'LEADER';
  const iconVariant = ROOM_ICON_VARIANTS[room.roomId % ROOM_ICON_VARIANTS.length];
  const visibleParticipants = participants.slice(0, VISIBLE_AVATAR_COUNT);
  const extraParticipant = participants[VISIBLE_AVATAR_COUNT] ?? null;

  const handleEnter = () => {
    navigate(`/rooms/${room.roomId}`);
  };

  const handleCopyInvite = async (e) => {
    e.stopPropagation();
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
          <div className={`room-card__icon-tile room-card__icon-tile--${iconVariant}`} aria-hidden="true">
            <BookOpen size={20} strokeWidth={2} />
          </div>
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
          {visibleParticipants.length > 0 && (
            <div className="room-card__avatars" aria-hidden="true">
              {visibleParticipants.map((participant) => (
                <AvatarCircle
                  key={participant.memberId}
                  name={participant.name}
                  profileImg={participant.profileImg}
                  size="sm"
                  className="room-card__avatar"
                />
              ))}
            </div>
          )}
          {extraParticipant && (
            <span className="room-card__member-chip">
              {extraParticipant.name?.charAt(0) ?? '?'}
            </span>
          )}
          <span className="room-card__member-count">
            {memberCount}/{room.memberLimit}명
          </span>
        </div>
        {isLeader && (
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
