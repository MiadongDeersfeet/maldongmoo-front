import StatusBadge from '@/components/ui/StatusBadge.jsx';
import './TodayCheckInSummary.css';

function getCompletionNote(lastDetail) {
  if (!lastDetail) return null;
  if (lastDetail.checkInType === 'VOICE') {
    return '오늘 녹음 인증 완료';
  }
  return '오늘 계수기 인증 완료';
}

export default function TodayCheckInSummary({ status, lastDetail }) {
  const isDone = status === 'Y';
  const completionNote = isDone ? getCompletionNote(lastDetail) : null;

  return (
    <section className="today-summary" aria-label="오늘 인증">
      <span className="today-summary__label">오늘 인증</span>
      <div className="today-summary__right">
        <StatusBadge variant={isDone ? 'done' : 'pending'}>
          {isDone ? '오늘 완료' : '오늘 미완료'}
        </StatusBadge>
        {completionNote && (
          <span className="today-summary__note">{completionNote}</span>
        )}
      </div>
    </section>
  );
}
