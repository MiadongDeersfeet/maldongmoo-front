import { useState } from 'react';
import { Smile, Send } from 'lucide-react';
import DateDivider from '@/components/feed/DateDivider.jsx';
import ChatMessageBubble from './ChatMessageBubble.jsx';
import './ChatPanel.css';

export default function ChatPanel({
  chatFeed,
  currentMemberId,
  chatScrollRef,
  chatText,
  onChatTextChange,
  onSubmit,
  onReactionSelect,
  isReactionSubmitting = false,
  showInput = true,
  isInlineActive = false,
  dedicatedLayout = false,
}) {
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);
  const isEmpty = chatFeed.length === 0;
  const panelClassName = [
    'chat-panel',
    dedicatedLayout ? 'chat-panel--dedicated' : '',
    isInlineActive ? 'chat-panel--inline-active' : '',
    showInput ? '' : 'chat-panel--no-input',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={panelClassName}
      role="tabpanel"
      aria-label="채팅"
    >
      <div ref={chatScrollRef} className="chat-scroll-area scrollbar-soft">
        {isEmpty ? (
          <p className="chat-panel__empty">아직 채팅이 없어요. 첫 메시지를 남겨보세요.</p>
        ) : (
          chatFeed.map((day) => (
            <section key={day.checkInDate} className="chat-panel__day">
              <DateDivider checkInDate={day.checkInDate} variant="capsule" />
              {day.messages.map((message) => (
                <ChatMessageBubble
                  key={message.messageId}
                  message={message}
                  isMine={message.memberId === currentMemberId}
                  isPickerOpen={reactionPickerMessageId === message.messageId}
                  onOpenPicker={() => setReactionPickerMessageId(message.messageId)}
                  onClosePicker={() => setReactionPickerMessageId(null)}
                  onReactionSelect={(reactionType) => onReactionSelect?.(message.messageId, reactionType)}
                  isReactionSubmitting={isReactionSubmitting}
                />
              ))}
            </section>
          ))
        )}
      </div>

      {showInput && (
        <form className="chat-input-bar" onSubmit={onSubmit}>
          <button type="button" className="chat-emoji-button" aria-label="이모지">
            <Smile size={20} strokeWidth={2} />
          </button>
          <input
            value={chatText}
            onChange={(e) => onChatTextChange(e.target.value)}
            placeholder="메시지를 입력하세요..."
            maxLength={300}
            aria-label="채팅 메시지"
          />
          <button
            type="submit"
            className="chat-send-button"
            disabled={!chatText.trim()}
            aria-label="메시지 보내기"
          >
            <Send size={18} strokeWidth={2.25} />
          </button>
        </form>
      )}
    </div>
  );
}
