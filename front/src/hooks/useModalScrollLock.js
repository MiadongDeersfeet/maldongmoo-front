import { useEffect } from 'react';
import {
  clearVisualViewportHorizontalAlign,
  scheduleHorizontalViewportScrollReset,
  syncVisualViewportHorizontalAlign,
} from '@/utils/viewportScrollReset.js';

const MODAL_OPEN_CLASS = 'modal-open';

function isFormField(target) {
  return target instanceof HTMLElement
    && target.matches('input, textarea, select, [contenteditable="true"]');
}

/**
 * Prevents iOS viewport pan while a modal is open and restores horizontal alignment on close.
 * @param {boolean} isOpen
 */
export function useModalScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const root = document.documentElement;
    root.classList.add(MODAL_OPEN_CLASS);
    syncVisualViewportHorizontalAlign();

    const viewport = window.visualViewport;
    const handleViewportChange = () => {
      syncVisualViewportHorizontalAlign();
    };

    const handleFocusIn = (event) => {
      if (!isFormField(event.target)) {
        return;
      }

      syncVisualViewportHorizontalAlign();
      window.requestAnimationFrame(syncVisualViewportHorizontalAlign);
    };

    viewport?.addEventListener('scroll', handleViewportChange);
    viewport?.addEventListener('resize', handleViewportChange);
    document.addEventListener('focusin', handleFocusIn, true);

    return () => {
      viewport?.removeEventListener('scroll', handleViewportChange);
      viewport?.removeEventListener('resize', handleViewportChange);
      document.removeEventListener('focusin', handleFocusIn, true);

      root.classList.remove(MODAL_OPEN_CLASS);
      scheduleHorizontalViewportScrollReset();
      window.setTimeout(clearVisualViewportHorizontalAlign, 520);
    };
  }, [isOpen]);
}
