import AvatarCircle from './AvatarCircle.jsx';
import './MemberProfileStrip.css';

export default function MemberProfileStrip({
  name,
  profileImg,
  subtitle,
  size = 'md',
  className = '',
}) {
  if (!name) return null;

  return (
    <div className={`member-profile-strip ${className}`.trim()}>
      <AvatarCircle name={name} profileImg={profileImg} size={size} />
      <div className="member-profile-strip__text">
        <p className="member-profile-strip__name">{name}</p>
        {subtitle && <p className="member-profile-strip__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
