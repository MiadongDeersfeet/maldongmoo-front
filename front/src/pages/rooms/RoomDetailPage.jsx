import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import RoomHeader from '@/components/room/RoomHeader.jsx';
import PinnedSectionBar from '@/components/room/PinnedSectionBar.jsx';
import TodayCheckInBar from '@/components/room/TodayCheckInBar.jsx';
import RecitationCardExpanded from '@/components/recitation/RecitationCardExpanded.jsx';
import RecitationFullscreenViewer from '@/components/recitation/RecitationFullscreenViewer.jsx';
import FeedList from '@/components/feed/FeedList.jsx';
import CheckInMethodMenu from '@/components/room/CheckInMethodMenu.jsx';
import InlineVoiceRecorder from '@/components/room/InlineVoiceRecorder.jsx';
import InlineCounterRecorder from '@/components/room/InlineCounterRecorder.jsx';
import { useAuth } from '@/hooks/useAuth.js';
import { useRoomRole } from '@/hooks/useRoomRole.js';
import {
  getRoomById,
  getActiveSection,
  getTodayRoomDashboard,
  getRoomFeed,
  getRoomMemberCount,
  toggleAmen,
  submitVoiceCheckIn,
  submitCounterCheckIn,
} from '@/mocks/index.js';
import './RoomDetailPage.css';

const FEED_TOP_REVEAL_THRESHOLD = 12;

export default function RoomDetailPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const numericRoomId = Number(roomId);
  const { member } = useAuth();
  const { isLeader } = useRoomRole(roomId, member?.memberId);

  const room = getRoomById(numericRoomId);
  const section = getActiveSection(numericRoomId);
  const memberCount = room ? getRoomMemberCount(numericRoomId) : 0;

  const [uiVersion, setUiVersion] = useState(0);
  const [feedVersion, setFeedVersion] = useState(0);
  const [isRecitationExpanded, setIsRecitationExpanded] = useState(false);
  const [isFullscreenRecitationOpen, setIsFullscreenRecitationOpen] = useState(false);
  const [checkInMenuOpen, setCheckInMenuOpen] = useState(false);
  const [inlineMode, setInlineMode] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOldestHint, setShowOldestHint] = useState(false);

  const feedScrollRef = useRef(null);
  const hasInitialScrolledRef = useRef(false);
  const scrollSmoothOnNextFeedRef = useRef(false);

  const scrollToFeedBottom = useCallback((behavior = 'auto') => {
    const el = feedScrollRef.current;
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
      setShowOldestHint(false);
    });
  }, []);

  const handleFeedScroll = useCallback(() => {
    const el = feedScrollRef.current;
    if (!el) return;
    setShowOldestHint(el.scrollTop <= FEED_TOP_REVEAL_THRESHOLD);
  }, []);

  const todayDashboard = useMemo(() => {
    void uiVersion;
    return getTodayRoomDashboard(numericRoomId, member.memberId);
  }, [numericRoomId, member.memberId, uiVersion]);

  const feed = useMemo(() => {
    void feedVersion;
    void location.key;
    return getRoomFeed(numericRoomId, member.memberId);
  }, [numericRoomId, member.memberId, feedVersion, location.key]);

  const refreshAfterCheckIn = useCallback(() => {
    setUiVersion((v) => v + 1);
    setFeedVersion((v) => v + 1);
  }, []);

  const closeInlinePanel = useCallback(() => {
    setInlineMode(null);
    setIsSubmitting(false);
  }, []);

  const handleSelectVoice = useCallback(() => {
    setCheckInMenuOpen(false);
    setInlineMode('voice');
  }, []);

  const handleSelectCounter = useCallback(() => {
    setCheckInMenuOpen(false);
    setInlineMode('counter');
  }, []);

  const handleVoiceComplete = useCallback(() => {
    setIsSubmitting(true);
    try {
      submitVoiceCheckIn(
        numericRoomId,
        member.memberId,
        `https://mock.storage/audio/${Date.now()}.mp3`,
      );
      closeInlinePanel();
      scrollSmoothOnNextFeedRef.current = true;
      refreshAfterCheckIn();
    } catch {
      setIsSubmitting(false);
    }
  }, [numericRoomId, member.memberId, closeInlinePanel, refreshAfterCheckIn]);

  const handleCounterComplete = useCallback(
    (count) => {
      setIsSubmitting(true);
      try {
        submitCounterCheckIn(numericRoomId, member.memberId, count);
        closeInlinePanel();
        scrollSmoothOnNextFeedRef.current = true;
        refreshAfterCheckIn();
      } catch {
        setIsSubmitting(false);
      }
    },
    [numericRoomId, member.memberId, closeInlinePanel, refreshAfterCheckIn],
  );

  const handleToggleRecitationExpand = useCallback(() => {
    setIsRecitationExpanded((prev) => !prev);
  }, []);

  const handleOpenFullscreen = useCallback(() => {
    setIsFullscreenRecitationOpen(true);
    setIsRecitationExpanded(false);
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreenRecitationOpen(false);
    if (scrollSmoothOnNextFeedRef.current) {
      requestAnimationFrame(() => {
        scrollToFeedBottom('smooth');
        scrollSmoothOnNextFeedRef.current = false;
      });
    }
  }, [scrollToFeedBottom]);

  useEffect(() => {
    hasInitialScrolledRef.current = false;
    scrollSmoothOnNextFeedRef.current = false;
  }, [numericRoomId]);

  useEffect(() => {
    if (isFullscreenRecitationOpen) return undefined;

    if (scrollSmoothOnNextFeedRef.current) {
      scrollSmoothOnNextFeedRef.current = false;
      scrollToFeedBottom('smooth');
      return undefined;
    }

    if (!hasInitialScrolledRef.current) {
      hasInitialScrolledRef.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToFeedBottom('auto');
        });
      });
    }

    return undefined;
  }, [feed, feedVersion, isFullscreenRecitationOpen, scrollToFeedBottom]);

  useEffect(() => {
    if (!inlineMode) return undefined;

    function handleKeyDown(e) {
      if (e.key === 'Escape' && !isSubmitting) {
        if (isFullscreenRecitationOpen) {
          closeInlinePanel();
          return;
        }
        closeInlinePanel();
        setCheckInMenuOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inlineMode, isSubmitting, closeInlinePanel, isFullscreenRecitationOpen]);

  useEffect(() => {
    if (!isFullscreenRecitationOpen) return undefined;

    function handleKeyDown(e) {
      if (e.key === 'Escape' && !inlineMode) {
        setIsFullscreenRecitationOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenRecitationOpen, inlineMode]);

  const handleAmenToggle = (checkInId) => {
    try {
      toggleAmen(checkInId, member.memberId);
      setFeedVersion((v) => v + 1);
    } catch {
      // 본인 카드 등 불가 케이스
    }
  };

  const handleRegisterSection = () => {
    // 방장 본문 등록 UI — 추후 구현
  };

  const handleSectionFooterClick = useCallback(() => {
    setIsRecitationExpanded((prev) => !prev);
  }, []);

  const handleShareInvite = useCallback(async () => {
    if (!room?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(room.inviteCode);
    } catch {
      // clipboard unavailable
    }
  }, [room]);

  const handleStartCheckIn = useCallback(() => {
    setCheckInMenuOpen(true);
  }, []);

  const showFooter = !inlineMode;
  const isInlineActive = Boolean(inlineMode);
  const feedAreaClass = ['feed-area', 'scrollbar-soft', isInlineActive ? 'feed-area--panel-open' : '']
    .filter(Boolean)
    .join(' ');

  if (!room) {
    return (
      <div className="app-page">
        <div className="app-shell room-detail-shell">
          <RoomHeader
            roomName="암송방"
            memberCount={0}
            todayCompletedCount={0}
            onBack={() => navigate(-1)}
          />
          <div className="room-detail-body">
            <div className="page-placeholder">
              <h1>방을 찾을 수 없습니다</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="app-shell room-detail-shell">
        {!isFullscreenRecitationOpen && (
          <>
            <RoomHeader
              roomName={room.roomName}
              memberCount={memberCount}
              todayCompletedCount={todayDashboard.todayCompletedCount}
              onBack={() => navigate(-1)}
            />

            <div className="room-detail-body">
              <div className="room-detail-toolbar">
                {!isRecitationExpanded ? (
                  <PinnedSectionBar
                    section={section}
                    onToggleExpand={handleToggleRecitationExpand}
                  />
                ) : (
                  <RecitationCardExpanded
                    section={section}
                    isLeader={isLeader}
                    onCollapse={() => setIsRecitationExpanded(false)}
                    onOpenFullscreen={handleOpenFullscreen}
                    onRegister={handleRegisterSection}
                  />
                )}
                <TodayCheckInBar
                  completedMembers={todayDashboard.completedMembers}
                  pendingMembers={todayDashboard.pendingMembers}
                  todayCompletedCount={todayDashboard.todayCompletedCount}
                  totalMemberCount={todayDashboard.totalMemberCount}
                />
              </div>

              <section
                ref={feedScrollRef}
                className={feedAreaClass}
                aria-label="인증 피드"
                onScroll={handleFeedScroll}
              >
                <FeedList
                  feed={feed}
                  currentMemberId={member.memberId}
                  roomId={numericRoomId}
                  onAmenToggle={handleAmenToggle}
                  onStartCheckIn={handleStartCheckIn}
                  variant="timeline"
                  isInlineActive={isInlineActive}
                  showOldestHint={showOldestHint}
                />
              </section>
            </div>
          </>
        )}

        {isFullscreenRecitationOpen && (
          <RecitationFullscreenViewer
            section={section}
            isLeader={isLeader}
            onClose={handleCloseFullscreen}
            onRegister={handleRegisterSection}
            isInlineActive={isInlineActive}
          />
        )}

        {showFooter && (
          <CheckInMethodMenu
            isOpen={checkInMenuOpen}
            onToggle={() => setCheckInMenuOpen((prev) => !prev)}
            onSelectVoice={handleSelectVoice}
            onSelectCounter={handleSelectCounter}
            onSectionClick={handleSectionFooterClick}
            onShareClick={handleShareInvite}
            showShare={isLeader}
            hasCheckedInToday={todayDashboard.myStatus === 'Y'}
            isSectionActive={isRecitationExpanded}
          />
        )}

        {inlineMode === 'voice' && (
          <InlineVoiceRecorder
            onCancel={closeInlinePanel}
            onComplete={handleVoiceComplete}
            isSubmitting={isSubmitting}
          />
        )}

        {inlineMode === 'counter' && (
          <InlineCounterRecorder
            onCancel={closeInlinePanel}
            onComplete={handleCounterComplete}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
