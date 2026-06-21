import './RoomProfileStack.css';

function ProfilePlaceholder() {
  return (
    <svg
      className="room-profile-stack__placeholder"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="12" cy="9" r="4" fill="currentColor" />
      <path d="M4 20c0-4 4-7 8-7s8 3 8 7" fill="currentColor" />
    </svg>
  );
}

function StackAvatar({ profileImg, className }) {
  return (
    <span className={`room-profile-stack__avatar ${className}`.trim()}>
      {profileImg ? <img src={profileImg} alt="" /> : <ProfilePlaceholder />}
    </span>
  );
}

const LAYOUT_CLASS = {
  1: 'room-profile-stack--count-1',
  2: 'room-profile-stack--count-2',
  3: 'room-profile-stack--count-3',
  4: 'room-profile-stack--count-4',
};

/**
 * KakaoTalk-style member profile tile (up to 4 faces).
 * @param {{ participants?: Array<{ memberId?: number, name?: string, profileImg?: string | null }> }} props
 */
export default function RoomProfileStack({ participants = [] }) {
  const faces = participants.slice(0, 4);
  const count = faces.length;
  const layoutClass = LAYOUT_CLASS[count] ?? 'room-profile-stack--count-1';

  if (count === 0) {
    return (
      <div className={`room-profile-stack ${layoutClass}`} aria-hidden="true">
        <StackAvatar profileImg={null} className="room-profile-stack__avatar--slot-1" />
      </div>
    );
  }

  return (
    <div className={`room-profile-stack ${layoutClass}`} aria-hidden="true">
      {faces.map((participant, index) => (
        <StackAvatar
          key={participant.memberId ?? `${participant.name}-${index}`}
          profileImg={participant.profileImg}
          className={`room-profile-stack__avatar--slot-${index + 1}`}
        />
      ))}
    </div>
  );
}
