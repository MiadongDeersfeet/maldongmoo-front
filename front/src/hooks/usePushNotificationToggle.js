import { useCallback, useEffect, useState } from 'react';
import { getPushPublicKey } from '@/api/pushApi.js';
import {
  disablePushNotifications,
  enablePushNotifications,
  isPushSupported,
} from '@/hooks/usePushSubscription.js';
import {
  isPushPaused,
  PUSH_PREFERENCE_CHANGED,
} from '@/utils/pushNotificationPreference.js';

export function usePushNotificationToggle(isAuthenticated) {
  const [paused, setPaused] = useState(() => isPushPaused());
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const syncPaused = () => setPaused(isPushPaused());
    window.addEventListener(PUSH_PREFERENCE_CHANGED, syncPaused);
    return () => window.removeEventListener(PUSH_PREFERENCE_CHANGED, syncPaused);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      if (!isAuthenticated || !isPushSupported()) {
        if (!cancelled) {
          setAvailable(false);
        }
        return;
      }

      try {
        const keyInfo = await getPushPublicKey();
        if (!cancelled) {
          setAvailable(Boolean(keyInfo?.enabled && keyInfo?.publicKey));
        }
      } catch {
        if (!cancelled) {
          setAvailable(false);
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const toggle = useCallback(async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (paused) {
        await enablePushNotifications();
      } else {
        await disablePushNotifications();
      }
    } catch (toggleError) {
      const message = toggleError instanceof Error
        ? toggleError.message
        : '알림 설정을 변경하지 못했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loading, paused]);

  return {
    available,
    paused,
    loading,
    error,
    toggle,
    clearError: () => setError(null),
  };
}
