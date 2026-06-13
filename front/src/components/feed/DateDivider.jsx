import './DateDivider.css';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateLabel(dateStr, variant) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = WEEKDAYS[date.getDay()];

  if (variant === 'capsule') {
    return `${month}월 ${day}일 (${weekday})`;
  }
  return `${year}년 ${month}월 ${day}일`;
}

export default function DateDivider({ checkInDate, variant = 'default' }) {
  return (
    <div className={`date-divider date-divider--${variant}`} role="separator">
      <span className="date-divider__label">{formatDateLabel(checkInDate, variant)}</span>
    </div>
  );
}
