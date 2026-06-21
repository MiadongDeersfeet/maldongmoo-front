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
 * @param {string} messageText
 */
export async function sendRoomChat(roomId, messageText) {
  const response = await apiClient.post(`/api/rooms/${roomId}/chats`, {
    messageText,
  });
  return unwrapApiData(response);
}
