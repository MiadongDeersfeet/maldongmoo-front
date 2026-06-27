import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoomHeader from '@/components/room/RoomHeader.jsx';
import RecitationFullscreenViewer from '@/components/recitation/RecitationFullscreenViewer.jsx';
import CheckInMethodMenu from '@/components/room/CheckInMethodMenu.jsx';
import RoomFeedTabs from '@/components/room/RoomFeedTabs.jsx';
import RoomDetailShell from '@/components/room/RoomDetailShell.jsx';
import RoomDetailToolbar from '@/components/room/RoomDetailToolbar.jsx';
import CertificationFeedPanel from '@/components/room/CertificationFeedPanel.jsx';
import ChatRoomPanel from '@/components/room/ChatRoomPanel.jsx';
import RoomMembersPanel from '@/components/room/RoomMembersPanel.jsx';
import InlineVoiceRecorder from '@/components/room/InlineVoiceRecorder.jsx';
import InlineCounterRecorder from '@/components/room/InlineCounterRecorder.jsx';
import AlertModal from '@/components/ui/AlertModal.jsx';
import ComingSoonModal from '@/components/ui/ComingSoonModal.jsx';
import ConfirmModal from '@/components/ui/ConfirmModal.jsx';
import FadeToast from '@/components/ui/FadeToast.jsx';
import SectionEditorModal from '@/components/ui/SectionEditorModal.jsx';
import { useAuth } from '@/hooks/useAuth.js';
import { getRoomDetail, getRoomMembers, leaveRoom, kickRoomMember, encourageRoomMember } from '@/api/roomApi.js';
import { getSections, getTodayCheckIn, getCheckInFeed, createCounterCheckIn, createVoiceCheckIn, addAmen, cancelAmen, createSection, updateSection, getUnreadCheckInCount, markCheckInAsRead } from '@/api/recitationApi.js';
import {
  buildCreateSectionPayload,
  buildTodayDashboardFromMembersAndFeed,
  buildUpdateSectionPayload,
  getLatestCheckInDetailId,
  mapActiveSection,
  mapCheckInFeedToGroupedFeed,
  mapRoomDetail,
  mapRoomMembers,
} from '@/api/mappers/roomDetailMapper.js';
import { ApiError } from '@/api/apiClient.js';
import { getLocalDateString } from '@/utils/date.js';
import { getRoomChats, sendRoomChat, markChatAsRead, getUnreadChatCount, upsertChatReaction } from '@/api/chatApi.js';
import {
  appendChatMessageToFeed,
  getLatestChatMessageId,
  mapChatMessagesToFeed,
  updateChatReactionOnFeed,
} from '@/api/mappers/chatMapper.js';
import { useRoomChatSocket } from '@/hooks/useRoomChatSocket.js';
import { useRoomEventsSocket } from '@/hooks/useRoomEventsSocket.js';
import { scheduleHorizontalViewportScrollReset } from '@/utils/viewportScrollReset.js';

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
  const [activeTab, setActiveTab] = useState('certifications');
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadCertificationCount, setUnreadCertificationCount] = useState(0);
  const [chatFeed, setChatFeed] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [isChatSubmitting, setIsChatSubmitting] = useState(false);
  const [isChatReactionSubmitting, setIsChatReactionSubmitting] = useState(false);
  const [chatText, setChatText] = useState('');
  const [showCertificationSuccess, setShowCertificationSuccess] = useState(false);
  const [amenSubmittingCheckInId, setAmenSubmittingCheckInId] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isSectionSubmitting, setIsSectionSubmitting] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [membersPanelOpen, setMembersPanelOpen] = useState(false);
  const [kickTarget, setKickTarget] = useState(null);
  const [isKicking, setIsKicking] = useState(false);
  const [isMemberActionSubmitting, setIsMemberActionSubmitting] = useState(false);
  const [sectionEditorOpen, setSectionEditorOpen] = useState(false);
  const [sectionEditorSessionKey, setSectionEditorSessionKey] = useState(0);
  const [alertModal, setAlertModal] = useState({ open: false, title: '안내', message: '' });
  const [comingSoonModal, setComingSoonModal] = useState({
    open: false,
    featureName: '',
    description: '',
  });
  const [inviteCopyToast, setInviteCopyToast] = useState(null);
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
      setUnreadChatCount(0);
      setUnreadCertificationCount(0);

      const todayDate = getLocalDateString();
      const sectionsPromise = getSections(numericRoomId).catch(() => null);
      const todayCheckInPromise = getTodayCheckIn(numericRoomId).catch(() => null);
      const todayFeedPromise = getCheckInFeed(numericRoomId, todayDate);

      try {
        const [apiRoom, apiMembers] = await Promise.all([
          getRoomDetail(numericRoomId),
          getRoomMembers(numericRoomId).catch(() => []),
        ]);

        if (ignore) return;

        const mappedRoom = mapRoomDetail(apiRoom);
        const mappedMembers = mapRoomMembers(apiMembers);

        setRoom(mappedRoom);
        setMembers(mappedMembers);

        const [apiSections, todayCheckIn, apiTodayFeed] = await Promise.all([
          sectionsPromise,
          todayCheckInPromise,
          todayFeedPromise,
        ]);

        if (!ignore) {
          setSection(mapActiveSection(apiSections ?? []));
          setFeed(mapCheckInFeedToGroupedFeed(apiTodayFeed ?? []));
          setTodayDashboard(
            buildTodayDashboardFromMembersAndFeed({
              members: mappedMembers,
              memberCount: mappedRoom.memberCount,
              todayFeed: apiTodayFeed ?? [],
              todayCheckIn,
            }),
          );
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

  const certFeedPanelRef = useRef(null);
  const certificationFlowTimeoutsRef = useRef([]);
  const sectionRefreshTimeoutRef = useRef(null);
  const checkInRefreshTimeoutRef = useRef(null);
  const roomRefreshTimeoutRef = useRef(null);
  const sectionRefreshInFlightRef = useRef(false);
  const checkInRefreshInFlightRef = useRef(false);
  const lastMarkedChatIdRef = useRef(null);
  const lastMarkedCheckInDetailIdRef = useRef(null);
  const roomRefreshInFlightRef = useRef(false);
  const activeTabRef = useRef(activeTab);
  const currentMemberIdRef = useRef(member?.memberId ?? null);

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

    try {
      const [todayCheckIn, apiTodayFeed] = await Promise.all([
        getTodayCheckIn(numericRoomId).catch(() => null),
        getCheckInFeed(numericRoomId, todayDate),
      ]);

      setFeed(mapCheckInFeedToGroupedFeed(apiTodayFeed ?? []));
      setTodayDashboard(
        buildTodayDashboardFromMembersAndFeed({
          members,
          memberCount: room?.memberCount ?? 0,
          todayFeed: apiTodayFeed ?? [],
          todayCheckIn,
        }),
      );
    } catch {
      // Keep current feed on failure.
    }

    setFeedVersion((v) => v + 1);
  }, [numericRoomId, members, room?.memberCount]);

  const refreshUnreadCounts = useCallback(async ({ skipChat = false, skipCert = false } = {}) => {
    if (!Number.isFinite(numericRoomId) || numericRoomId <= 0) {
      return;
    }

    try {
      const [chatResult, certResult] = await Promise.all([
        skipChat
          ? Promise.resolve({ unreadCount: 0 })
          : getUnreadChatCount(numericRoomId).catch(() => ({ unreadCount: 0 })),
        skipCert
          ? Promise.resolve({ unreadCount: 0 })
          : getUnreadCheckInCount(numericRoomId).catch(() => ({ unreadCount: 0 })),
      ]);

      if (!skipChat) {
        setUnreadChatCount(chatResult.unreadCount ?? 0);
      }
      if (!skipCert) {
        setUnreadCertificationCount(certResult.unreadCount ?? 0);
      }
    } catch {
      // Keep current badge counts on failure.
    }
  }, [numericRoomId]);

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

  useEffect(() => {
    lastMarkedChatIdRef.current = null;
    lastMarkedCheckInDetailIdRef.current = null;
  }, [numericRoomId]);

  useEffect(() => {
    if (!room || roomLoading) {
      return undefined;
    }

    refreshUnreadCounts({
      skipChat: activeTab === 'chat',
      skipCert: activeTab === 'certifications',
    });

    return undefined;
  }, [room, roomLoading, numericRoomId, activeTab, refreshUnreadCounts]);

  useEffect(() => {
    if (activeTab !== 'chat' || isChatLoading) {
      return undefined;
    }

    const latestMessageId = getLatestChatMessageId(chatFeed);
    if (!latestMessageId || lastMarkedChatIdRef.current === latestMessageId) {
      return undefined;
    }

    lastMarkedChatIdRef.current = latestMessageId;
    markChatAsRead(numericRoomId, latestMessageId).catch(() => {
      lastMarkedChatIdRef.current = null;
    });
    setUnreadChatCount(0);

    return undefined;
  }, [activeTab, chatFeed, isChatLoading, numericRoomId]);

  useEffect(() => {
    if (activeTab !== 'certifications' || roomLoading) {
      return undefined;
    }

    const latestDetailId = getLatestCheckInDetailId(feed);
    if (!latestDetailId || lastMarkedCheckInDetailIdRef.current === latestDetailId) {
      return undefined;
    }

    lastMarkedCheckInDetailIdRef.current = latestDetailId;
    markCheckInAsRead(numericRoomId, latestDetailId)
      .then(() => {
        setUnreadCertificationCount(0);
      })
      .catch(() => {
        lastMarkedCheckInDetailIdRef.current = null;
      });

    return undefined;
  }, [activeTab, feed, roomLoading, numericRoomId]);

  const handleIncomingChatMessage = useCallback((message) => {
    const senderMemberId = Number(message?.memberId);
    const isOwnMessage = senderMemberId === currentMemberIdRef.current;

    if (activeTabRef.current === 'chat') {
      setChatFeed((prevFeed) => appendChatMessageToFeed(prevFeed, message));
      return;
    }

    if (!isOwnMessage && Number.isFinite(senderMemberId)) {
      setUnreadChatCount((count) => count + 1);
    }
  }, []);

  const handleIncomingChatReaction = useCallback((payload) => {
    if (activeTabRef.current !== 'chat') {
      return;
    }

    setChatFeed((prevFeed) => updateChatReactionOnFeed(prevFeed, payload));
  }, []);

  const chatSocketEnabled = Boolean(room && !isFullscreenRecitationOpen);
  const { isConnected: isChatSocketConnected, sendChatMessage: sendChatViaSocket } =
    useRoomChatSocket(numericRoomId, {
      enabled: chatSocketEnabled,
      onMessage: handleIncomingChatMessage,
      onReaction: handleIncomingChatReaction,
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
          if (
            activeTabRef.current !== 'certifications'
            && Number(event.memberId) !== currentMemberIdRef.current
          ) {
            setUnreadCertificationCount((count) => count + 1);
          }
          scheduleCheckInRefresh();
          break;
        case 'CHECK_IN_STATUS_UPDATED':
        case 'AMEN_UPDATED':
          scheduleCheckInRefresh();
          break;
        case 'CHAT_READ_UPDATED':
          if (activeTabRef.current === 'chat') {
            refreshChatData();
          }
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
    [numericRoomId, scheduleSectionRefresh, scheduleCheckInRefresh, scheduleRoomRefresh, navigate, showAlert, refreshChatData],
  );

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    currentMemberIdRef.current = member?.memberId ?? null;
  }, [member?.memberId]);

  const roomEventsSocketEnabled = Boolean(room && !isFullscreenRecitationOpen);
  useRoomEventsSocket(numericRoomId, {
    enabled: roomEventsSocketEnabled,
    onRoomEvent: handleRoomEvent,
  });

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
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          certFeedPanelRef.current?.scrollToBottom('smooth');
        });
      });
    }, CERT_SCROLL_DELAY_MS);

    scheduleCertificationFlow(() => {
      setShowCertificationSuccess(false);
    }, CERT_TOAST_HIDE_DELAY_MS);
  }, [
    clearCertificationFlowTimeouts,
    scheduleCertificationFlow,
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
      } catch (error) {
        setIsSubmitting(false);
        showAlert(
          error instanceof ApiError
            ? error.message
            : '음성 인증 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        );
      }
    },
    [
      isSubmitting,
      numericRoomId,
      closeInlinePanel,
      refreshCheckInData,
      handleCertificationCompleted,
      showAlert,
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
      } catch (error) {
        setIsSubmitting(false);
        showAlert(
          error instanceof ApiError
            ? error.message
            : '계수기 인증 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        );
      }
    },
    [
      isSubmitting,
      numericRoomId,
      closeInlinePanel,
      refreshCheckInData,
      handleCertificationCompleted,
      showAlert,
    ],
  );

  const handleToggleRecitation = useCallback(() => {
    if (activeTab === 'chat') {
      setIsFullscreenRecitationOpen(true);
      return;
    }
    setIsRecitationExpanded((prev) => !prev);
  }, [activeTab]);

  const handleOpenFullscreen = useCallback(() => {
    setIsFullscreenRecitationOpen(true);
    setIsRecitationExpanded(false);
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreenRecitationOpen(false);
  }, []);

  useEffect(
    () => () => {
      clearCertificationFlowTimeouts();
    },
    [clearCertificationFlowTimeouts],
  );

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
    scheduleHorizontalViewportScrollReset();
  }, [isSectionSubmitting]);

  const handleSectionModalSubmit = useCallback(
    async (payload) => {
      if (isSectionSubmitting) {
        return;
      }

      setIsSectionSubmitting(true);
      try {
        if (section?.sectionId) {
          await updateSection(
            numericRoomId,
            section.sectionId,
            buildUpdateSectionPayload(section, payload),
          );
        } else {
          await createSection(numericRoomId, buildCreateSectionPayload(payload));
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
    setMembersPanelOpen(false);
    setIsRecitationExpanded((prev) => !prev);
  }, []);

  const handleOpenMembersPanel = useCallback(() => {
    setCheckInMenuOpen(false);
    setIsRecitationExpanded(false);
    setMembersPanelOpen(true);
  }, []);

  const handleCloseMembersPanel = useCallback(() => {
    setMembersPanelOpen(false);
  }, []);

  const handleEncourageMember = useCallback(
    async (targetMember) => {
      if (isMemberActionSubmitting || !targetMember?.memberId) {
        return;
      }

      setIsMemberActionSubmitting(true);
      try {
        await encourageRoomMember(numericRoomId, targetMember.memberId);
        showAlert(`${targetMember.name}님에게 격려 알림을 보냈어요.`);
      } catch (error) {
        showAlert(
          error instanceof ApiError
            ? error.message || '격려 알림 전송에 실패했습니다.'
            : '격려 알림 전송에 실패했습니다.',
        );
      } finally {
        setIsMemberActionSubmitting(false);
      }
    },
    [isMemberActionSubmitting, numericRoomId, showAlert],
  );

  const handleKickMemberRequest = useCallback((targetMember) => {
    if (!targetMember?.memberId) {
      return;
    }
    setKickTarget(targetMember);
  }, []);

  const handleConfirmKickMember = useCallback(async () => {
    if (isKicking || !kickTarget?.memberId) {
      return;
    }

    setIsKicking(true);
    try {
      await kickRoomMember(numericRoomId, kickTarget.memberId);
      await refreshRoomData();
      await refreshCheckInData();
      setKickTarget(null);
      showAlert(`${kickTarget.name}님을 내보냈어요.`);
    } catch (error) {
      showAlert(
        error instanceof ApiError
          ? error.message || '멤버 내보내기에 실패했습니다.'
          : '멤버 내보내기에 실패했습니다.',
      );
    } finally {
      setIsKicking(false);
    }
  }, [isKicking, kickTarget, numericRoomId, refreshRoomData, refreshCheckInData, showAlert]);

  const handleOpenStatsComingSoon = useCallback(() => {
    setCheckInMenuOpen(false);
    setComingSoonModal({
      open: true,
      featureName: '암송 기록',
      description: '함께한 암송 기록과 통계를 한눈에 볼 수 있는 기능을 준비하고 있어요.',
    });
  }, []);

  const handleCloseComingSoonModal = useCallback(() => {
    setComingSoonModal((prev) => ({ ...prev, open: false }));
  }, []);

  const handleShareInvite = useCallback(async () => {
    if (!room?.inviteCode) return;

    try {
      await navigator.clipboard.writeText(room.inviteCode);
      setInviteCopyToast({ id: Date.now() });
    } catch {
      showAlert('초대코드를 복사하지 못했습니다.');
    }
  }, [room, showAlert]);

  const handleStartCheckIn = useCallback(() => {
    setCheckInMenuOpen(true);
  }, []);

  const handleChatReaction = useCallback(
    async (messageId, reactionType) => {
      if (isChatReactionSubmitting || !Number.isFinite(numericRoomId) || numericRoomId <= 0) {
        return;
      }

      setIsChatReactionSubmitting(true);
      try {
        const result = await upsertChatReaction(numericRoomId, messageId, reactionType);
        setChatFeed((prevFeed) => updateChatReactionOnFeed(prevFeed, result));
      } catch (error) {
        showAlert(
          error instanceof ApiError
            ? error.message || '반응을 저장하지 못했습니다.'
            : '반응을 저장하지 못했습니다.',
        );
      } finally {
        setIsChatReactionSubmitting(false);
      }
    },
    [isChatReactionSubmitting, numericRoomId, showAlert],
  );

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
          return;
        }

        await sendRoomChat(numericRoomId, text);
        setChatText('');
        await refreshChatData();
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
      showAlert,
    ],
  );

  const sectionEditorInitialContent = section?.recitationText ?? section?.sectionContent ?? '';
  const sectionEditorMode = section?.sectionId ? 'edit' : 'create';

  const showFooter = !inlineMode && activeTab !== 'chat' && !membersPanelOpen;
  const isInlineActive = Boolean(inlineMode);
  const showChatInput = activeTab === 'chat' && !inlineMode;
  const allowInlineRecitationExpand = activeTab === 'certifications';

  const handleFeedTabChange = useCallback((tab) => {
    if (tab === 'chat') {
      setCheckInMenuOpen(false);
      setMembersPanelOpen(false);
      setUnreadChatCount(0);
      setIsRecitationExpanded(false);
    }
    setActiveTab(tab);
  }, []);

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
          <RoomDetailShell
            header={(
              <RoomHeader
                roomName={room.roomName}
                memberCount={memberCount}
                todayCompletedCount={todayDashboardSafe.todayCompletedCount}
                onBack={() => navigate(-1)}
                onMoreClick={handleLeaveMenuClick}
              />
            )}
            toolbar={(
              <RoomDetailToolbar
                section={section}
                isLeader={isLeader}
                isRecitationExpanded={isRecitationExpanded}
                allowInlineRecitationExpand={allowInlineRecitationExpand}
                showCheckInStatus={allowInlineRecitationExpand}
                onToggleRecitation={handleToggleRecitation}
                onCollapseRecitation={() => setIsRecitationExpanded(false)}
                onOpenRecitationFullscreen={handleOpenFullscreen}
                onOpenSectionEditor={handleOpenSectionEditor}
                completedMembers={todayDashboardSafe.completedMembers}
                pendingMembers={todayDashboardSafe.pendingMembers}
                todayCompletedCount={todayDashboardSafe.todayCompletedCount}
                totalMemberCount={todayDashboardSafe.totalMemberCount}
              />
            )}
            tabs={(
              <RoomFeedTabs
                activeTab={activeTab}
                onChange={handleFeedTabChange}
                unreadChatCount={unreadChatCount}
                unreadCertificationCount={unreadCertificationCount}
              />
            )}
          >
            {activeTab === 'certifications' ? (
              <CertificationFeedPanel
                ref={certFeedPanelRef}
                feed={feed}
                feedVersion={feedVersion}
                currentMemberId={member.memberId}
                roomId={numericRoomId}
                onAmenToggle={handleAmenToggle}
                onStartCheckIn={handleStartCheckIn}
                isInlineActive={isInlineActive}
              />
            ) : (
              <ChatRoomPanel
                chatFeed={chatFeed}
                currentMemberId={member.memberId}
                chatText={chatText}
                onChatTextChange={setChatText}
                onSubmit={handleSendChatMessage}
                onReactionSelect={handleChatReaction}
                isReactionSubmitting={isChatReactionSubmitting}
                showInput={showChatInput}
              />
            )}
          </RoomDetailShell>
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
            onMembersClick={handleOpenMembersPanel}
            onStatsClick={handleOpenStatsComingSoon}
            onShareClick={handleShareInvite}
            showShare={isLeader}
            hasCheckedInToday={todayDashboardSafe.myStatus === 'Y'}
            isSectionActive={isRecitationExpanded}
            isMembersActive={membersPanelOpen}
          />
        )}

        {membersPanelOpen && (
          <RoomMembersPanel
            members={members}
            currentMemberId={member.memberId}
            isLeader={isLeader}
            onClose={handleCloseMembersPanel}
            onEncourage={handleEncourageMember}
            onKick={handleKickMemberRequest}
            disabled={isMemberActionSubmitting || isKicking}
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

        {inviteCopyToast && (
          <FadeToast
            key={inviteCopyToast.id}
            message="초대코드가 복사되었습니다."
            nowrap
            onDone={() => setInviteCopyToast(null)}
          />
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

        <ConfirmModal
          isOpen={Boolean(kickTarget)}
          onClose={() => {
            if (!isKicking) {
              setKickTarget(null);
            }
          }}
          onConfirm={handleConfirmKickMember}
          title="내보내기"
          message={`${kickTarget?.name ?? '해당 멤버'}님을 방에서 내보내시겠습니까?`}
          description="정말로 내보내시겠습니까?"
          confirmLabel="내보내기"
          cancelLabel="취소"
          isConfirming={isKicking}
          confirmTone="danger"
        />

        <SectionEditorModal
          key={sectionEditorSessionKey}
          isOpen={sectionEditorOpen}
          onClose={handleCloseSectionEditor}
          onSubmit={handleSectionModalSubmit}
          mode={sectionEditorMode}
          initialContent={sectionEditorInitialContent}
          initialTitle={section?.sectionTitle ?? ''}
          initialRange={section?.sectionRange ?? section?.weeklyRange ?? ''}
          isSubmitting={isSectionSubmitting}
        />

        <AlertModal
          isOpen={alertModal.open}
          onClose={closeAlertModal}
          title={alertModal.title}
          message={alertModal.message}
        />

        <ComingSoonModal
          isOpen={comingSoonModal.open}
          onClose={handleCloseComingSoonModal}
          featureName={comingSoonModal.featureName}
          description={comingSoonModal.description}
        />
      </div>
    </div>
  );
}
