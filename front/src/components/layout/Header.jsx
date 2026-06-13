import { useNavigate } from 'react-router-dom';
import AvatarCircle from '@/components/ui/AvatarCircle.jsx';
import './Header.css';

export default function Header({ title, showBack = false, onBack, member = null }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="header">
      <div className="header__side">
        {showBack && (
          <button type="button" className="header__back" onClick={handleBack} aria-label="뒤로">
            ←
          </button>
        )}
      </div>
      <h1 className="header__title">{title}</h1>
      <div className="header__side header__side--end">
        {member && (
          <AvatarCircle
            name={member.name}
            profileImg={member.profileImg}
            size="sm"
          />
        )}
      </div>
    </header>
  );
}
