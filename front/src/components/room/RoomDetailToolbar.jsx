import PinnedSectionBar from '@/components/room/PinnedSectionBar.jsx';
import TodayCheckInBar from '@/components/room/TodayCheckInBar.jsx';
import RecitationCardExpanded from '@/components/recitation/RecitationCardExpanded.jsx';

/**
 * 본문 카드 + 오늘 암송 바.
 * allowInlineRecitationExpand=false(채팅 탭)일 때는 접힌 바만 표시하고,
 * 펼치기 동작은 부모가 전체화면(overlay)으로 연다.
 */
export default function RoomDetailToolbar({
  section,
  isLeader,
  isRecitationExpanded,
  allowInlineRecitationExpand,
  showCheckInStatus = true,
  onToggleRecitation,
  onCollapseRecitation,
  onOpenRecitationFullscreen,
  onOpenSectionEditor,
  completedMembers,
  pendingMembers,
  todayCompletedCount,
  totalMemberCount,
}) {
  const showInlineExpanded = allowInlineRecitationExpand && isRecitationExpanded;
  const toolbarClassName = [
    'room-detail-toolbar',
    !showCheckInStatus ? 'room-detail-toolbar--chat-tab' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={toolbarClassName}>
      {!showInlineExpanded ? (
        <PinnedSectionBar section={section} onToggleExpand={onToggleRecitation} />
      ) : (
        <RecitationCardExpanded
          section={section}
          isLeader={isLeader}
          onCollapse={onCollapseRecitation}
          onOpenFullscreen={onOpenRecitationFullscreen}
          onRegister={onOpenSectionEditor}
        />
      )}
      {showCheckInStatus && (
        <TodayCheckInBar
          completedMembers={completedMembers}
          pendingMembers={pendingMembers}
          todayCompletedCount={todayCompletedCount}
          totalMemberCount={totalMemberCount}
        />
      )}
    </div>
  );
}