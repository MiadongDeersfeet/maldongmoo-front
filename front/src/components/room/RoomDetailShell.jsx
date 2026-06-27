/**
 * 방 상세 고정 chrome: 헤더 + toolbar + 탭 + 탭 패널 슬롯.
 * 스크롤·키보드 로직은 각 탭 패널(CertificationFeedPanel, ChatRoomPanel)에 위임한다.
 */
export default function RoomDetailShell({ header, toolbar, tabs, children }) {
  return (
    <>
      {header}
      <div className="room-detail-body">
        {toolbar}
        {tabs}
        {children}
      </div>
    </>
  );
}
