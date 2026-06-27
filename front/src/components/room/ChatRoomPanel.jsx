import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import ChatPanel from '@/components/chat/ChatPanel.jsx';

function scrollElementToBottom(element, behavior = 'auto') {
  if (!element) return;

  requestAnimationFrame(() => {
    element.scrollTo({
      top: element.scrollHeight,
      behavior,
    });
  });
}

const ChatRoomPanel = forwardRef(function ChatRoomPanel(
  {
    chatFeed,
    currentMemberId,
    chatText,
    onChatTextChange,
    onSubmit,
    onReactionSelect,
    isReactionSubmitting = false,
    showInput = true,
    isChatSocketConnected = false,
  },
  ref,
) {
  const chatScrollRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'auto') => {
    scrollElementToBottom(chatScrollRef.current, behavior);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom,
    }),
    [scrollToBottom],
  );

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToBottom('auto');
      });
    });
  }, [scrollToBottom]);

  useEffect(() => {
    scrollToBottom('auto');
  }, [chatFeed, isChatSocketConnected, scrollToBottom]);

  return (
    <ChatPanel
      chatFeed={chatFeed}
      currentMemberId={currentMemberId}
      chatScrollRef={chatScrollRef}
      chatText={chatText}
      onChatTextChange={onChatTextChange}
      onSubmit={onSubmit}
      onReactionSelect={onReactionSelect}
      isReactionSubmitting={isReactionSubmitting}
      showInput={showInput}
      dedicatedLayout
    />
  );
});

export default ChatRoomPanel;
