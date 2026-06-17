import { useLayoutEffect, useRef } from 'react';

const FLIP_DURATION_MS = 320;
const FLIP_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

export function useFlipListAnimation(containerRef, orderKey) {
  const positionsRef = useRef(new Map());
  const isFirstRenderRef = useRef(true);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll('[data-flip-id]');
    const nextPositions = new Map();

    elements.forEach((element) => {
      nextPositions.set(element.dataset.flipId, element.getBoundingClientRect());
    });

    if (!isFirstRenderRef.current) {
      elements.forEach((element) => {
        const id = element.dataset.flipId;
        const previousRect = positionsRef.current.get(id);
        const nextRect = nextPositions.get(id);

        if (!previousRect || !nextRect) return;

        const deltaY = previousRect.top - nextRect.top;
        if (Math.abs(deltaY) <= 2) return;

        element.style.transition = 'none';
        element.style.transform = `translateY(${deltaY}px)`;
        element.getBoundingClientRect();

        element.style.transition = `transform ${FLIP_DURATION_MS}ms ${FLIP_EASING}`;
        element.style.transform = '';

        const handleTransitionEnd = (event) => {
          if (event.propertyName !== 'transform') return;
          element.style.transition = '';
          element.removeEventListener('transitionend', handleTransitionEnd);
        };

        element.addEventListener('transitionend', handleTransitionEnd);
      });
    }

    positionsRef.current = nextPositions;
    isFirstRenderRef.current = false;
  }, [containerRef, orderKey]);
}
