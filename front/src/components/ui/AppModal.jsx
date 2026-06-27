import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModalScrollLock } from '@/hooks/useModalScrollLock.js';
import { resetHorizontalViewportScroll } from '@/utils/viewportScrollReset.js';
import './AppModal.css';

export default function AppModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  ariaLabel,
}) {
  const bodyRef = useRef(null);

  useModalScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleBodyFocusOut = useCallback((event) => {
    if (!bodyRef.current?.contains(event.relatedTarget)) {
      resetHorizontalViewportScroll();
    }
  }, []);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="app-modal" role="presentation">
      <button
        type="button"
        className="app-modal__backdrop"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className="app-modal__card"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
      >
        {title ? (
          <div className="app-modal__header">
            <h2 className="app-modal__title">{title}</h2>
          </div>
        ) : null}
        {children ? (
          <div
            ref={bodyRef}
            className="app-modal__body"
            onFocusOut={handleBodyFocusOut}
          >
            {children}
          </div>
        ) : null}
        {footer ? <div className="app-modal__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
