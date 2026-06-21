import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoomHeader from '@/components/room/RoomHeader.jsx';
import PinnedSectionBar from '@/components/room/PinnedSectionBar.jsx';
import TodayCheckInBar from '@/components/room/TodayCheckInBar.jsx';
import RecitationCardExpanded from '@/components/recitation/RecitationCardExpanded.jsx';
import RecitationFullscreenViewer from '@/components/recitation/RecitationFullscreenViewer.jsx';
import FeedList from '@/components/feed/FeedList.jsx';
import ChatPanel from '@/components/chat/ChatPanel.jsx';
import CheckInMethodMenu from '@/components/room/CheckInMethodMenu.jsx';
import RoomFeedTabs from '@/components/room/RoomFeedTabs.jsx';
import InlineVoiceRecorder from '@/components/room/InlineVoiceRecorder.jsx';
import InlineCounterRecorder from '@/components/room/InlineCounterRecorder.jsx';
import AlertModal from '@/components/ui/AlertModal.jsx';
import ConfirmModal from '@/components/ui/ConfirmModal.jsx';
import SectionEditorModal from '@/components/ui/SectionEditorModal.jsx';
import { useAuth } from '@/hooks/useAuth.js';
import { getRoomDetail, getRoomMembers, leaveRoom } from '@/api/roomApi.js';
import { getSections, getTodayCheckIn, getCheckInFeed, createCounterCheckIn, createVoiceCheckIn, addAmen, cancelAmen, createSection, updateSection } from '@/api/recitationApi.js';
import {
  buildCreateSectionPayload,
  buildInitialTodayDashboard,
  buildTodayDashboardFromMembersAndFeed,
  buildUpdateSectionPayload,
  mapActiveSection,
  mapCheckInFeedToGroupedFeed,
  mapRoomDetail,
  mapRoomMembers,
  mergeTodayCheckInToDashboard,
} from '@/api/mappers/roomDetailMapper.js';
import { ApiError } from '@/api/apiClient.js';
import { getLocalDateString } from '@/utils/date.js';
import { getRoomChats, sendRoomChat } from '@/api/chatApi.js';
import { appendChatMessageToFeed, mapChatMessagesToFeed } from '@/api/mappers/chatMapper.js';
import { useRoomChatSocket } from '@/hooks/useRoomChatSocket.js';
import { useRoomEventsSocket } from '@/hooks/useRoomEventsSocket.js';
import './RoomDetailPage.css';

const FEED_TOP_REVEAL_THRESHOLD = 12;
const CERT_TOAST_SHOW_DELAY_MS = 100;
const CERT_TAB_SWITCH_DELAY_MS = 420;
const CERT_SCROLL_DELAY_MS = 600;
const CERT_TOAST_HIDE_DELAY_MS = 1150;
const ROOM_EVENT_REFRESH_DEBOUNCE_MS = 250;

export default function RoomDetailPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const numericRoomId = Number(roomId);
  const { member, refreshSession } = useAuth();

  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [todayDashboard, setTodayDashboard] = useState(null);
  const [section, setSection] = useState(null);
  const [feed, setFeed] = useState([]);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState(null);
  const [feedVersion, setFeedVersion] = useState(0);
  const [isRecitationExpanded, setIsRecitationExpanded] = useState(false);
  const [isFullscreenRecitationOpen, setIsFullscreenRecitationOpen] = useState(false);
  const [checkInMenuOpen, setCheckInMenuOpen] = useState(false);
  const [inlineMode, setInlineMode] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOldestHint, setShowOldestHint] = useState(false);
  const [activeTab, setActiveTab] = useState('certifications');
  const [chatFeed, setChatFeed] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [isChatSubmitting, setIsChatSubmitting] = useState(false);
  const [chatText, setChatText] = useState('');
  const [showCertificationSuccess, setShowCertificationSuccess] = useState(false);
  const [amenSubmittingCheckInId, setAmenSubmittingCheckInId] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isSectionSubmitting, setIsSectionSubmitting] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [sectionEditorOpen, setSectionEditorOpen] = useState(false);
  const [sectionEditorSessionKey, setSectionEditorSessionKey] = useState(0);
  const [alertModal, setAlertModal] = useState({ open: false, title: '안내', message: '' });
  const alertOnCloseRef = useRef(null);

  const isLeader = room?.myRole === 'LEADER';
  const memberCount = room?.memberCount ?? 0;

  const showAlert = useCallback((message, { title = '안내', onClose } = {}) => {
    alertOnCloseRef.current = onClose ?? null;
    setAlertModal({ open: true, title, message });
  }, []);

  const closeAlertModal = useCallback(() => {
    setAlertModal((prev) => ({ ...prev, open: false }));
    const callback = alertOnCloseRef.current;
    alertOnCloseRef.current = null;
    callback?.();
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadRoom() {
      if (!Number.isFinite(numericRoomId) || numericRoomId <= 0) {
        setRoom(null);
        setTodayDashboard(null);
        setSection(null);
        setRoomError('방을 찾을 수 없습니다.');
        setRoomLoading(false);
        return;
      }

      setRoomLoading(true);
      setRoomError(null);
      setSection(null);
      setFeed([]);

      const todayDate = getLocalDateString();
      const sectionsPromise = getSections(numericRoomId).catch(() => null);
      const todayCheckInPromise = getTodayCheckIn(numericRoomId).catch(() => null);
      const todayFeedPromise = getCheckInFeed(numericRoomId, todayDate).catch(() => null);

      try {
        const [apiRoom, apiMembers] = await Promise.all([
          getRoomDetail(numericRoomId),
          getRoomMembers(numericRoomId).catch(() => []),
        ]);

        if (ignore) return;

        const mappedRoom = mapRoomDetail(apiRoom);
        const mappedMembers = mapRoomMembers(apiMembers);
        const baseDashboard = buildInitialTodayDashboard({
          members: mappedMembers,
          memberCount: mappedRoom.memberCount,
        });

        setRoom(mappedRoom);
        setMembers(mappedMembers);

        const [apiSections, todayCheckIn, apiTodayFeed] = await Promise.all([
          sectionsPromise,
          todayCheckInPromise,
          todayFeedPromise,
        ]);

        if (!ignore) {
          setSection(mapActiveSection(apiSections ?? []));

          if (apiTodayFeed !== null) {
            setFeed(mapCheckInFeedToGroupedFeed(apiTodayFeed));
            setTodayDashboard(
              buildTodayDashboardFromMembersAndFeed({
                members: mappedMembers,
                memberCount: mappedRoom.memberCount,
                todayFeed: apiTodayFeed,
                todayCheckIn,
              }),
            );
          } else {
            setFeed([]);
            setTodayDashboard(mergeTodayCheckInToDashboard(baseDashboard, todayCheckIn));
          }
        }
      } catch (error) {
        if (ignore) return;

        if (error instanceof ApiError && error.isUnauthorized) {
          setRoom(null);
          setMembers([]);
          setTodayDashboard(null);
          setSection(null);
          setFeed([]);
          setRoomError(null);

          try {
            await refreshSession();
          } catch {
            // Non-401 refresh errors are stored on AuthProvider.
          }
          return;
        }

        setRoom(null);
        setMembers([]);
        setTodayDashboard(null);
        setSection(null);
        setFeed([]);

        if (error instanceof ApiError && error.isForbidden) {
          setRoomError(error.message || '해당 암송방에 접근할 수 없습니다.');
        } else if (error instanceof ApiError && error.status === 404) {
          setRoomError('방을 찾을 수 없습니다.');
        } else {
          setRoomError(
            error instanceof ApiError
              ? error.message
              : '방 정보를 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!ignore) {
          setRoomLoading(false);
        }
      }
    }

    loadRoom();

    return () => {
      ignore = true;
    };
  }, [numericRoomId, refreshSession]);

  const feedScrollRef = useRef(null);
  const chatScrollRef = useRef(null);
  const hasInitialScrolledRef = useRef(false);
  const scrollSmoothOnNextFeedRef = useRef(false);
  const certificationFlowTimeoutsRef = useRef([]);
  const sectionRefreshTimeoutRef = useRef(null);
  const checkInRefreshTimeoutRef = useRef(null);
  const roomRefreshTimeoutRef = useRef(null);
  const sectionRefreshInFlightRef = useRef(false);
  const checkInRefreshInFlightRef = useRef(false);
  const roomRefreshInFlightRef = useRef(false);

  const scrollToBottom = useCallback((ref, behavior = 'auto') => {
    const el = ref.current;
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
    });
  }, []);

  const scrollToFeedBottom = useCallback(
    (behavior = 'auto') => {
      scrollToBottom(feedScrollRef, behavior);
      setShowOldestHint(false);
    },
    [scrollToBottom],
  );

  const handleFeedScroll = useCallback(() => {
    const el = feedScrollRef.current;
    if (!el) return;
    setShowOldestHint(el.scrollTop <= FEED_TOP_REVEAL_THRESHOLD);
  }, []);

  const todayDashboardSafe = todayDashboard ?? {
    todayCompletedCount: 0,
    totalMemberCount: memberCount,
    myStatus: null,
    todayAmenCount: 0,
    completedMembers: [],
    pendingMembers: [],
  };

  const refreshSectionData = useCallback(async () => {
    try {
      const apiSections = await getSections(numericRoomId);
      setSection(mapActiveSection(apiSections ?? []));
    } catch {
      // Keep current section on failure.
    }
  }, [numericRoomId]);

  const refreshRoomData = useCallback(async () => {
    try {
      const [apiRoom, apiMembers] = await Promise.all([
        getRoomDetail(numericRoomId),
        getRoomMembers(numericRoomId).catch(() => []),
      ]);
      setRoom(mapRoomDetail(apiRoom));
      setMembers(mapRoomMembers(apiMembers));
    } catch {
      // Keep current room data on failure.
    }
  }, [numericRoomId]);

  const refreshCheckInData = useCallback(async () => {
    const todayDate = getLocalDateString();

    const [todayCheckIn, apiTodayFeed] = await Promise.all([
      getTodayCheckIn(numericRoomId).catch(() => null),
      getCheckInFeed(numericRoomId, todayDate).catch(() => null),
    ]);

    if (apiTodayFeed !== null) {
      setFeed(mapCheckInFeedToGroupedFeed(apiTodayFeed));
      setTodayDashboard(
        buildTodayDashboardFromMembersAndFeed({
          members,
          memberCount: room?.memberCount ?? 0,
          todayFeed: apiTodayFeed,
          todayCheckIn,
        }),
      );
    } else {
      setFeed([]);
      const baseDashboard = buildInitialTodayDashboard({
        members,
        memberCount: room?.memberCount ?? 0,
      });
      setTodayDashboard(mergeTodayCheckInToDashboard(baseDashboard, todayCheckIn));
    }

    setFeedVersion((v) => v + 1);
  }, [numericRoomId, members, room?.memberCount]);

  const refreshChatData = useCallback(async () => {
    if (!Number.isFinite(numericRoomId) || numericRoomId <= 0) {
      return;
    }

    setChatError(null);
    setIsChatLoading(true);

    try {
      const messages = await getRoomChats(numericRoomId);
      setChatFeed(mapChatMessagesToFeed(messages));
    } catch (error) {
      setChatFeed([]);
      setChatError(
        error instanceof ApiError
          ? error.message
          : '채팅을 불러오지 못했습니다.',
      );
    } finally {
      setIsChatLoading(false);
    }
  }, [numericRoomId]);

  useEffect(() => {
    if (!room || activeTab !== 'chat') {
      return undefined;
    }

    refreshChatData();

    return undefined;
  }, [room, activeTab, numericRoomId, refreshChatData]);

  const handleIncomingChatMessage = useCallback((message) => {
    setChatFeed((prevFeed) => appendChatMessageToFeed(prevFeed, message));
  }, []);

  const chatSocketEnabled = Boolean(room && activeTab === 'chat' && !isFullscreenRecitationOpen);
  const { isConnected: isChatSocketConnected, sendChatMessage: sendChatViaSocket } =
    useRoomChatSocket(numericRoomId, {
      enabled: chatSocketEnabled,
      onMessage: handleIncomingChatMessage,
    });

  const scheduleSectionRefresh = useCallback(() => {
    if (sectionRefreshTimeoutRef.current) {
      window.clearTimeout(sectionRefreshTimeoutRef.current);
    }
    sectionRefreshTimeoutRef.current = window.setTimeout(() => {
      if (sectionRefreshInFlightRef.current) {
        return;
      }
      sectionRefreshInFlightRef.current = true;
      refreshSectionData().finally(() => {
        sectionRefreshInFlightRef.current = false;
      });
    }, ROOM_EVENT_REFRESH_DEBOUNCE_MS);
  }, [refreshSectionData]);

  const scheduleCheckInRefresh = useCallback(() => {
    if (checkInRefreshTimeoutRef.current) {
      window.clearTimeout(checkInRefreshTimeoutRef.current);
    }
    checkInRefreshTimeoutRef.current = window.setTimeout(() => {
      if (checkInRefreshInFlightRef.current) {
        return;
      }
      checkInRefreshInFlightRef.current = true;
      refreshCheckInData().finally(() => {
        checkInRefreshInFlightRef.current = false;
      });
    }, ROOM_EVENT_REFRESH_DEBOUNCE_MS);
  }, [refreshCheckInData]);

  const scheduleRoomRefresh = useCallback(() => {
    if (roomRefreshTimeoutRef.current) {
      window.clearTimeout(roomRefreshTimeoutRef.current);
    }
    roomRefreshTimeoutRef.current = window.setTimeout(() => {
      if (roomRefreshInFlightRef.current) {
        return;
      }
      roomRefreshInFlightRef.current = true;
      refreshRoomData().finally(() => {
        roomRefreshInFlightRef.current = false;
      });
    }, ROOM_EVENT_REFRESH_DEBOUNCE_MS);
  }, [refreshRoomData]);

  const handleRoomEvent = useCallback(
    (event) => {
      if (!event || Number(event.roomId) !== numericRoomId) {
        return;
      }

      switch (event.type) {
        case 'SECTION_UPDATED':
          scheduleSectionRefresh();
          break;
        case 'CHECK_IN_CREATED':
        case 'CHECK_IN_UPDATED':
        case 'CHECK_IN_STATUS_UPDATED':
        case 'AMEN_UPDATED':
          scheduleCheckInRefresh();
          break;
        case 'ROOM_MEMBER_LEFT':
          scheduleRoomRefresh();
          break;
        case 'ROOM_CLOSED':
          showAlert('암송방이 종료되었습니다.', {
            onClose: () => navigate('/home'),
          });
          break;
        default:
          break;
      }
    },
    [numericRoomId, scheduleSectionRefresh, scheduleCheckInRefresh, scheduleRoomRefresh, navigate, showAlert],
  );

  const roomEventsSocketEnabled = Boolean(room && !isFullscreenRecitationOpen);
  useRoomEventsSocket(numericRoomId, {
    enabled: roomEventsSocketEnabled,
    onRoomEvent: handleRoomEvent,
  });

  const unreadChatCount = 0;

  const clearCertificationFlowTimeouts = useCallback(() => {
    certificationFlowTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    certificationFlowTimeoutsRef.current = [];
  }, []);

  const scheduleCertificationFlow = useCallback((callback, delayMs) => {
    const timeoutId = window.setTimeout(callback, delayMs);
    certificationFlowTimeoutsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const handleCertificationCompleted = useCallback(() => {
    clearCertificationFlowTimeouts();
    setShowCertificationSuccess(false);

    // 1) 패널 닫힌 뒤 완료 토스트를 먼저 표시
    scheduleCertificationFlow(() => {
      setShowCertificationSuccess(true);
    }, CERT_TOAST_SHOW_DELAY_MS);

    // 2) 토스트가 보인 뒤 암송 인증 탭으로 전환
    scheduleCertificationFlow(() => {
      setActiveTab('certifications');
    }, CERT_TAB_SWITCH_DELAY_MS);

    // 3) 탭 전환 후 피드 최하단으로 스크롤
    scheduleCertificationFlow(() => {
      scrollSmoothOnNextFeedRef.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToFeedBottom('smooth');
          scrollSmoothOnNextFeedRef.current = false;
        });
      });
    }, CERT_SCROLL_DELAY_MS);

    scheduleCertificationFlow(() => {
      setShowCertificationSuccess(false);
    }, CERT_TOAST_HIDE_DELAY_MS);
  }, [
    clearCertificationFlowTimeouts,
    scheduleCertificationFlow,
    scrollToFeedBottom,
  ]);

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

  const handleVoiceComplete = useCallback(
    async (audioFile) => {
      if (isSubmitting || !audioFile) return;

      setIsSubmitting(true);
      try {
        await createVoiceCheckIn(numericRoomId, audioFile);
        closeInlinePanel();
        await refreshCheckInData();
        handleCertificationCompleted();
      } catch {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      numericRoomId,
      closeInlinePanel,
      refreshCheckInData,
      handleCertificationCompleted,
    ],
  );

  const handleCounterComplete = useCallback(
    async (count) => {
      if (isSubmitting) return;

      setIsSubmitting(true);
      try {
        await createCounterCheckIn(numericRoomId, { counterCount: count });
        closeInlinePanel();
        await refreshCheckInData();
        handleCertificationCompleted();
      } catch {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      numericRoomId,
      closeInlinePanel,
      refreshCheckInData,
      handleCertificationCompleted,
    ],
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

  useEffect(
    () => () => {
      clearCertificationFlowTimeouts();
    },
    [clearCertificationFlowTimeouts],
  );

  useEffect(() => {
    if (isFullscreenRecitationOpen || activeTab !== 'certifications') return undefined;

    if (scrollSmoothOnNextFeedRef.current) {
      scrollSmoothOnNextFeedRef.current = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToFeedBottom('smooth');
        });
      });
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
  }, [feed, feedVersion, isFullscreenRecitationOpen, activeTab, scrollToFeedBottom]);

  useEffect(() => {
    if (activeTab !== 'chat' || isFullscreenRecitationOpen) return undefined;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToBottom(chatScrollRef, 'auto');
      });
    });

    return undefined;
  }, [activeTab, numericRoomId, isFullscreenRecitationOpen, scrollToBottom]);

  useEffect(() => {
    if (activeTab !== 'chat' || isFullscreenRecitationOpen) return undefined;

    requestAnimationFrame(() => {
      scrollToBottom(chatScrollRef, 'auto');
    });

    return undefined;
  }, [chatFeed, activeTab, isFullscreenRecitationOpen, scrollToBottom, isChatSocketConnected]);

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

  const handleAmenToggle = useCallback(
    async (card) => {
      const checkInId = card?.checkInId;
      if (!checkInId || amenSubmittingCheckInId === checkInId) {
        return;
      }

      const isAmenedByMe = card.isAmenedByMe === true || card.amenedByMe === true;

      setAmenSubmittingCheckInId(checkInId);
      try {
        if (isAmenedByMe) {
          await cancelAmen(checkInId);
        } else {
          await addAmen(checkInId);
        }
        await refreshCheckInData();
      } catch {
        // Keep current UI; next refresh can recover state.
      } finally {
        setAmenSubmittingCheckInId(null);
      }
    },
    [amenSubmittingCheckInId, refreshCheckInData],
  );

  const handleLeaveMenuClick = useCallback(() => {
    if (isLeaving || !room) {
      return;
    }

    const currentMemberCount = room.memberCount ?? members.length;

    if (isLeader && currentMemberCount > 1) {
      showAlert(
        '방장은 다른 멤버가 있을 때 방을 나갈 수 없습니다. 방장 위임 기능은 추후 제공됩니다.',
      );
      return;
    }

    setLeaveConfirmOpen(true);
  }, [isLeaving, room, members.length, isLeader, showAlert]);

  const handleConfirmLeave = useCallback(async () => {
    if (isLeaving) {
      return;
    }

    setIsLeaving(true);
    try {
      const result = await leaveRoom(numericRoomId);

      if (result?.left === true) {
        setLeaveConfirmOpen(false);
        navigate('/home', { replace: true });
        return;
      }

      showAlert('방 나가기에 실패했습니다.');
    } catch (error) {
      showAlert(
        error instanceof ApiError ? error.message || '방 나가기에 실패했습니다.' : '방 나가기에 실패했습니다.',
      );
    } finally {
      setIsLeaving(false);
    }
  }, [isLeaving, numericRoomId, navigate, showAlert]);

  const handleOpenSectionEditor = useCallback(() => {
    if (!isLeader || isSectionSubmitting) {
      return;
    }

    setSectionEditorSessionKey((key) => key + 1);
    setSectionEditorOpen(true);
  }, [isLeader, isSectionSubmitting]);

  const handleCloseSectionEditor = useCallback(() => {
    if (isSectionSubmitting) {
      return;
    }

    setSectionEditorOpen(false);
  }, [isSectionSubmitting]);

  const handleSectionModalSubmit = useCallback(
    async (sectionContent) => {
      if (isSectionSubmitting) {
        return;
      }

      setIsSectionSubmitting(true);
      try {
        if (section?.sectionId) {
          await updateSection(
            numericRoomId,
            section.sectionId,
            buildUpdateSectionPayload(section, sectionContent),
          );
        } else {
          await createSection(numericRoomId, buildCreateSectionPayload(sectionContent));
        }

        await refreshSectionData();
        setSectionEditorOpen(false);
      } catch (error) {
        showAlert(
          error instanceof ApiError
            ? error.message || '암송 본문 저장에 실패했습니다.'
            : '암송 본문 저장에 실패했습니다.',
        );
      } finally {
        setIsSectionSubmitting(false);
      }
    },
    [isSectionSubmitting, section, numericRoomId, refreshSectionData, showAlert],
  );

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

  const handleSendChatMessage = useCallback(
    async (event) => {
      event.preventDefault();
      const text = chatText.trim();
      if (!text || isChatSubmitting) return;

      setIsChatSubmitting(true);
      try {
        const sentViaSocket = isChatSocketConnected && sendChatViaSocket(text);
        if (sentViaSocket) {
          setChatText('');
          requestAnimationFrame(() => {
            scrollToBottom(chatScrollRef, 'smooth');
          });
          return;
        }

        await sendRoomChat(numericRoomId, text);
        setChatText('');
        await refreshChatData();

        requestAnimationFrame(() => {
          scrollToBottom(chatScrollRef, 'smooth');
        });
      } catch (error) {
        showAlert(
          error instanceof ApiError ? error.message || '메시지 전송에 실패했습니다.' : '메시지 전송에 실패했습니다.',
        );
      } finally {
        setIsChatSubmitting(false);
      }
    },
    [
      chatText,
      isChatSubmitting,
      numericRoomId,
      isChatSocketConnected,
      sendChatViaSocket,
      refreshChatData,
      scrollToBottom,
      showAlert,
    ],
  );

  const sectionEditorInitialContent = section?.recitationText ?? section?.sectionContent ?? '';
  const sectionEditorMode = section?.sectionId ? 'edit' : 'create';

  const showFooter = !inlineMode;
  const isInlineActive = Boolean(inlineMode);
  const showChatInput = activeTab === 'chat' && !inlineMode;
  const feedAreaClass = ['feed-area', 'scrollbar-soft', isInlineActive ? 'feed-area--panel-open' : '']
    .filter(Boolean)
    .join(' ');

  if (roomLoading) {
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
              <p>불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roomError) {
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
              <h1>{roomError}</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <p>불러오는 중...</p>
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
              todayCompletedCount={todayDashboardSafe.todayCompletedCount}
              onBack={() => navigate(-1)}
              onMoreClick={handleLeaveMenuClick}
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
                    onRegister={handleOpenSectionEditor}
                  />
                )}
                <TodayCheckInBar
                  completedMembers={todayDashboardSafe.completedMembers}
                  pendingMembers={todayDashboardSafe.pendingMembers}
                  todayCompletedCount={todayDashboardSafe.todayCompletedCount}
                  totalMemberCount={todayDashboardSafe.totalMemberCount}
                />
              </div>

              <RoomFeedTabs
                activeTab={activeTab}
                onChange={setActiveTab}
                unreadChatCount={unreadChatCount}
              />

              {activeTab === 'certifications' ? (
                <section
                  ref={feedScrollRef}
                  className={feedAreaClass}
                  aria-label="인증 피드"
                  role="tabpanel"
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
              ) : (
                <ChatPanel
                  chatFeed={chatFeed}
                  currentMemberId={member.memberId}
                  chatScrollRef={chatScrollRef}
                  chatText={chatText}
                  onChatTextChange={setChatText}
                  onSubmit={handleSendChatMessage}
                  showInput={showChatInput}
                  isInlineActive={isInlineActive}
                />
              )}
            </div>
          </>
        )}

        {isFullscreenRecitationOpen && (
          <RecitationFullscreenViewer
            section={section}
            isLeader={isLeader}
            onClose={handleCloseFullscreen}
            onRegister={handleOpenSectionEditor}
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
            hasCheckedInToday={todayDashboardSafe.myStatus === 'Y'}
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

        {showCertificationSuccess && (
          <div className="certification-success-overlay" role="status" aria-live="polite">
            <div className="certification-success-card">
              <div className="certification-success-icon" aria-hidden="true">
                ✓
              </div>
              <strong>인증 완료</strong>
              <span>{member.name}님은 복 있는 사람입니다.</span>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={leaveConfirmOpen}
          onClose={() => {
            if (!isLeaving) {
              setLeaveConfirmOpen(false);
            }
          }}
          onConfirm={handleConfirmLeave}
          title="방 나가기"
          message="방을 나가신 후에는 대화내용을 복원할 수 없습니다."
          description="정말로 나가시겠습니까?"
          confirmLabel="나가기"
          cancelLabel="취소"
          isConfirming={isLeaving}
          confirmTone="danger"
        />

        <SectionEditorModal
          key={sectionEditorSessionKey}
          isOpen={sectionEditorOpen}
          onClose={handleCloseSectionEditor}
          onSubmit={handleSectionModalSubmit}
          mode={sectionEditorMode}
          initialContent={sectionEditorInitialContent}
          isSubmitting={isSectionSubmitting}
        />

        <AlertModal
          isOpen={alertModal.open}
          onClose={closeAlertModal}
          title={alertModal.title}
          message={alertModal.message}
        />
      </div>
    </div>
  );
}
