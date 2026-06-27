/** @returns {void} */
export function resetHorizontalViewportScroll() {
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;

  if (window.scrollX !== 0) {
    window.scrollTo(0, window.scrollY);
  }
}

/** iOS keyboard dismiss 후 offset이 남는 경우를 대비해 여러 시점에 재시도 */
export function scheduleHorizontalViewportScrollReset() {
  resetHorizontalViewportScroll();

  requestAnimationFrame(() => {
    resetHorizontalViewportScroll();
  });

  window.setTimeout(resetHorizontalViewportScroll, 100);
  window.setTimeout(resetHorizontalViewportScroll, 320);
}
