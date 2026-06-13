import './ProgressRing.css';

export default function ProgressRing({ completed, total, size = 'md' }) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const angle = total === 0 ? 0 : (completed / total) * 360;

  return (
    <div
      className={`progress-ring progress-ring--${size}`}
      style={{ '--progress-angle': `${angle}deg` }}
      aria-hidden="true"
    >
      <span className="progress-ring__value">{percent}%</span>
    </div>
  );
}
