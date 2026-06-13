import './EmptyStateCard.css';

export default function EmptyStateCard({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state-card">
      {Icon && (
        <div className="empty-state-card__icon" aria-hidden="true">
          <Icon size={28} strokeWidth={1.75} />
        </div>
      )}
      <p className="empty-state-card__title">{title}</p>
      {description && <p className="empty-state-card__desc">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" className="empty-state-card__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
