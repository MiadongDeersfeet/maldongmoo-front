/** @returns {void} */
export function resetHorizontalViewportScroll() {
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;

  const root = document.getElementById('root');
  if (root) {
    root.scrollLeft = 0;
  }

  if (window.scrollX !== 0) {
    window.scrollTo(0, window.scrollY);
  }
}

/**
 * iOS PWA: visualViewport horizontal pan 보정 + scrollLeft 리셋
 * @returns {void}
 */
export function syncVisualViewportHorizontalAlign() {
  const offsetLeft = Math.round(window.visualViewport?.offsetLeft ?? 0);
  document.documentElement.style.setProperty('--vv-offset-left', `${offsetLeft}px`);
  resetHorizontalViewportScroll();
}

/** @returns {void} */
export function clearVisualViewportHorizontalAlign() {
  document.documentElement.style.removeProperty('--vv-offset-left');
  resetHorizontalViewportScroll();
}

/** iOS keyboard dismiss 후 offset이 남는 경우를 대비해 여러 시점에 재시도 */
export function scheduleHorizontalViewportScrollReset() {
  syncVisualViewportHorizontalAlign();

  requestAnimationFrame(() => {
    syncVisualViewportHorizontalAlign();
  });

  window.setTimeout(syncVisualViewportHorizontalAlign, 100);
  window.setTimeout(syncVisualViewportHorizontalAlign, 320);
  window.setTimeout(clearVisualViewportHorizontalAlign, 480);
}
