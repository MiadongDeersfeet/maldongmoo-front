import AvatarCircle from '@/components/ui/AvatarCircle.jsx';
import './TodayCheckInBar.css';

const MAX_VISIBLE_AVATARS = 5;

function MemberAvatarStack({ members, variant = 'done', emptyText }) {
  if (members.length === 0) {
    return <p className="today-status-card__empty">{emptyText}</p>;
  }

  const visible = members.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = members.length - visible.length;

  return (
    <div className={`today-status-card__avatars today-status-card__avatars--${variant}`}>
      {visible.map((member) => (
        <AvatarCircle
          key={member.memberId}
          name={member.name}
          profileImg={member.profileImg}
          size="xs"
          className="today-status-card__avatar"
        />
      ))}
      {overflow > 0 && (
        <span className="today-status-card__avatar-overflow">+{overflow}</span>
      )}
    </div>
  );
}

export default function TodayCheckInBar({
  completedMembers = [],
  pendingMembers = [],
  todayCompletedCount,
  totalMemberCount,
}) {
  const isAllDone = totalMemberCount > 0 && todayCompletedCount === totalMemberCount;

  return (
    <section className="today-status-card" aria-label="오늘 인증 현황">
      <div className="today-status-card__split">
        <div className="today-status-card__col today-status-card__col--done">
          <p className="today-status-card__label">암송 완료 {completedMembers.length}명</p>
          <MemberAvatarStack
            members={completedMembers}
            variant="done"
            emptyText="아직 인증이 없어요"
          />
        </div>

        {isAllDone ? (
          <div className="today-status-card__col today-status-card__col--all-done">
            <span className="today-status-card__all-done-pill">모두 완료</span>
          </div>
        ) : (
          <div className="today-status-card__col today-status-card__col--pending">
            <p className="today-status-card__label">함께할 {pendingMembers.length}명</p>
            <MemberAvatarStack members={pendingMembers} variant="pending" />
          </div>
        )}
      </div>
    </section>
  );
}
