import './AmenButton.css';

export default function AmenButton({
  amenCount,
  isAmenedByMe,
  disabled = false,
  onToggle,
  variant = 'default',
}) {
  const heartSymbol = isAmenedByMe ? '♥' : '♡';

  if (variant === 'pill') {
    if (disabled) {
      return (
        <div className="amen-pill amen-pill--readonly">
          <span className="amen-pill__heart" aria-hidden="true">♡</span>
          아멘 {amenCount}
        </div>
      );
    }

    return (
      <button
        type="button"
        className={`amen-pill ${isAmenedByMe ? 'amen-pill--active' : ''}`}
        onClick={onToggle}
        aria-pressed={isAmenedByMe}
      >
        <span className="amen-pill__heart" aria-hidden="true">{heartSymbol}</span>
        아멘 {amenCount}
      </button>
    );
  }

  return (
    <div className="amen-button-row">
      <span className="amen-button-row__count" aria-live="polite">
        {heartSymbol} 아멘 {amenCount}
      </span>
      {!disabled && (
        <button
          type="button"
          className={`amen-button ${isAmenedByMe ? 'amen-button--active' : ''}`}
          onClick={onToggle}
          aria-pressed={isAmenedByMe}
        >
          아멘
        </button>
      )}
    </div>
  );
}
