import './FeatureCard.css';

function FeatureIcon({ id }) {
  const icons = {
    recite: (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="8" y="6" width="24" height="28" rx="3" fill="#FFF8E7" stroke="#C4A574" strokeWidth="1.2" />
        <path d="M13 12H27M13 17H27M13 22H22" stroke="#C4A574" strokeWidth="1" strokeLinecap="round" />
        <path d="M20 28L18 32L22 32L20 28Z" fill="#5A8F5E" />
        <circle cx="28" cy="10" r="3" fill="#FFE066" opacity="0.9" />
        <path d="M28 7V6M30 10H31M28 13V14M25 10H24" stroke="#FFD43B" strokeWidth="0.8" strokeLinecap="round" />
      </svg>
    ),
    checkin: (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="14" y="8" width="12" height="20" rx="6" fill="#5A8F5E" />
        <path d="M17 14H23M17 18H23M17 22H21" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M10 20C10 20 8 22 6 24M30 20C30 20 32 22 34 24" stroke="#7A9B82" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="32" r="2" fill="#5A8F5E" opacity="0.5" />
      </svg>
    ),
    amen: (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M12 28V16L20 22L28 16V28H12Z" fill="#FFF0F5" stroke="#E8A0B4" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M16 28V20M24 28V20" stroke="#E8A0B4" strokeWidth="1" strokeLinecap="round" />
        <circle cx="20" cy="12" r="4" fill="#FFE8EC" stroke="#E8A0B4" strokeWidth="1" />
        <path d="M20 16V18" stroke="#5A8F5E" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="20" cy="20" r="1.5" fill="#5A8F5E" />
      </svg>
    ),
    room: (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="14" cy="18" r="6" fill="#FFE8D6" stroke="#D4A574" strokeWidth="1" />
        <circle cx="26" cy="18" r="6" fill="#E8F4E5" stroke="#7A9B82" strokeWidth="1" />
        <circle cx="20" cy="26" r="6" fill="#FFF8E7" stroke="#C4A574" strokeWidth="1" />
        <circle cx="12" cy="17" r="1" fill="#666" />
        <circle cx="16" cy="17" r="1" fill="#666" />
        <path d="M13 19Q14 21 16 19" stroke="#666" strokeWidth="0.8" fill="none" />
        <circle cx="24" cy="17" r="1" fill="#666" />
        <circle cx="28" cy="17" r="1" fill="#666" />
        <path d="M25 19Q26 21 28 19" stroke="#666" strokeWidth="0.8" fill="none" />
        <circle cx="18" cy="25" r="1" fill="#666" />
        <circle cx="22" cy="25" r="1" fill="#666" />
        <path d="M19 27Q20 29 22 27" stroke="#666" strokeWidth="0.8" fill="none" />
        <path d="M20 32C20 32 18 34 20 36C22 34 20 32 20 32Z" fill="#F8A0B4" opacity="0.7" />
      </svg>
    ),
  };

  return <span className="feature-card__icon">{icons[id]}</span>;
}

export default function FeatureCard({ id, title, description }) {
  return (
    <article className="feature-card">
      <FeatureIcon id={id} />
      <h3 className="feature-card__title">{title}</h3>
      <p className="feature-card__desc">{description}</p>
    </article>
  );
}
