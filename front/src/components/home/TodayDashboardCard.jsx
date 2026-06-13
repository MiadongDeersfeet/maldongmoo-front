import AvatarCircle from '@/components/ui/AvatarCircle.jsx';
import ProgressRing from './ProgressRing.jsx';
import './TodayDashboardCard.css';

function getStatusMessage(dashboard) {
  if (!dashboard || dashboard.totalRoomCount === 0) {
    return '아직 참여 중인 암송방이 없습니다';
  }
  if (dashboard.completedRoomCount === dashboard.totalRoomCount) {
    return '모든 암송방을 완료했어요';
  }
  if (dashboard.completedRoomCount === 0) {
    return '첫 번째 암송을 시작해보세요';
  }
  return '아직 함께할 방이 남아 있어요';
}

function getProgressLine(name, dashboard) {
  if (!dashboard || dashboard.totalRoomCount === 0) {
    return `${name}님`;
  }
  return `${name}님, 오늘 ${dashboard.completedRoomCount}/${dashboard.totalRoomCount}개 완료`;
}

export default function TodayDashboardCard({ name, profileImg, dashboard }) {
  const hasRooms = dashboard && dashboard.totalRoomCount > 0;
  const isAllDone = hasRooms && dashboard.completedRoomCount === dashboard.totalRoomCount;

  return (
    <section className="today-dashboard-card" aria-label="오늘 대시보드">
      <div className="today-dashboard-card__deco" aria-hidden="true" />
      <div className="today-dashboard-card__body">
        <AvatarCircle
          name={name}
          profileImg={profileImg}
          size="md"
          className="today-dashboard-card__avatar"
        />
        <div className="today-dashboard-card__text">
          <p className="today-dashboard-card__progress-line">{getProgressLine(name, dashboard)}</p>
          <p
            className={`today-dashboard-card__status ${isAllDone ? 'today-dashboard-card__status--done' : ''}`}
          >
            {getStatusMessage(dashboard)}
          </p>
        </div>
        {hasRooms && (
          <ProgressRing
            size="sm"
            completed={dashboard.completedRoomCount}
            total={dashboard.totalRoomCount}
          />
        )}
      </div>
    </section>
  );
}
