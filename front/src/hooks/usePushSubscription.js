import { useEffect, useRef, useState } from 'react';
import { getPushPublicKey, removePushSubscription, upsertPushSubscription } from '@/api/pushApi.js';
import {
  isPushPaused,
  PUSH_PREFERENCE_CHANGED,
  setPushPaused,
} from '@/utils/pushNotificationPreference.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported() {
  return (
    typeof window !== 'undefined'
    && 'Notification' in window
    && 'serviceWorker' in navigator
    && 'PushManager' in window
  );
}

async function subscribeCurrentDevice(publicKey) {
  if (!isPushSupported()) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await upsertPushSubscription(subscription);
  return subscription;
}

async function unsubscribeCurrentDevice() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return null;
  }

  await removePushSubscription(subscription.endpoint).catch(() => {});
  await subscription.unsubscribe();
  return subscription.endpoint;
}

export async function disablePushNotifications() {
  setPushPaused(true);
  await unsubscribeCurrentDevice();
}

export async function enablePushNotifications() {
  if (!isPushSupported()) {
    throw new Error('이 브라우저에서는 알림을 사용할 수 없습니다.');
  }

  const keyInfo = await getPushPublicKey();
  if (!keyInfo?.enabled || !keyInfo.publicKey) {
    throw new Error('알림 서비스를 사용할 수 없습니다.');
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') {
    throw new Error('브라우저 알림 권한이 필요합니다.');
  }

  setPushPaused(false);
  await subscribeCurrentDevice(keyInfo.publicKey);
}

export function usePushSubscription(isAuthenticated) {
  const subscribedEndpointRef = useRef(null);
  const [paused, setPaused] = useState(() => isPushPaused());

  useEffect(() => {
    const syncPaused = () => setPaused(isPushPaused());
    window.addEventListener(PUSH_PREFERENCE_CHANGED, syncPaused);
    return () => window.removeEventListener(PUSH_PREFERENCE_CHANGED, syncPaused);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    if (!isPushSupported()) {
      return undefined;
    }

    let cancelled = false;

    async function registerPush() {
      if (paused) {
        return;
      }

      try {
        const keyInfo = await getPushPublicKey();
        if (cancelled || !keyInfo?.enabled || !keyInfo.publicKey) {
          return;
        }

        let permission = Notification.permission;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }
        if (permission !== 'granted') {
          return;
        }

        const subscription = await subscribeCurrentDevice(keyInfo.publicKey);
        if (subscription) {
          subscribedEndpointRef.current = subscription.endpoint;
        }
      } catch (error) {
        console.warn('[push] subscription failed:', error);
      }
    }

    registerPush();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, paused]);

  useEffect(() => {
    if (isAuthenticated) {
      return undefined;
    }

    const endpoint = subscribedEndpointRef.current;
    if (!endpoint) {
      return undefined;
    }

    removePushSubscription(endpoint).catch(() => {});
    subscribedEndpointRef.current = null;
    return undefined;
  }, [isAuthenticated]);
}
