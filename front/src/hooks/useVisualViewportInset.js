import { useEffect, useState } from 'react';

const VISUAL_VIEWPORT_HEIGHT_VAR = '--app-visual-viewport-height';

/**
 * Tracks soft-keyboard overlap using Visual Viewport API.
 * @param {boolean} enabled
 * @param {{ syncVisualViewportHeight?: boolean }} [options]
 * @returns {{ bottom: number, height: number | null, offsetTop: number }}
 */
export function useVisualViewportInset(enabled = true, options = {}) {
  const { syncVisualViewportHeight = false } = options;
  const [inset, setInset] = useState({ bottom: 0, height: null, offsetTop: 0 });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return undefined;
    }

    const syncViewportHeightVar = () => {
      if (!syncVisualViewportHeight) {
        return;
      }

      const height = Math.round(viewport.height || window.innerHeight);
      document.documentElement.style.setProperty(VISUAL_VIEWPORT_HEIGHT_VAR, `${height}px`);
    };

    const clearViewportHeightVar = () => {
      if (!syncVisualViewportHeight) {
        return;
      }

      document.documentElement.style.removeProperty(VISUAL_VIEWPORT_HEIGHT_VAR);
    };

    const update = () => {
      const bottom = Math.max(
        0,
        Math.round(window.innerHeight - viewport.height - viewport.offsetTop),
      );

      setInset({
        bottom,
        height: Math.round(viewport.height),
        offsetTop: Math.round(viewport.offsetTop),
      });
      syncViewportHeightVar();
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    window.addEventListener('orientationchange', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      window.removeEventListener('orientationchange', update);
      clearViewportHeightVar();
    };
  }, [enabled, syncVisualViewportHeight]);

  return inset;
}
