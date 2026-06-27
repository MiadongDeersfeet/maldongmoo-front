import apiClient from '@/api/apiClient.js';

export async function getPushPublicKey() {
  const response = await apiClient.get('/api/push/vapid-public-key');
  return response.data.data;
}

export async function upsertPushSubscription(subscription) {
  const json = subscription.toJSON();
  await apiClient.put('/api/push/subscriptions', {
    endpoint: json.endpoint,
    p256dhKey: json.keys.p256dh,
    authKey: json.keys.auth,
  });
}

export async function removePushSubscription(endpoint) {
  await apiClient.delete('/api/push/subscriptions', {
    data: { endpoint },
  });
}
