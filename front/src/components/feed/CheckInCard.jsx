import { useState } from 'react';
import { Play } from 'lucide-react';
import AvatarCircle from '@/components/ui/AvatarCircle.jsx';
import { getRoomRole } from '@/mocks/index.js';
import AmenButton from './AmenButton.jsx';
import './CheckInCard.css';

function formatTime(createdAt) {
  const hour = Number(createdAt.slice(11, 13));
  const minute = createdAt.slice(14, 16);
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${period} ${displayHour}:${minute}`;
}

function getRoleLabel(isOwnCard, roomRole) {
  if (isOwnCard) return '나';
  if (roomRole === 'LEADER') return '방장';
  return '멤버';
}

function buildDisplayRows(details) {
  const sorted = [...details].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const rows = [];
  let counterTotal = 0;
  let lastCounterCreatedAt = null;

  sorted.forEach((detail) => {
    if (detail.checkInType === 'VOICE') {
      rows.push({ type: 'voice', detail, key: `voice-${detail.detailId}` });
      return;
    }

    counterTotal += detail.counterValue ?? 0;
    lastCounterCreatedAt = detail.createdAt;
  });

  if (counterTotal > 0) {
    const counterRow = {
      type: 'counter',
      total: counterTotal,
      key: 'counter-sum',
      createdAt: lastCounterCreatedAt,
    };
    const insertAt = rows.findIndex(
      (row) => row.type === 'voice' && row.detail.createdAt > lastCounterCreatedAt,
    );

    if (insertAt === -1) {
      rows.push(counterRow);
    } else {
      rows.splice(insertAt, 0, counterRow);
    }
  }

  return rows;
}

function VoicePlayButton({ audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    console.log('[mock] play voice recording', audioUrl);
    setIsPlaying(true);
    window.setTimeout(() => setIsPlaying(false), 1200);
  };

  return (
    <button
      type="button"
      className={`feed-card__play-btn ${isPlaying ? 'feed-card__play-btn--playing' : ''}`}
      onClick={handlePlay}
      aria-label="녹음 재생"
    >
      <Play size={11} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
    </button>
  );
}

function DetailRow({ row }) {
  if (row.type === 'voice') {
    return (
      <div className="feed-card__detail-row">
        <span className="feed-card__badge">녹음 인증</span>
        <VoicePlayButton audioUrl={row.detail.audioUrl} />
      </div>
    );
  }

  return (
    <div className="feed-card__detail-row">
      <span className="feed-card__badge">계수기 인증 · {row.total}회</span>
    </div>
  );
}

export default function CheckInCard({
  card,
  currentMemberId,
  roomId,
  onAmenToggle,
  variant = 'default',
}) {
  const isOwnCard = card.memberId === currentMemberId;
  const roomRole = roomId ? getRoomRole(roomId, card.memberId) : null;
  const roleLabel = getRoleLabel(isOwnCard, roomRole);
  const displayRows = buildDisplayRows(card.details);
  const latestDetail = card.details[card.details.length - 1];
  const timeLabel = latestDetail ? formatTime(latestDetail.createdAt) : '';

  if (variant === 'timeline') {
    return (
      <article className={`feed-card feed-card--timeline ${isOwnCard ? 'feed-card--own' : ''}`}>
        <div className="feed-card__meta-row">
          <AvatarCircle name={card.memberName} profileImg={card.profileImg} size="sm" />
          <span className="feed-card__author">{card.memberName}</span>
          <span className={`feed-card__role ${isOwnCard ? 'feed-card__role--own' : ''}`}>
            {roleLabel}
          </span>
          <span className="feed-card__time">{timeLabel}</span>
        </div>
        <div className="feed-card__body">
          {displayRows.map((row) => (
            <DetailRow key={row.key} row={row} />
          ))}
        </div>
        <AmenButton
          amenCount={card.amenCount}
          isAmenedByMe={card.isAmenedByMe}
          disabled={isOwnCard}
          onToggle={() => onAmenToggle(card.checkInId)}
          variant="pill"
        />
      </article>
    );
  }

  return (
    <article className="check-in-card">
      <div className="check-in-card__header">
        <AvatarCircle name={card.memberName} profileImg={card.profileImg} />
        <span className="check-in-card__name">{card.memberName}</span>
      </div>
      <div className="check-in-card__details">
        {displayRows.map((row) => (
          <div key={row.key} className="check-in-detail-item">
            {row.type === 'voice' ? '녹음' : `계수기 ${row.total}회`}
          </div>
        ))}
      </div>
      <AmenButton
        amenCount={card.amenCount}
        isAmenedByMe={card.isAmenedByMe}
        disabled={isOwnCard}
        onToggle={() => onAmenToggle(card.checkInId)}
      />
    </article>
  );
}
