import { useEffect, useRef } from 'react';

/**
 * Screen Wake Lock — 녹음 등 장시간 사용자 무터랙션 작업 중 화면 자동 꺼짐 완화.
 * 미지원 브라우저에서는 no-op.
 * @param {boolean} enabled
 */
export function useScreenWakeLock(enabled) {
  const wakeLockRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return undefined;
    }

    let cancelled = false;

    const releaseWakeLock = async () => {
      if (!wakeLockRef.current) {
        return;
      }

      try {
        await wakeLockRef.current.release();
      } catch {
        // ignore
      }

      wakeLockRef.current = null;
    };

    const requestWakeLock = async () => {
      if (cancelled || document.visibilityState !== 'visible') {
        return;
      }

      try {
        await releaseWakeLock();
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) {
          await sentinel.release();
          return;
        }
        wakeLockRef.current = sentinel;
      } catch {
        wakeLockRef.current = null;
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (!cancelled && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [enabled]);
}
