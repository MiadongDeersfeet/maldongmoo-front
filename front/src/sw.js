/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

function parsePayload(event) {
  try {
    return event.data?.json() ?? {};
  } catch {
    return {};
  }
}

function isForegroundMatch(clientUrl, payload) {
  if (!payload?.roomId) {
    return false;
  }

  const pathname = clientUrl.pathname;
  const roomPrefix = `/rooms/${payload.roomId}`;
  if (!pathname.startsWith(roomPrefix)) {
    return false;
  }

  if (payload.type === 'CHAT') {
    return clientUrl.searchParams.get('tab') === 'chat';
  }

  if (payload.type === 'CHECK_IN_CREATED' || payload.type === 'AMEN') {
    return clientUrl.searchParams.get('tab') === 'cert';
  }

  return true;
}

async function shouldSuppressNotification(payload) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  return clients.some((client) => {
    if (client.visibilityState !== 'visible') {
      return false;
    }
    try {
      return isForegroundMatch(new URL(client.url), payload);
    } catch {
      return false;
    }
  });
}

function buildChatBody(existingMessages, payload) {
  const nextMessages = [...existingMessages, {
    senderName: payload.senderName || '말동무',
    preview: payload.preview || payload.body || '',
  }].slice(-10);

  const latest = nextMessages[nextMessages.length - 1];
  const body = nextMessages.length <= 1
    ? `${latest.senderName}: ${latest.preview}`
    : `${latest.senderName}: ${latest.preview} (새 메시지 ${nextMessages.length}개)`;

  return { body, messages: nextMessages };
}

async function showPushNotification(payload) {
  const title = payload.title || '말동무';
  const tag = payload.tag || `maldongmoo-${payload.type || 'default'}`;
  const url = payload.url || '/';
  let body = payload.body || '';
  let data = {
    url,
    type: payload.type,
    roomId: payload.roomId,
    tab: payload.tab,
    messages: [],
  };

  if (payload.type === 'CHAT') {
    const existing = await self.registration.getNotifications({ tag });
    let previousMessages = [];
    if (existing.length > 0) {
      try {
        previousMessages = JSON.parse(existing[0].data?.messages || '[]');
      } catch {
        previousMessages = [];
      }
    }

    const chat = buildChatBody(previousMessages, payload);
    body = chat.body;
    data = {
      ...data,
      messages: chat.messages,
    };
  }

  await self.registration.showNotification(title, {
    body,
    tag,
    renotify: true,
    data,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  });
}

self.addEventListener('push', (event) => {
  const payload = parsePayload(event);
  if (!payload?.type) {
    return;
  }

  event.waitUntil((async () => {
    if (await shouldSuppressNotification(payload)) {
      return;
    }
    await showPushNotification(payload);
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetPath = event.notification.data?.url || '/';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windowClients) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.focus();
        if ('navigate' in client) {
          await client.navigate(targetUrl);
        }
        return;
      }
    }

    await self.clients.openWindow(targetUrl);
  })());
});
