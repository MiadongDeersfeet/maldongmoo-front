import { useEffect, useRef } from 'react';
import AvatarCircle from '@/components/ui/AvatarCircle.jsx';
import { CHAT_REACTION_OPTIONS, getChatReactionEmoji } from '@/constants/chatReactions.js';
import { formatDisplayTime } from '@/utils/date.js';
import './ChatMessageBubble.css';

const LONG_PRESS_MS = 480;
const LONG_PRESS_MOVE_THRESHOLD_PX = 10;

export default function ChatMessageBubble({
  message,
  isMine,
  isPickerOpen = false,
  onOpenPicker,
  onClosePicker,
  onReactionSelect,
  isReactionSubmitting = false,
}) {
  const rowRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressStartRef = useRef({ x: 0, y: 0 });
  const timeLabel = formatDisplayTime(message.createdAt);
  const showUnreadCount = typeof message.unreadCount === 'number' && message.unreadCount > 0;
  const reactions = Array.isArray(message.reactions) ? message.reactions : [];
  const hasReactions = reactions.length > 0;
  const showReactionArea = isPickerOpen || hasReactions;

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => () => clearLongPressTimer(), []);

  useEffect(() => {
    if (!isPickerOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (rowRef.current?.contains(event.target)) {
        return;
      }
      onClosePicker?.();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isPickerOpen, onClosePicker]);

  const openReactionPicker = () => {
    if (isReactionSubmitting) {
      return;
    }
    onOpenPicker?.();
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(12);
    }
  };

  const handleBubblePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    longPressStartRef.current = { x: event.clientX, y: event.clientY };
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      openReactionPicker();
    }, LONG_PRESS_MS);
  };

  const handleBubblePointerMove = (event) => {
    if (!longPressTimerRef.current) {
      return;
    }

    const deltaX = Math.abs(event.clientX - longPressStartRef.current.x);
    const deltaY = Math.abs(event.clientY - longPressStartRef.current.y);
    if (deltaX > LONG_PRESS_MOVE_THRESHOLD_PX || deltaY > LONG_PRESS_MOVE_THRESHOLD_PX) {
      clearLongPressTimer();
    }
  };

  const handleBubblePointerUp = () => {
    clearLongPressTimer();
  };

  const handleBubbleContextMenu = (event) => {
    event.preventDefault();
    clearLongPressTimer();
    if (!isPickerOpen) {
      openReactionPicker();
    }
  };

  const handleReactionClick = (reactionType) => {
    if (isReactionSubmitting) {
      return;
    }
    onReactionSelect?.(reactionType);
    onClosePicker?.();
  };

  const bubble = (
    <div
      className="chat-bubble chat-bubble--interactive"
      role="button"
      tabIndex={0}
      aria-expanded={isPickerOpen}
      aria-label="메시지. 길게 눌러 반응을 선택하세요"
      onPointerDown={handleBubblePointerDown}
      onPointerMove={handleBubblePointerMove}
      onPointerUp={handleBubblePointerUp}
      onPointerCancel={handleBubblePointerUp}
      onPointerLeave={handleBubblePointerUp}
      onContextMenu={handleBubbleContextMenu}
    >
      {message.messageText}
    </div>
  );

  const reactionPicker = isPickerOpen ? (
    <div className="chat-reaction-picker" role="toolbar" aria-label="메시지 반응">
      {CHAT_REACTION_OPTIONS.map(({ type, emoji, label }) => {
        const isSelected = message.myReactionType === type;
        return (
          <button
            key={type}
            type="button"
            className={`chat-reaction-picker__button${isSelected ? ' is-selected' : ''}`}
            aria-label={label}
            aria-pressed={isSelected}
            disabled={isReactionSubmitting}
            onClick={() => handleReactionClick(type)}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  ) : null;

  const reactionSummary = hasReactions ? (
    <div className="chat-reaction-summary" aria-label="메시지 반응 요약">
      {reactions.map(({ reactionType, count }) => {
        const isSelected = message.myReactionType === reactionType;
        return (
          <button
            key={reactionType}
            type="button"
            className={`chat-reaction-summary__chip${isSelected ? ' is-mine' : ''}`}
            aria-label={`${getChatReactionEmoji(reactionType)} ${count}`}
            disabled={isReactionSubmitting}
            onClick={() => handleReactionClick(reactionType)}
          >
            <span className="chat-reaction-summary__emoji">{getChatReactionEmoji(reactionType)}</span>
            <span className="chat-reaction-summary__count">{count}</span>
          </button>
        );
      })}
    </div>
  ) : null;

  const reactionArea = showReactionArea ? (
    <div className={`chat-message-reactions${isMine ? ' is-mine' : ''}`}>
      {reactionPicker}
      {reactionSummary}
    </div>
  ) : null;

  if (isMine) {
    return (
      <div ref={rowRef} className="chat-message-row is-mine">
        <div className="chat-message-content is-mine">
          <div className="chat-message-bubble-row is-mine">
            <div className="chat-message-side-meta">
              {showUnreadCount && (
                <span className="chat-message-unread-count">{message.unreadCount}</span>
              )}
              <span className="chat-message-time">{timeLabel}</span>
            </div>
            {bubble}
          </div>
          {reactionArea}
        </div>
      </div>
    );
  }

  return (
    <div ref={rowRef} className="chat-message-row">
      <div className="chat-message-with-avatar">
        <AvatarCircle
          name={message.memberName}
          profileImg={message.profileImg}
          size="chat"
          className="chat-avatar"
        />
        <span className="chat-message-name">{message.memberName}</span>
        <div className="chat-message-bubble-row">
          {bubble}
          <span className="chat-message-time">{timeLabel}</span>
        </div>
        {reactionArea}
      </div>
    </div>
  );
}
