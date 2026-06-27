import { useCallback, useEffect, useRef, useState } from 'react';
import { Smile, Send } from 'lucide-react';
import DateDivider from '@/components/feed/DateDivider.jsx';
import { useVisualViewportInset } from '@/hooks/useVisualViewportInset.js';
import ChatMessageBubble from './ChatMessageBubble.jsx';
import './ChatPanel.css';

const NEAR_BOTTOM_THRESHOLD_PX = 80;
const KEYBOARD_OPEN_THRESHOLD_PX = 40;
const LAYOUT_SHRINK_THRESHOLD_PX = 48;
/** @temporary iPhone PWA keyboard/chrome 진단용 — 확인 후 제거 */
const CHAT_KEYBOARD_LAYOUT_DEBUG = true;

function isRectInVisualViewport(rect, visualViewport) {
  if (!rect || !visualViewport) {
    return null;
  }

  const viewportTop = visualViewport.offsetTop;
  const viewportBottom = visualViewport.offsetTop + visualViewport.height;
  return rect.bottom > viewportTop && rect.top < viewportBottom;
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
  const [contentOverflows, setContentOverflows] = useState(false);
  const contentRef = useRef(null);
  const inputRef = useRef(null);
  const suppressBlurRef = useRef(false);
  const stickToBottomRef = useRef(false);
  const baselineInnerHeightRef = useRef(
    typeof window !== 'undefined' ? window.innerHeight : 0,
  );
  const baselineScrollClientHeightRef = useRef(0);
  const wasKeyboardVisibleRef = useRef(false);
  const keyboardAware = Boolean(showInput && dedicatedLayout);
  const viewportInset = useVisualViewportInset(keyboardAware);
  const keyboardVisible = keyboardAware && viewportInset.bottom >= KEYBOARD_OPEN_THRESHOLD_PX;
  const layoutShrunkForKeyboard = keyboardVisible
    && window.innerHeight < baselineInnerHeightRef.current - LAYOUT_SHRINK_THRESHOLD_PX;
  const isEmpty = chatFeed.length === 0;
  const isSparseLayout = !contentOverflows;
  const panelClassName = [
    'chat-panel',
    dedicatedLayout ? 'chat-panel--dedicated' : '',
    isInlineActive ? 'chat-panel--inline-active' : '',
    showInput ? '' : 'chat-panel--no-input',
    keyboardVisible ? 'chat-panel--keyboard-visible' : '',
    isSparseLayout ? 'chat-panel--sparse' : '',
    isEmpty ? 'chat-panel--empty' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const panelStyle = keyboardVisible && !layoutShrunkForKeyboard && contentOverflows
    ? { '--chat-keyboard-inset': `${viewportInset.bottom}px` }
    : undefined;

  const logChatKeyboardLayout = useCallback((source = 'unknown') => {
    if (!CHAT_KEYBOARD_LAYOUT_DEBUG || typeof window === 'undefined') {
      return;
    }

    const visualViewport = window.visualViewport;
    const headerEl = document.querySelector('.room-header');
    const toolbarEl = document.querySelector('.room-detail-toolbar');
    const tabsEl = document.querySelector('.room-feed-tabs');
    const shellEl = document.querySelector('.room-detail-shell');
    const headerRect = headerEl?.getBoundingClientRect();
    const toolbarRect = toolbarEl?.getBoundingClientRect();
    const tabsRect = tabsEl?.getBoundingClientRect();
    const shellRect = shellEl?.getBoundingClientRect();

    console.log('[chat-keyboard-layout]', {
      source,
      innerHeight: window.innerHeight,
      visualViewportHeight: visualViewport?.height,
      visualViewportOffsetTop: visualViewport?.offsetTop,
      visualViewportInsetBottom: viewportInset.bottom,
      windowScrollY: window.scrollY,
      documentScrollTop: document.documentElement.scrollTop,
      bodyScrollTop: document.body.scrollTop,
      scrollClientHeight: chatScrollRef.current?.clientHeight,
      scrollTop: chatScrollRef.current?.scrollTop,
      scrollHeight: chatScrollRef.current?.scrollHeight,
      baseline: baselineScrollClientHeightRef.current,
      contentHeight: contentRef.current?.offsetHeight,
      contentOverflows,
      isSparseLayout,
      keyboardVisible,
      layoutShrunkForKeyboard,
      stickToBottom: stickToBottomRef.current,
      classes: panelClassName,
      headerRect,
      toolbarRect,
      tabsRect,
      shellRect,
      headerInVisualViewport: isRectInVisualViewport(headerRect, visualViewport),
      toolbarInVisualViewport: isRectInVisualViewport(toolbarRect, visualViewport),
      tabsInVisualViewport: isRectInVisualViewport(tabsRect, visualViewport),
      shellInVisualViewport: isRectInVisualViewport(shellRect, visualViewport),
    });
  }, [
    chatScrollRef,
    contentOverflows,
    isSparseLayout,
    keyboardVisible,
    layoutShrunkForKeyboard,
    panelClassName,
    viewportInset.bottom,
  ]);

  useEffect(() => {
    if (!keyboardVisible) {
      baselineInnerHeightRef.current = window.innerHeight;
    }
  }, [keyboardVisible]);

  const captureBaselineScrollClientHeight = useCallback(() => {
    const scrollElement = chatScrollRef?.current;
    if (!scrollElement || keyboardVisible) {
      return;
    }

    const { clientHeight } = scrollElement;
    if (clientHeight > 0) {
      baselineScrollClientHeightRef.current = clientHeight;
    }
  }, [chatScrollRef, keyboardVisible]);

  useEffect(() => {
    captureBaselineScrollClientHeight();

    const frameId = requestAnimationFrame(() => {
      captureBaselineScrollClientHeight();
    });

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

      // baseline 미캡처 + 키보드 ON: 줄어든 clientHeight로 dense 오판하지 않음
      return Number.MAX_SAFE_INTEGER;
    }

    return scrollElement.clientHeight;
  }, [chatScrollRef, keyboardVisible]);

  const isNearBottom = useCallback(() => {
    const scrollElement = chatScrollRef?.current;
    const contentElement = contentRef.current;
    if (!scrollElement) {
      return true;
    }

    const contentHeight = contentElement?.offsetHeight ?? 0;
    const viewportHeight = getEffectiveScrollViewportHeight();
    if (contentHeight <= viewportHeight) {
      return false;
    }

    return (
      scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight
      < NEAR_BOTTOM_THRESHOLD_PX
    );
  }, [chatScrollRef, getEffectiveScrollViewportHeight]);

  const contentFillsViewport = useCallback(() => {
    const scrollElement = chatScrollRef?.current;
    const contentElement = contentRef.current;
    if (!scrollElement || !contentElement) {
      return false;
    }

    return contentElement.offsetHeight > getEffectiveScrollViewportHeight();
  }, [chatScrollRef, getEffectiveScrollViewportHeight]);

  const updateContentOverflowFlag = useCallback(() => {
    const overflows = contentFillsViewport();
    setContentOverflows((prev) => (prev === overflows ? prev : overflows));
    return overflows;
  }, [contentFillsViewport]);

  const shouldPinAfterAction = useCallback(() => {
    if (!contentFillsViewport()) {
      return false;
    }

    return isNearBottom();
  }, [contentFillsViewport, isNearBottom]);

  const syncChatScrollLayout = useCallback(({ pinToBottom = false, debugSource = 'syncChatScrollLayout' } = {}) => {
    if (keyboardVisible) {
      logChatKeyboardLayout(debugSource);
    }

    const scrollElement = chatScrollRef?.current;
    const contentElement = contentRef.current;
    if (!scrollElement || !contentElement) {
      return;
    }

    contentElement.style.paddingTop = '0px';
    const overflows = updateContentOverflowFlag();

    if (!overflows) {
      scrollElement.scrollTop = 0;
      stickToBottomRef.current = false;
      return;
    }

    const shouldPin = pinToBottom && (stickToBottomRef.current || isNearBottom());
    if (shouldPin) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
      stickToBottomRef.current = true;
    }
  }, [chatScrollRef, isNearBottom, updateContentOverflowFlag, keyboardVisible, logChatKeyboardLayout]);

  useEffect(() => {
    const pinAllowed = stickToBottomRef.current && shouldPinAfterAction();

    syncChatScrollLayout({ pinToBottom: pinAllowed });

    const afterLayout = window.setTimeout(
      () => syncChatScrollLayout({
        pinToBottom: stickToBottomRef.current && shouldPinAfterAction(),
      }),
      80,
    );

    return () => window.clearTimeout(afterLayout);
  }, [chatFeed, shouldPinAfterAction, syncChatScrollLayout]);

  useEffect(() => {
    const scrollElement = chatScrollRef?.current;
    const contentElement = contentRef.current;
    if (!scrollElement || !contentElement) {
      return undefined;
    }

    const handleScroll = () => {
      if (!contentFillsViewport()) {
        stickToBottomRef.current = false;
        return;
      }

      stickToBottomRef.current = isNearBottom();
    };

    const resizeObserver = new ResizeObserver(() => {
      syncChatScrollLayout();
    });

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver.observe(scrollElement);
    resizeObserver.observe(contentElement);

    syncChatScrollLayout({
      pinToBottom: stickToBottomRef.current && shouldPinAfterAction(),
    });

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [chatScrollRef, isNearBottom, shouldPinAfterAction, syncChatScrollLayout, contentFillsViewport]);

  useEffect(() => {
    logChatKeyboardLayout(keyboardVisible ? 'keyboardVisible-on' : 'keyboardVisible-off');

    const justOpened = keyboardVisible && !wasKeyboardVisibleRef.current;

    if (justOpened) {
      if (shouldPinAfterAction()) {
        stickToBottomRef.current = true;
        syncChatScrollLayout({ pinToBottom: true, debugSource: 'keyboard-justOpened-pin' });
      } else {
        stickToBottomRef.current = false;
        syncChatScrollLayout({ pinToBottom: false, debugSource: 'keyboard-justOpened-sparse' });
      }
    }

    const afterLayoutFrameId = requestAnimationFrame(() => {
      logChatKeyboardLayout(keyboardVisible ? 'keyboardVisible-after-rAF' : 'keyboardVisible-off-after-rAF');
    });

    wasKeyboardVisibleRef.current = keyboardVisible;
    return () => cancelAnimationFrame(afterLayoutFrameId);
  }, [keyboardVisible, shouldPinAfterAction, syncChatScrollLayout, logChatKeyboardLayout]);

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
      const pinAfterSend = shouldPinAfterAction();
      stickToBottomRef.current = pinAfterSend;
      syncChatScrollLayout({ pinToBottom: pinAfterSend });
    };

    if (submitResult && typeof submitResult.then === 'function') {
      submitResult.finally(finishComposer);
      return;
    }

    finishComposer();
  }, [onSubmit, refocusInput, shouldPinAfterAction, syncChatScrollLayout]);

  const handleInputFocus = () => {
    if (!contentFillsViewport()) {
      return;
    }

    if (isNearBottom()) {
      stickToBottomRef.current = true;
      syncChatScrollLayout({ pinToBottom: true });
    }
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
