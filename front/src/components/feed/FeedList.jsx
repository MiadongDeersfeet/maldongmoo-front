import { MessageCircle } from 'lucide-react';
import DateDivider from './DateDivider.jsx';
import CheckInCard from './CheckInCard.jsx';
import EmptyStateCard from '@/components/ui/EmptyStateCard.jsx';
import './FeedList.css';

export default function FeedList({
  feed,
  currentMemberId,
  roomId,
  onAmenToggle,
  onStartCheckIn,
  variant = 'default',
  isInlineActive = false,
  showOldestHint = false,
}) {
  if (feed.length === 0) {
    if (variant === 'timeline') {
      return (
        <div className="feed-list feed-list--empty">
          <EmptyStateCard
            icon={MessageCircle}
            title="아직 오늘의 인증이 없어요"
            description="첫 번째 암송 인증을 남겨보세요."
            actionLabel="인증 시작하기"
            onAction={onStartCheckIn}
          />
        </div>
      );
    }
    return <p className="feed-list__empty">아직 인증 기록이 없습니다.</p>;
  }

  const timelineClass = [
    'feed-list',
    variant === 'timeline' ? 'feed-list--timeline' : '',
    isInlineActive ? 'feed-list--inline-active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={timelineClass}>
      {variant === 'timeline' && showOldestHint && (
        <p className="feed-list__oldest-hint">더 이전 기록은 없어요</p>
      )}
      {feed.map((day) => (
        <section key={day.checkInDate} className="feed-list__day">
          <DateDivider
            checkInDate={day.checkInDate}
            variant={variant === 'timeline' ? 'capsule' : 'default'}
          />
          {day.checkIns.map((card) => (
            <CheckInCard
              key={card.checkInId}
              card={card}
              currentMemberId={currentMemberId}
              roomId={roomId}
              onAmenToggle={onAmenToggle}
              variant={variant}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
