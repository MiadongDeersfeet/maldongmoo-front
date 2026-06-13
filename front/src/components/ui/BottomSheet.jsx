import { useEffect } from 'react';
import { X } from 'lucide-react';
import './BottomSheet.css';

export default function BottomSheet({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="bottom-sheet-layer" role="presentation">
      <button
        type="button"
        className="bottom-sheet-layer__backdrop"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className="bottom-sheet-layer__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="bottom-sheet-layer__handle" aria-hidden="true" />
        <div className="bottom-sheet-layer__header">
          <h2 className="bottom-sheet-layer__title">{title}</h2>
          <button
            type="button"
            className="bottom-sheet-layer__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>
        <div className="bottom-sheet-layer__body">{children}</div>
      </div>
    </div>
  );
}
