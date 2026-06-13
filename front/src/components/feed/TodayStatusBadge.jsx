import './TodayStatusBadge.css';

export default function TodayStatusBadge({ status, size = 'default', variant = 'default' }) {
  const isDone = status === 'Y';
  const label = isDone ? '오늘 완료' : '오늘 미완료';

  return (
    <span
      className={`today-status-badge today-status-badge--${size} ${
        isDone ? 'today-status-badge--done' : 'today-status-badge--pending'
      }`}
    >
      {variant === 'default' && (isDone ? '✅ ' : '⭕ ')}
      {label}
    </span>
  );
}
