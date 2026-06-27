import { useEffect } from 'react';
import {
  resetHorizontalViewportScroll,
  scheduleHorizontalViewportScrollReset,
} from '@/utils/viewportScrollReset.js';

const MODAL_OPEN_CLASS = 'modal-open';

function isFormField(target) {
  return target instanceof HTMLElement
    && target.matches('input, textarea, select, [contenteditable="true"]');
}

/**
 * Locks background scroll while a modal is open and resets horizontal pan on iOS.
 * @param {boolean} isOpen
 */
export function useModalScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const root = document.documentElement;
    root.classList.add(MODAL_OPEN_CLASS);
    resetHorizontalViewportScroll();

    const handleFocusIn = (event) => {
      if (!isFormField(event.target)) {
        return;
      }

      resetHorizontalViewportScroll();
    };

    document.addEventListener('focusin', handleFocusIn, true);

    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      root.classList.remove(MODAL_OPEN_CLASS);
      scheduleHorizontalViewportScrollReset();
    };
  }, [isOpen]);
}
