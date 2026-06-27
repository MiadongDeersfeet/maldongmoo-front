import { useCallback, useEffect, useRef, useState } from 'react';
import { Smile, Send } from 'lucide-react';
import DateDivider from '@/components/feed/DateDivider.jsx';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset.js';
import ChatMessageBubble from './ChatMessageBubble.jsx';
import './ChatPanel.css';

const KEYBOARD_OPEN_THRESHOLD_PX = 40;
const NEAR_BOTTOM_THRESHOLD_PX = 96;

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
  const baselineScrollClientHeightRef = useRef(0);
  const inputRef = useRef(null);
  const suppressBlurRef = useRef(false);
  const keyboardAware = Boolean(showInput && dedicatedLayout);
  const viewportInset = useVisualViewportInset(keyboardAware);
  const keyboardVisible = keyboardAware && viewportInset.bottom >= KEYBOARD_OPEN_THRESHOLD_PX;
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

    const keyboardOpen = viewportInset.bottom >= KEYBOARD_OPEN_THRESHOLD_PX;
    if (keyboardOpen || isInputFocused) {
      setKeyboardOpenClass(true);
      return;
    }

    setKeyboardOpenClass(false);
  }, [keyboardAware, isInputFocused, viewportInset.bottom, setKeyboardOpenClass]);

  const captureBaselineScrollClientHeight = useCallback(() => {
    const scrollElement = chatScrollRef?.current;
    if (!scrollElement || keyboardVisible) {
      return;
    }

    if (scrollElement.clientHeight > 0) {
      baselineScrollClientHeightRef.current = scrollElement.clientHeight;
    }
  }, [chatScrollRef, keyboardVisible]);

  useEffect(() => {
    captureBaselineScrollClientHeight();
    const frameId = requestAnimationFrame(captureBaselineScrollClientHeight);
    return () => cancelAnimationFrame(frameId);
  }, [captureBaselineScrollClientHeight, chatFeed, showInput]);

  const getEffectiveScrollViewportHeight = useCallback(() => {
    const scrollElement = chatScrollRef?.current;
    if (!scrollElement) {
      return 0;
    }

    if (keyboardVisible) {
      const baseline = baselineScrollClientHeightRef.current;
      if (baseline > 0) {
        return baseline;
      }

      return Number.MAX_SAFE_INTEGER;
    }

    return scrollElement.clientHeight;
  }, [chatScrollRef, keyboardVisible]);

  const contentOverflows = useCallback(() => {
    const scrollElement = chatScrollRef?.current;
    const contentElement = scrollElement?.querySelector('.chat-scroll-area__content');
    if (!scrollElement || !contentElement) {
      return false;
    }

    return contentElement.offsetHeight > getEffectiveScrollViewportHeight();
  }, [chatScrollRef, getEffectiveScrollViewportHeight]);

  const pinChatToBottom = useCallback((behavior = 'auto') => {
    const scrollElement = chatScrollRef?.current;
    if (!scrollElement) {
      return;
    }

    const apply = () => {
      if (!contentOverflows()) {
        scrollElement.scrollTop = 0;
        return;
      }

      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior,
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(apply);
    });
  }, [chatScrollRef, contentOverflows]);

  const isNearBottom = useCallback(() => {
    const scrollElement = chatScrollRef?.current;
    const contentElement = scrollElement?.querySelector('.chat-scroll-area__content');
    if (!scrollElement) {
      return true;
    }

    const contentHeight = contentElement?.offsetHeight ?? 0;
    if (contentHeight <= getEffectiveScrollViewportHeight()) {
      return false;
    }

    return (
      scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight
      < NEAR_BOTTOM_THRESHOLD_PX
    );
  }, [chatScrollRef, getEffectiveScrollViewportHeight]);

  const syncChatScrollLayout = useCallback(({ pinToBottom = false } = {}) => {
    const scrollElement = chatScrollRef?.current;
    if (!scrollElement) {
      return;
    }

    if (!contentOverflows()) {
      scrollElement.scrollTop = 0;
      return;
    }

    if (pinToBottom && isNearBottom()) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [chatScrollRef, contentOverflows, isNearBottom]);

  useEffect(() => {
    if (isEmpty) {
      return undefined;
    }

    const scrollElement = chatScrollRef?.current;
    const contentElement = scrollElement?.querySelector('.chat-scroll-area__content');
    if (!scrollElement || !contentElement) {
      return undefined;
    }

    const handleContentResize = () => {
      syncChatScrollLayout({ pinToBottom: isNearBottom() });
    };

    const resizeObserver = new ResizeObserver(handleContentResize);
    resizeObserver.observe(contentElement);
    resizeObserver.observe(scrollElement);

    return () => resizeObserver.disconnect();
  }, [chatFeed, chatScrollRef, isEmpty, isNearBottom, syncChatScrollLayout]);

  useEffect(() => {
    if (isEmpty) {
      return undefined;
    }

    syncChatScrollLayout({ pinToBottom: isNearBottom() });
    const afterLayout = window.setTimeout(
      () => syncChatScrollLayout({ pinToBottom: isNearBottom() }),
      80,
    );

    return () => window.clearTimeout(afterLayout);
  }, [chatFeed, isEmpty, isNearBottom, syncChatScrollLayout]);

  useEffect(() => {
    if (!keyboardAware || isEmpty) {
      wasKeyboardOpenRef.current = keyboardVisible;
      return undefined;
    }

    const justOpened = keyboardVisible && !wasKeyboardOpenRef.current;
    if (justOpened) {
      syncChatScrollLayout({ pinToBottom: isNearBottom() });
    }

    wasKeyboardOpenRef.current = keyboardVisible;
    return undefined;
  }, [keyboardAware, isEmpty, keyboardVisible, isNearBottom, syncChatScrollLayout]);

  useEffect(() => {
    if (!keyboardAware || isEmpty || !isInputFocused) {
      return undefined;
    }

    syncChatScrollLayout({ pinToBottom: isNearBottom() });
    return undefined;
  }, [keyboardAware, isEmpty, isInputFocused, keyboardVisible, viewportInset.bottom, syncChatScrollLayout, isNearBottom]);

  const refocusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
      setIsInputFocused(true);
      setKeyboardOpenClass(true);
    });
  }, [setKeyboardOpenClass]);

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
    setIsInputFocused(true);
    setKeyboardOpenClass(true);
    syncChatScrollLayout({ pinToBottom: false });
  };

  const handleInputBlur = () => {
    requestAnimationFrame(() => {
      if (suppressBlurRef.current || document.activeElement === inputRef.current) {
        return;
      }

      setIsInputFocused(false);
    });
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
          {!isEmpty && <div className="chat-scroll-area__bottom-spacer" aria-hidden="true" />}
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
            onPointerDown={preventComposerBlur}
          >
            <Send size={16} strokeWidth={2.25} />
          </button>
        </form>
      )}
    </div>
  );
}
