import { useEffect, useState } from 'react';

/**
 * Tracks soft-keyboard overlap using Visual Viewport API.
 * @param {boolean} enabled
 * @returns {{ bottom: number, height: number | null }}
 */
export function useVisualViewportInset(enabled = true) {
  const [inset, setInset] = useState({ bottom: 0, height: null });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return undefined;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      return undefined;
    }

    const update = () => {
      const bottom = Math.max(
        0,
        Math.round(window.innerHeight - viewport.height - viewport.offsetTop),
      );

      setInset({
        bottom,
        height: Math.round(viewport.height),
      });
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    window.addEventListener('orientationchange', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [enabled]);

  return inset;
}
