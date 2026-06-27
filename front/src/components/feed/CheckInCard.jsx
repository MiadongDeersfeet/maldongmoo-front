import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import AvatarCircle from '@/components/ui/AvatarCircle.jsx';
import { getRoomRole } from '@/mocks/index.js';
import { resolveAudioUrl } from '@/utils/audioUrl.js';
import { formatDisplayTime } from '@/utils/date.js';
import AmenButton from './AmenButton.jsx';
import './CheckInCard.css';

let activeAudio = null;
let activeResetPlayingState = null;

function stopSharedAudio() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }

  if (activeResetPlayingState) {
    activeResetPlayingState();
    activeResetPlayingState = null;
  }
}

function formatTime(createdAt) {
  return formatDisplayTime(createdAt);
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
  const audioRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (audioRef.current) {
        audioRef.current.pause();

        if (activeAudio === audioRef.current) {
          activeAudio = null;
          activeResetPlayingState = null;
        }

        audioRef.current = null;
      }
    };
  }, []);

  const handleToggle = useCallback(() => {
    if (isPlaying && audioRef.current) {
      const playingAudio = audioRef.current;
      playingAudio.pause();
      playingAudio.currentTime = 0;

      if (activeAudio === playingAudio) {
        activeAudio = null;
        activeResetPlayingState = null;
      }

      audioRef.current = null;
      setIsPlaying(false);
      return;
    }

    const resolvedUrl = resolveAudioUrl(audioUrl);
    if (!resolvedUrl) {
      return;
    }

    stopSharedAudio();

    const audio = new Audio(resolvedUrl);
    audioRef.current = audio;
    activeAudio = audio;
    activeResetPlayingState = () => {
      if (isMountedRef.current) {
        setIsPlaying(false);
      }
    };

    const handleEnded = () => {
      if (isMountedRef.current) {
        setIsPlaying(false);
      }

      if (activeAudio === audio) {
        activeAudio = null;
        activeResetPlayingState = null;
      }

      audioRef.current = null;
    };

    const handleError = () => {
      if (isMountedRef.current) {
        setIsPlaying(false);
      }

      if (activeAudio === audio) {
        activeAudio = null;
        activeResetPlayingState = null;
      }

      audioRef.current = null;
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    setIsPlaying(true);
    audio.play().catch(handleError);
  }, [audioUrl, isPlaying]);

  return (
    <button
      type="button"
      className={`feed-card__play-btn ${isPlaying ? 'feed-card__play-btn--playing' : ''}`}
      onClick={handleToggle}
      aria-label={isPlaying ? '녹음 정지' : '녹음 재생'}
    >
      {isPlaying ? (
        <Pause size={11} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
      ) : (
        <Play size={11} strokeWidth={2.5} fill="currentColor" aria-hidden="true" />
      )}
    </button>
  );
}

function DetailRow({ row }) {
  if (row.type === 'voice') {
    return (
      <div className="feed-card__detail-row">
        <span className="feed-card__badge">녹음 인증</span>
        <VoicePlayButton audioUrl={row.detail.audioUrl ?? row.detail.voiceFileUrl} />
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

  const isAmenedByMe = card.isAmenedByMe === true || card.amenedByMe === true;

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
          isAmenedByMe={isAmenedByMe}
          onToggle={() => onAmenToggle(card)}
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
        isAmenedByMe={isAmenedByMe}
        onToggle={() => onAmenToggle(card)}
      />
    </article>
  );
}
