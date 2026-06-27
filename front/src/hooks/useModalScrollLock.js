import { useEffect } from 'react';
import {
  resetHorizontalViewportScroll,
  scheduleHorizontalViewportScrollReset,
} from '@/utils/viewportScrollReset.js';

const MODAL_OPEN_CLASS = 'modal-open';

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
    resetHorizontalViewportScroll();

    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyLeft = document.body.style.left;
    const previousBodyRight = document.body.style.right;
    const previousBodyWidth = document.body.style.width;
    const scrollY = window.scrollY;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    const viewport = window.visualViewport;
    const handleViewportChange = () => {
      resetHorizontalViewportScroll();
    };

    viewport?.addEventListener('scroll', handleViewportChange);
    viewport?.addEventListener('resize', handleViewportChange);

    return () => {
      viewport?.removeEventListener('scroll', handleViewportChange);
      viewport?.removeEventListener('resize', handleViewportChange);

      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.left = previousBodyLeft;
      document.body.style.right = previousBodyRight;
      document.body.style.width = previousBodyWidth;

      root.classList.remove(MODAL_OPEN_CLASS);
      window.scrollTo(0, scrollY);
      scheduleHorizontalViewportScrollReset();
    };
  }, [isOpen]);
}
