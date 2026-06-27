import { useCallback, useEffect, useRef, useState } from 'react';
import { Smile, Send } from 'lucide-react';
import DateDivider from '@/components/feed/DateDivider.jsx';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset.js';
import ChatMessageBubble from './ChatMessageBubble.jsx';
import './ChatPanel.css';

const NEAR_BOTTOM_THRESHOLD_PX = 80;
const KEYBOARD_OPEN_THRESHOLD_PX = 40;
const MAX_IDLE_TOP_PADDING_PX = 120;
const KEYBOARD_INSET_BUFFER_PX = 12;

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
  const contentRef = useRef(null);
  const inputRef = useRef(null);
  const suppressBlurRef = useRef(false);
  const stickToBottomRef = useRef(true);
  const keyboardAware = Boolean(showInput && dedicatedLayout);
  const viewportInset = useVisualViewportInset(keyboardAware);
  const keyboardVisible = keyboardAware && viewportInset.bottom >= KEYBOARD_OPEN_THRESHOLD_PX;
  const isEmpty = chatFeed.length === 0;
  const panelClassName = [
    'chat-panel',
    dedicatedLayout ? 'chat-panel--dedicated' : '',
    isInlineActive ? 'chat-panel--inline-active' : '',
    showInput ? '' : 'chat-panel--no-input',
    keyboardVisible ? 'chat-panel--keyboard-visible' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const panelStyle = keyboardAware
    ? {
      '--chat-keyboard-inset': `${Math.max(0, viewportInset.bottom - KEYBOARD_INSET_BUFFER_PX)}px`,
    }
    : undefined;

  const isNearBottom = useCallback(() => {
    const scrollElement = chatScrollRef?.current;
    if (!scrollElement) {
      return true;
    }

    return (
      scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight
      < NEAR_BOTTOM_THRESHOLD_PX
    );
  }, [chatScrollRef]);

  const wasKeyboardVisibleRef = useRef(false);

  const syncChatScrollLayout = useCallback(({ pinToBottom = false } = {}) => {
    const scrollElement = chatScrollRef?.current;
    const contentElement = contentRef.current;
    if (!scrollElement || !contentElement) {
      return;
    }

    const atBottom = pinToBottom || stickToBottomRef.current || isNearBottom();

    contentElement.style.paddingTop = '0px';
    const contentHeight = contentElement.offsetHeight;
    const overflow = scrollElement.clientHeight - contentHeight;

    if (!keyboardVisible && overflow > 0 && atBottom) {
      contentElement.style.paddingTop = `${Math.min(overflow, MAX_IDLE_TOP_PADDING_PX)}px`;
    }

    if (atBottom && (pinToBottom || stickToBottomRef.current || isNearBottom())) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
      stickToBottomRef.current = true;
    }
  }, [chatScrollRef, isNearBottom, keyboardVisible]);

  useEffect(() => {
    if (isEmpty) {
      return undefined;
    }

    if (stickToBottomRef.current || isNearBottom()) {
      stickToBottomRef.current = true;
      syncChatScrollLayout({ pinToBottom: true });

      const afterLayout = window.setTimeout(
        () => syncChatScrollLayout({ pinToBottom: true }),
        80,
      );

      return () => window.clearTimeout(afterLayout);
    }

    syncChatScrollLayout();
    return undefined;
  }, [chatFeed, isEmpty, isNearBottom, syncChatScrollLayout]);

  useEffect(() => {
    const scrollElement = chatScrollRef?.current;
    const contentElement = contentRef.current;
    if (!scrollElement || !contentElement || isEmpty) {
      return undefined;
    }

    const handleScroll = () => {
      stickToBottomRef.current = isNearBottom();
    };

    const resizeObserver = new ResizeObserver(() => {
      syncChatScrollLayout();
    });

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver.observe(scrollElement);
    resizeObserver.observe(contentElement);

    syncChatScrollLayout({ pinToBottom: stickToBottomRef.current });

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [chatScrollRef, isEmpty, isNearBottom, syncChatScrollLayout]);

  useEffect(() => {
    if (isEmpty) {
      wasKeyboardVisibleRef.current = keyboardVisible;
      return undefined;
    }

    if (keyboardVisible && !wasKeyboardVisibleRef.current && stickToBottomRef.current) {
      syncChatScrollLayout({ pinToBottom: true });
    }

    wasKeyboardVisibleRef.current = keyboardVisible;
    return undefined;
  }, [isEmpty, keyboardVisible, syncChatScrollLayout]);

  const refocusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const preventComposerBlur = useCallback((event) => {
    event.preventDefault();
    suppressBlurRef.current = true;
  }, []);

  const handleFormSubmit = useCallback((event) => {
    event.preventDefault();
    suppressBlurRef.current = true;
    stickToBottomRef.current = true;

    let submitResult;
    try {
      submitResult = onSubmit?.(event);
    } catch (error) {
      suppressBlurRef.current = false;
      refocusInput();
      throw error;
    }

    const finishComposer = () => {
      suppressBlurRef.current = false;
      refocusInput();
      syncChatScrollLayout({ pinToBottom: true });
    };

    if (submitResult && typeof submitResult.then === 'function') {
      submitResult.finally(finishComposer);
      return;
    }

    finishComposer();
  }, [onSubmit, refocusInput, syncChatScrollLayout]);

  const handleInputFocus = () => {
    stickToBottomRef.current = true;
    syncChatScrollLayout({ pinToBottom: true });
  };

  return (
    <div
      className={panelClassName}
      style={panelStyle}
      role="tabpanel"
      aria-label="채팅"
    >
      <div
        ref={chatScrollRef}
        className="chat-scroll-area scrollbar-soft"
      >
        <div ref={contentRef} className="chat-scroll-area__content">
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
        <form className="chat-input-bar" onSubmit={handleFormSubmit}>
          <button
            type="button"
            className="chat-emoji-button"
            aria-label="이모지"
            onPointerDown={preventComposerBlur}
          >
            <Smile size={18} strokeWidth={2} />
          </button>
          <input
            ref={inputRef}
            value={chatText}
            onChange={(e) => onChatTextChange(e.target.value)}
            onFocus={handleInputFocus}
            placeholder="메시지를 입력하세요..."
            maxLength={300}
            aria-label="채팅 메시지"
            enterKeyHint="send"
            inputMode="text"
          />
          <button
            type="submit"
            className="chat-send-button"
            disabled={!chatText.trim()}
            aria-label="메시지 보내기"
            onPointerDown={preventComposerBlur}
          >
            <Send size={16} strokeWidth={2.25} />
          </button>
        </form>
      )}
    </div>
  );
}
