import { useCallback, useEffect, useRef, useState } from 'react';
import { Smile, Send } from 'lucide-react';
import DateDivider from '@/components/feed/DateDivider.jsx';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset.js';
import ChatMessageBubble from './ChatMessageBubble.jsx';
import './ChatPanel.css';

const KEYBOARD_OPEN_THRESHOLD_PX = 40;

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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const wasKeyboardOpenRef = useRef(false);
  const keyboardAware = Boolean(showInput && dedicatedLayout);
  const viewportInset = useVisualViewportInset(keyboardAware);
  const isEmpty = chatFeed.length === 0;
  const panelClassName = [
    'chat-panel',
    dedicatedLayout ? 'chat-panel--dedicated' : '',
    isInlineActive ? 'chat-panel--inline-active' : '',
    showInput ? '' : 'chat-panel--no-input',
  ]
    .filter(Boolean)
    .join(' ');

  const setKeyboardOpenClass = useCallback((open) => {
    document.documentElement.classList.toggle('chat-keyboard-open', open);
  }, []);

  useEffect(() => {
    if (!keyboardAware) {
      return undefined;
    }

    document.documentElement.classList.add('chat-composer-active');

    return () => {
      document.documentElement.classList.remove('chat-composer-active');
      document.documentElement.classList.remove('chat-keyboard-open');
      document.documentElement.style.removeProperty('--visual-viewport-height');
      document.documentElement.style.removeProperty('--visual-viewport-offset-top');
      document.documentElement.style.removeProperty('--keyboard-inset');
    };
  }, [keyboardAware]);

  useEffect(() => {
    if (!keyboardAware || viewportInset.height == null) {
      return;
    }

    document.documentElement.style.setProperty(
      '--visual-viewport-height',
      `${viewportInset.height}px`,
    );
    document.documentElement.style.setProperty(
      '--visual-viewport-offset-top',
      `${viewportInset.offsetTop}px`,
    );
    document.documentElement.style.setProperty(
      '--keyboard-inset',
      `${viewportInset.bottom}px`,
    );
  }, [keyboardAware, viewportInset.height, viewportInset.offsetTop, viewportInset.bottom]);

  useEffect(() => {
    if (!keyboardAware) {
      return;
    }

    const keyboardVisible = viewportInset.bottom >= KEYBOARD_OPEN_THRESHOLD_PX;
    if (keyboardVisible || isInputFocused) {
      setKeyboardOpenClass(true);
      return;
    }

    setKeyboardOpenClass(false);
  }, [keyboardAware, isInputFocused, viewportInset.bottom, setKeyboardOpenClass]);

  const pinChatToBottom = useCallback((behavior = 'auto') => {
    const scrollElement = chatScrollRef?.current;
    if (!scrollElement) {
      return;
    }

    const apply = () => {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior,
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(apply);
    });
  }, [chatScrollRef]);

  useEffect(() => {
    if (!keyboardAware || !isInputFocused) {
      return undefined;
    }

    pinChatToBottom('auto');
    const afterLayout = window.setTimeout(() => pinChatToBottom('auto'), 240);

    return () => window.clearTimeout(afterLayout);
  }, [
    keyboardAware,
    isInputFocused,
    viewportInset.height,
    viewportInset.bottom,
    viewportInset.offsetTop,
    chatFeed.length,
    pinChatToBottom,
  ]);

  useEffect(() => {
    if (!keyboardAware) {
      wasKeyboardOpenRef.current = false;
      return;
    }

    const keyboardVisible = viewportInset.bottom >= KEYBOARD_OPEN_THRESHOLD_PX;
    if (keyboardVisible && !wasKeyboardOpenRef.current) {
      pinChatToBottom('auto');
      window.setTimeout(() => pinChatToBottom('auto'), 240);
    }

    wasKeyboardOpenRef.current = keyboardVisible;
  }, [keyboardAware, viewportInset.bottom, pinChatToBottom]);

  const handleInputFocus = () => {
    setIsInputFocused(true);
    setKeyboardOpenClass(true);
    pinChatToBottom('auto');
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  return (
    <div
      className={panelClassName}
      role="tabpanel"
      aria-label="채팅"
    >
      <div ref={chatScrollRef} className="chat-scroll-area scrollbar-soft">
        <div className="chat-scroll-area__content">
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
      </div>

      {showInput && (
        <form className="chat-input-bar" onSubmit={onSubmit}>
          <button type="button" className="chat-emoji-button" aria-label="이모지">
            <Smile size={18} strokeWidth={2} />
          </button>
          <input
            value={chatText}
            onChange={(e) => onChatTextChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="메시지를 입력하세요..."
            maxLength={300}
            aria-label="채팅 메시지"
            enterKeyHint="send"
          />
          <button
            type="submit"
            className="chat-send-button"
            disabled={!chatText.trim()}
            aria-label="메시지 보내기"
          >
            <Send size={16} strokeWidth={2.25} />
          </button>
        </form>
      )}
    </div>
  );
}
