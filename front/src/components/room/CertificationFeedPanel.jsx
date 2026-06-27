import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import FeedList from '@/components/feed/FeedList.jsx';

const FEED_TOP_REVEAL_THRESHOLD = 12;

function scrollElementToBottom(element, behavior = 'auto') {
  if (!element) return;

  requestAnimationFrame(() => {
    element.scrollTo({
      top: element.scrollHeight,
      behavior,
    });
  });
}

const CertificationFeedPanel = forwardRef(function CertificationFeedPanel(
  {
    feed,
    feedVersion,
    currentMemberId,
    roomId,
    onAmenToggle,
    onStartCheckIn,
    isInlineActive = false,
  },
  ref,
) {
  const feedScrollRef = useRef(null);
  const hasInitialScrolledRef = useRef(false);
  const [showOldestHint, setShowOldestHint] = useState(false);

  const scrollToBottom = useCallback((behavior = 'auto') => {
    scrollElementToBottom(feedScrollRef.current, behavior);
    setShowOldestHint(false);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom,
    }),
    [scrollToBottom],
  );

  const handleFeedScroll = useCallback(() => {
    const el = feedScrollRef.current;
    if (!el) return;
    setShowOldestHint(el.scrollTop <= FEED_TOP_REVEAL_THRESHOLD);
  }, []);

  useEffect(() => {
    hasInitialScrolledRef.current = false;
  }, [roomId]);

  useEffect(() => {
    if (!hasInitialScrolledRef.current) {
      hasInitialScrolledRef.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom('auto');
        });
      });
      return undefined;
    }

    return undefined;
  }, [feed, feedVersion, scrollToBottom]);

  const feedAreaClass = ['feed-area', 'scrollbar-soft', isInlineActive ? 'feed-area--panel-open' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <section
      ref={feedScrollRef}
      className={feedAreaClass}
      aria-label="인증 피드"
      role="tabpanel"
      onScroll={handleFeedScroll}
    >
      <FeedList
        feed={feed}
        currentMemberId={currentMemberId}
        roomId={roomId}
        onAmenToggle={onAmenToggle}
        onStartCheckIn={onStartCheckIn}
        variant="timeline"
        isInlineActive={isInlineActive}
        showOldestHint={showOldestHint}
      />
    </section>
  );
});

export default CertificationFeedPanel;
