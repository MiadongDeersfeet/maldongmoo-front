import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import RoomHeader from '@/components/room/RoomHeader.jsx';
import RoomFeedTabs from '@/components/room/RoomFeedTabs.jsx';
import ChatPanel from '@/components/chat/ChatPanel.jsx';
import { mapChatMessagesToFeed, appendChatMessageToFeed } from '@/api/mappers/chatMapper.js';
import '@/pages/rooms/RoomDetailPage.css';
import './RoomNotificationPreviewPage.css';

const CURRENT_MEMBER_ID = 1;
const OTHER_MEMBER = { memberId: 2, memberName: '은혜', profileImg: null };

const INITIAL_RAW_MESSAGES = [
  {
    messageId: 101,
    roomId: 99,
    memberId: OTHER_MEMBER.memberId,
    memberName: OTHER_MEMBER.memberName,
    messageText: '오늘도 함께 암송해요!',
    createdAt: '2026-06-13 12:11:00',
    isDeleted: 'N',
  },
  {
    messageId: 102,
    roomId: 99,
    memberId: CURRENT_MEMBER_ID,
    memberName: '나',
    messageText: '네, 저녁에 봬요',
    createdAt: '2026-06-13 12:15:00',
    isDeleted: 'N',
    unreadCount: 0,
  },
  {
    messageId: 103,
    roomId: 99,
    memberId: CURRENT_MEMBER_ID,
    memberName: '나',
    messageText: '난 카페얌 컴퓨터중',
    createdAt: '2026-06-13 14:44:00',
    isDeleted: 'N',
    unreadCount: 2,
  },
];

function nowTimestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export default function RoomNotificationPreviewPage() {
  const [activeTab, setActiveTab] = useState('certifications');
  const [unreadChatCount, setUnreadChatCount] = useState(3);
  const [unreadCertificationCount, setUnreadCertificationCount] = useState(2);
  const [chatFeed, setChatFeed] = useState(() => mapChatMessagesToFeed(INITIAL_RAW_MESSAGES));
  const [isSimulating, setIsSimulating] = useState(false);
  const [nextMessageId, setNextMessageId] = useState(200);
  const chatScrollRef = useRef(null);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === 'chat') {
      setUnreadChatCount(0);
    }
    if (tab === 'certifications') {
      setUnreadCertificationCount(0);
    }
  }, []);

  const simulateIncomingChat = useCallback(() => {
    const messageId = nextMessageId;
    setNextMessageId((prev) => prev + 1);

    const incoming = {
      messageId,
      roomId: 99,
      memberId: OTHER_MEMBER.memberId,
      memberName: OTHER_MEMBER.memberName,
      messageText: `새 채팅 ${messageId - 199}번째 도착`,
      createdAt: nowTimestamp(),
      isDeleted: 'N',
    };

    setChatFeed((prev) => appendChatMessageToFeed(prev, incoming));

    if (activeTab !== 'chat') {
      setUnreadChatCount((prev) => prev + 1);
    }
  }, [activeTab, nextMessageId]);

  const simulateIncomingCertification = useCallback(() => {
    if (activeTab !== 'certifications') {
      setUnreadCertificationCount((prev) => prev + 1);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isSimulating) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (Math.random() > 0.5) {
        simulateIncomingChat();
      } else {
        simulateIncomingCertification();
      }
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [isSimulating, simulateIncomingChat, simulateIncomingCertification]);

  return (
    <div className="room-notification-preview">
      <aside className="room-notification-preview__controls">
        <p className="room-notification-preview__eyebrow">UI MOCK · 로컬 전용</p>
        <h1>탭 N 배지 &amp; 채팅 미읽음 미리보기</h1>
        <p className="room-notification-preview__desc">
          2계정 없이 실시간 알림 UI를 확인합니다. 탭을 열면 해당 N은 0으로 초기화됩니다.
        </p>

        <div className="room-notification-preview__button-group">
          <button type="button" onClick={simulateIncomingChat}>
            새 채팅 도착 (+1)
          </button>
          <button type="button" onClick={simulateIncomingCertification}>
            새 암송 인증 (+1)
          </button>
          <button
            type="button"
            className={isSimulating ? 'is-active' : ''}
            onClick={() => setIsSimulating((prev) => !prev)}
          >
            {isSimulating ? '실시간 시뮬레이션 중지' : '실시간 시뮬레이션 시작'}
          </button>
        </div>

        <ul className="room-notification-preview__legend">
          <li>채팅 탭 N — 다른 탭에 있을 때 새 메시지 수</li>
          <li>암송 인증 탭 N — 채팅 탭에 있을 때 새 인증 수</li>
          <li>말풍선 옆 N — 내 메시지의 미읽음 인원 (카카오톡 방식)</li>
        </ul>

        <Link to="/home" className="room-notification-preview__back-link">
          홈으로 돌아가기
        </Link>
      </aside>

      <div className="room-notification-preview__phone">
        <div className="app-page">
          <div className="app-shell room-detail-shell">
            <RoomHeader
              roomName="UI 미리보기 방"
              memberCount={5}
              todayCompletedCount={3}
              onBack={() => {}}
            />

            <div className="room-detail-body">
              <div className="room-notification-preview__toolbar-placeholder">
                <span>암송 본문 · 오늘 인증 현황 (목업 생략)</span>
              </div>

              <RoomFeedTabs
                activeTab={activeTab}
                onChange={handleTabChange}
                unreadChatCount={unreadChatCount}
                unreadCertificationCount={unreadCertificationCount}
              />

              {activeTab === 'certifications' ? (
                <section className="room-notification-preview__cert-panel" aria-label="인증 피드 목업">
                  <p className="room-notification-preview__cert-hint">
                    암송 인증 탭을 보고 있을 때는 여기 피드가 갱신됩니다.
                    <br />
                    채팅 탭에 있으면 이 탭에 <strong>N</strong>이 쌓입니다.
                  </p>
                  <div className="room-notification-preview__cert-card">
                    <span className="room-notification-preview__cert-badge">녹음 인증</span>
                    <p>은혜님이 방금 암송 인증을 남겼어요</p>
                    <time>오후 2:40</time>
                  </div>
                  <div className="room-notification-preview__cert-card">
                    <span className="room-notification-preview__cert-badge">계수기 인증 · 3회</span>
                    <p>민수님의 인증</p>
                    <time>오후 1:12</time>
                  </div>
                </section>
              ) : (
                <ChatPanel
                  chatFeed={chatFeed}
                  currentMemberId={CURRENT_MEMBER_ID}
                  chatScrollRef={chatScrollRef}
                  chatText=""
                  onChatTextChange={() => {}}
                  onSubmit={(event) => event.preventDefault()}
                  showInput={false}
                  dedicatedLayout
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
