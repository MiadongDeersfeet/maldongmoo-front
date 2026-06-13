import './AvatarCircle.css';

export default function AvatarCircle({ name, profileImg, size = 'md', className = '' }) {
  const initial = name?.charAt(0) ?? '?';

  return (
    <span
      className={`avatar-circle avatar-circle--${size} ${className}`.trim()}
      aria-hidden="true"
    >
      {profileImg ? <img src={profileImg} alt="" /> : initial}
    </span>
  );
}
