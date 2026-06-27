import { formatDisplayClock } from '@/utils/date.js';
import './CheckInDetailItem.css';

function formatTime(createdAt) {
  return formatDisplayClock(createdAt);
}

export default function CheckInDetailItem({ detail }) {
  const isVoice = detail.checkInType === 'VOICE';

  return (
    <div className="check-in-detail-item">
      <span className="check-in-detail-item__icon" aria-hidden="true">
        {isVoice ? '🎙️' : '🔢'}
      </span>
      <span className="check-in-detail-item__label">
        {isVoice ? '녹음 인증' : `계수기 ${detail.counterValue}회`}
      </span>
      <span className="check-in-detail-item__time">{formatTime(detail.createdAt)}</span>
    </div>
  );
}
