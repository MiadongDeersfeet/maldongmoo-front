import './StatusBadge.css';

export default function StatusBadge({ variant = 'pending', children }) {
  return (
    <span className={`status-badge status-badge--${variant}`}>
      {children}
    </span>
  );
}
