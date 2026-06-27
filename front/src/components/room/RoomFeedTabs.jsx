import './RoomFeedTabs.css';

export default function RoomFeedTabs({
  activeTab,
  onChange,
  unreadChatCount = 0,
  unreadCertificationCount = 0,
}) {
  return (
    <div className="room-feed-tabs" role="tablist" aria-label="방 피드 전환">
      <button
        type="button"
        className={`room-feed-tab ${activeTab === 'certifications' ? 'is-active' : ''}`}
        onClick={() => onChange('certifications')}
        role="tab"
        aria-selected={activeTab === 'certifications'}
      >
        <span>암송 인증</span>
        {unreadCertificationCount > 0 && (
          <span className="room-feed-tab-badge">{unreadCertificationCount}</span>
        )}
      </button>
      <button
        type="button"
        className={`room-feed-tab ${activeTab === 'chat' ? 'is-active' : ''}`}
        onClick={() => onChange('chat')}
        role="tab"
        aria-selected={activeTab === 'chat'}
      >
        <span>채팅</span>
        {unreadChatCount > 0 && (
          <span className="room-feed-tab-badge">{unreadChatCount}</span>
        )}
      </button>
    </div>
  );
}
