import apiClient, { unwrapApiData } from '@/api/apiClient.js';

/**
 * @param {number | string} roomId
 */
export async function getRoomChats(roomId) {
  const response = await apiClient.get(`/api/rooms/${roomId}/chats`);
  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 * @param {number | string} lastReadChatId
 */
export async function markChatAsRead(roomId, lastReadChatId) {
  const response = await apiClient.put(`/api/rooms/${roomId}/chats/read`, {
    lastReadChatId: Number(lastReadChatId),
  });
  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 * @returns {Promise<{ unreadCount: number }>}
 */
export async function getUnreadChatCount(roomId) {
  const response = await apiClient.get(`/api/rooms/${roomId}/chats/unread-count`);
  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 * @param {string} messageText
 */
export async function sendRoomChat(roomId, messageText) {
  const response = await apiClient.post(`/api/rooms/${roomId}/chats`, {
    messageText,
  });
  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 * @param {number | string} chatId
 * @param {string} reactionType
 */
export async function upsertChatReaction(roomId, chatId, reactionType) {
  const response = await apiClient.put(`/api/rooms/${roomId}/chats/${chatId}/reactions`, {
    reactionType,
  });
  return unwrapApiData(response);
}
