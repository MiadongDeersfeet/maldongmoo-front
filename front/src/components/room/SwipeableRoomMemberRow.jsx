import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronsLeft, Crown } from 'lucide-react';
import AvatarCircle from '@/components/ui/AvatarCircle.jsx';
import './SwipeableRoomMemberRow.css';

const ACTION_WIDTH = 5.25;
const DRAG_THRESHOLD_PX = 6;

function getRoleLabel(isSelf, roomRole) {
  if (isSelf) return '나';
  if (roomRole === 'LEADER') return '방장';
  return '멤버';
}

function pxToRem(px) {
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return px / rootFontSize;
}

export default function SwipeableRoomMemberRow({
  member,
  isSelf = false,
  canKick = false,
  isOpen = false,
  onOpenChange,
  onEncourage,
  onKick,
  disabled = false,
}) {
  const canSwipe = !isSelf && !disabled;
  const actionCount = canKick ? 2 : canSwipe ? 1 : 0;
  const revealWidthRem = actionCount * ACTION_WIDTH;

  const [offsetRem, setOffsetRem] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const offsetRemRef = useRef(0);
  const didDragRef = useRef(false);

  useEffect(() => {
    offsetRemRef.current = offsetRem;
  }, [offsetRem]);

  useEffect(() => {
    if (!isOpen) {
      setOffsetRem(0);
      offsetRemRef.current = 0;
    } else {
      setOffsetRem(revealWidthRem);
      offsetRemRef.current = revealWidthRem;
    }
  }, [isOpen, revealWidthRem]);

  const closeRow = useCallback(() => {
    setOffsetRem(0);
    offsetRemRef.current = 0;
    onOpenChange?.(null);
  }, [onOpenChange]);

  const openRow = useCallback(() => {
    if (!canSwipe || revealWidthRem === 0) {
      return;
    }
    setOffsetRem(revealWidthRem);
    offsetRemRef.current = revealWidthRem;
    onOpenChange?.(member.memberId);
  }, [canSwipe, member.memberId, onOpenChange, revealWidthRem]);

  const finishDrag = useCallback(() => {
    setIsDragging(false);
    const shouldOpen = offsetRemRef.current > revealWidthRem * 0.35;
    if (shouldOpen) {
      openRow();
    } else {
      closeRow();
    }
  }, [closeRow, openRow, revealWidthRem]);

  useEffect(() => {
    if (!isDragging) {
      return undefined;
    }

    function handlePointerMove(event) {
      const deltaPx = startXRef.current - event.clientX;
      if (Math.abs(deltaPx) > DRAG_THRESHOLD_PX) {
        didDragRef.current = true;
      }

      const next = Math.max(
        0,
        Math.min(revealWidthRem, startOffsetRef.current + pxToRem(deltaPx)),
      );
      offsetRemRef.current = next;
      setOffsetRem(next);
    }

    function handlePointerUp() {
      finishDrag();
    }

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [finishDrag, isDragging, revealWidthRem]);

  const handlePointerDown = (event) => {
    if (!canSwipe || revealWidthRem === 0 || event.button !== 0) {
      return;
    }

    didDragRef.current = false;
    setIsDragging(true);
    startXRef.current = event.clientX;
    startOffsetRef.current = isOpen ? revealWidthRem : offsetRemRef.current;
  };

  const handleContentClick = () => {
    if (!canSwipe || revealWidthRem === 0 || didDragRef.current) {
      return;
    }

    if (isOpen) {
      closeRow();
    } else {
      openRow();
    }
  };

  const handleEncourageClick = () => {
    onEncourage?.(member);
    closeRow();
  };

  const handleKickClick = () => {
    onKick?.(member);
    closeRow();
  };

  const roleLabel = getRoleLabel(isSelf, member.roomRole);
  const isLeader = member.roomRole === 'LEADER';
  const visibleOffsetRem = isOpen && !isDragging ? revealWidthRem : offsetRem;
  const revealProgress = revealWidthRem > 0 ? visibleOffsetRem / revealWidthRem : 0;
  const showSwipeHint = canSwipe && revealProgress < 0.92;

  return (
    <li className="swipeable-room-member-row">
      {canSwipe && actionCount > 0 && (
        <div
          className="swipeable-room-member-row__actions"
          style={{ width: `${revealWidthRem}rem` }}
          aria-hidden={visibleOffsetRem === 0}
        >
          <button
            type="button"
            className="swipeable-room-member-row__action swipeable-room-member-row__action--encourage"
            onClick={handleEncourageClick}
          >
            격려하기
          </button>
          {canKick && (
            <button
              type="button"
              className="swipeable-room-member-row__action swipeable-room-member-row__action--kick"
              onClick={handleKickClick}
            >
              내보내기
            </button>
          )}
        </div>
      )}

      <div
        className={`swipeable-room-member-row__content ${isDragging ? 'is-dragging' : ''} ${canSwipe ? 'is-swipeable' : ''} ${showSwipeHint ? 'has-swipe-hint' : ''}`}
        style={{
          transform: `translateX(-${visibleOffsetRem}rem)`,
          '--swipe-reveal-progress': revealProgress,
        }}
        onPointerDown={handlePointerDown}
        onClick={handleContentClick}
      >
        <div className="swipeable-room-member-row__avatar-wrap">
          <AvatarCircle
            name={member.name}
            profileImg={member.profileImg}
            size="lg"
          />
          {isLeader && (
            <span className="swipeable-room-member-row__leader-badge" aria-label="방장">
              <Crown size={12} strokeWidth={2.25} />
            </span>
          )}
        </div>

        <div className="swipeable-room-member-row__info">
          <p className="swipeable-room-member-row__name">{member.name}</p>
          <p className="swipeable-room-member-row__meta">{roleLabel}</p>
        </div>

        {showSwipeHint && (
          <div className="swipeable-room-member-row__swipe-hint" aria-hidden="true">
            <span className="swipeable-room-member-row__swipe-hint-icon">
              <ChevronsLeft size={17} strokeWidth={2.25} />
            </span>
          </div>
        )}
      </div>
    </li>
  );
}
