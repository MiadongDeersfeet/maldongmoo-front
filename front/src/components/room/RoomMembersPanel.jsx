import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import SwipeableRoomMemberRow from '@/components/room/SwipeableRoomMemberRow.jsx';
import './RoomMembersPanel.css';

function sortMembers(members, currentMemberId) {
  return [...members].sort((a, b) => {
    const aIsSelf = a.memberId === currentMemberId;
    const bIsSelf = b.memberId === currentMemberId;
    if (aIsSelf !== bIsSelf) {
      return aIsSelf ? -1 : 1;
    }

    const aIsLeader = a.roomRole === 'LEADER';
    const bIsLeader = b.roomRole === 'LEADER';
    if (aIsLeader !== bIsLeader) {
      return aIsLeader ? -1 : 1;
    }

    return (a.name ?? '').localeCompare(b.name ?? '', 'ko');
  });
}

export default function RoomMembersPanel({
  members = [],
  currentMemberId,
  isLeader = false,
  onClose,
  onEncourage,
  onKick,
  disabled = false,
}) {
  const [openMemberId, setOpenMemberId] = useState(null);

  const sortedMembers = useMemo(
    () => sortMembers(members, currentMemberId),
    [members, currentMemberId],
  );

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <section className="room-members-panel" aria-label="말동무들">
      <header className="room-members-panel__header">
        <button
          type="button"
          className="room-members-panel__back"
          onClick={onClose}
          aria-label="닫기"
        >
          <ArrowLeft size={22} strokeWidth={2} />
        </button>
        <div className="room-members-panel__title-wrap">
          <h2 className="room-members-panel__title">말동무들</h2>
          <span className="room-members-panel__count">{members.length}</span>
        </div>
      </header>

      <ul className="room-members-panel__list scrollbar-soft">
        {sortedMembers.map((memberItem) => {
          const isSelf = memberItem.memberId === currentMemberId;
          const canKick = isLeader && !isSelf && memberItem.roomRole !== 'LEADER';

          return (
            <SwipeableRoomMemberRow
              key={memberItem.memberId}
              member={memberItem}
              isSelf={isSelf}
              canKick={canKick}
              isOpen={openMemberId === memberItem.memberId}
              onOpenChange={(memberId) => setOpenMemberId(memberId)}
              onEncourage={onEncourage}
              onKick={onKick}
              disabled={disabled}
            />
          );
        })}
      </ul>
    </section>
  );
}
