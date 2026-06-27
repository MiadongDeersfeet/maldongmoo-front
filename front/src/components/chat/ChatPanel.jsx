import { useCallback, useEffect, useRef, useState } from 'react';
import { Smile, Send } from 'lucide-react';
import DateDivider from '@/components/feed/DateDivider.jsx';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset.js';
import ChatMessageBubble from './ChatMessageBubble.jsx';
import './ChatPanel.css';

const KEYBOARD_OPEN_THRESHOLD_PX = 40;

function isKeyboardVisible(viewportInset) {
  return viewportInset.bottom >= KEYBOARD_OPEN_THRESHOLD_PX;
}

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
  const wasKeyboardOpenRef = useRef(false);
  const inputRef = useRef(null);
  const suppressBlurRef = useRef(false);
  const keyboardAware = Boolean(showInput && dedicatedLayout);
  const viewportInset = useVisualViewportInset(keyboardAware);
  const keyboardVisible = keyboardAware && isKeyboardVisible(viewportInset);
  const isEmpty = chatFeed.length === 0;
  const panelClassName = [
    'chat-panel',
    dedicatedLayout ? 'chat-panel--dedicated' : '',
    isInlineActive ? 'chat-panel--inline-active' : '',
    showInput ? '' : 'chat-panel--no-input',
    keyboardVisible ? 'chat-panel--keyboard-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const syncKeyboardDocumentState = useCallback((open) => {
    document.documentElement.classList.toggle('chat-keyboard-open', open);
    document.documentElement.classList.toggle('chat-composer-active', open);
  }, []);

  useEffect(() => {
    if (!keyboardAware) {
      syncKeyboardDocumentState(false);
      return undefined;
    }

    syncKeyboardDocumentState(keyboardVisible);

    return () => {
      syncKeyboardDocumentState(false);
      document.documentElement.style.removeProperty('--keyboard-inset');
    };
  }, [keyboardAware, keyboardVisible, syncKeyboardDocumentState]);

  useEffect(() => {
    if (!keyboardAware) {
      return;
    }

    document.documentElement.style.setProperty(
      '--keyboard-inset',
      `${viewportInset.bottom}px`,
    );
  }, [keyboardAware, viewportInset.bottom]);

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
    if (isEmpty) {
      return undefined;
    }

    const scrollElement = chatScrollRef?.current;
    const contentElement = scrollElement?.querySelector('.chat-scroll-area__content');
    if (!scrollElement || !contentElement) {
      return undefined;
    }

    const isNearBottom = () => {
      const threshold = 96;
      return scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < threshold;
    };

    const pinIfNearBottom = () => {
      if (isNearBottom()) {
        pinChatToBottom('auto');
      }
    };

    const resizeObserver = new ResizeObserver(pinIfNearBottom);
    resizeObserver.observe(contentElement);

    return () => resizeObserver.disconnect();
  }, [chatFeed, chatScrollRef, isEmpty, pinChatToBottom]);

  useEffect(() => {
    if (isEmpty) {
      return undefined;
    }

    pinChatToBottom('auto');
    const afterLayout = window.setTimeout(() => pinChatToBottom('auto'), 80);

    return () => window.clearTimeout(afterLayout);
  }, [chatFeed, isEmpty, pinChatToBottom]);

  useEffect(() => {
    if (!keyboardAware || isEmpty) {
      return undefined;
    }

    if (keyboardVisible && !wasKeyboardOpenRef.current) {
      pinChatToBottom('auto');
    }

    wasKeyboardOpenRef.current = keyboardVisible;
    return undefined;
  }, [keyboardAware, isEmpty, keyboardVisible, pinChatToBottom]);

  const dismissKeyboard = useCallback(() => {
    inputRef.current?.blur();
  }, []);

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
      pinChatToBottom('auto');
    };

    if (submitResult && typeof submitResult.then === 'function') {
      submitResult.finally(finishComposer);
      return;
    }

    finishComposer();
  }, [onSubmit, pinChatToBottom, refocusInput]);

  const handleInputFocus = () => {
    pinChatToBottom('auto');
  };

  const handleScrollAreaPointerDown = (event) => {
    if (event.target.closest('.chat-bubble-wrap, .chat-input-bar, .chat-reaction-picker')) {
      return;
    }
    dismissKeyboard();
  };

  return (
    <div
      className={panelClassName}
      role="tabpanel"
      aria-label="채팅"
    >
      <div
        ref={chatScrollRef}
        className="chat-scroll-area scrollbar-soft"
        onPointerDown={handleScrollAreaPointerDown}
      >
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
          {!isEmpty && !dedicatedLayout && (
            <div className="chat-scroll-area__bottom-spacer" aria-hidden="true" />
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
