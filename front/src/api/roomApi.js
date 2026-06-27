import apiClient, { unwrapApiData } from '@/api/apiClient.js';

/**
 * @returns {Promise<Array<{ roomId: number, roomName: string, leaderId: number, memberLimit: number, memberCount: number, myRole: string, joinedAt: string, inviteCode: string | null }>>}
 */
export async function getMyRooms() {
  const response = await apiClient.get('/api/rooms');
  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 * @returns {Promise<{ roomId: number, roomName: string, leaderId: number, memberLimit: number, memberCount: number, myRole: string, inviteCode: string | null, createdAt: string }>}
 */
export async function getRoomDetail(roomId) {
  const response = await apiClient.get(`/api/rooms/${roomId}`);
  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 * @returns {Promise<Array<{ memberId: number, memberName: string, profileImageUrl: string | null, roomRole: string, joinedAt: string }>>}
 */
export async function getRoomMembers(roomId) {
  const response = await apiClient.get(`/api/rooms/${roomId}/members`);
  return unwrapApiData(response);
}

/**
 * @param {{ roomName: string, memberLimit: number }} payload
 * @returns {Promise<{ roomId: number, roomName: string, leaderId: number, memberLimit: number, inviteCode: string }>}
 */
export async function createRoom(payload) {
  const response = await apiClient.post('/api/rooms', payload);
  return unwrapApiData(response);
}

/**
 * @param {string} inviteCode
 * @returns {Promise<{ roomId: number, roomName: string, myRole: string, memberCount: number }>}
 */
export async function joinRoom(inviteCode) {
  const response = await apiClient.post('/api/rooms/join', { inviteCode });
  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 * @param {number | string} memberId
 */
export async function kickRoomMember(roomId, memberId) {
  const response = await apiClient.post(`/api/rooms/${roomId}/members/${memberId}/kick`);
  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 * @param {number | string} memberId
 */
export async function encourageRoomMember(roomId, memberId) {
  const response = await apiClient.post(`/api/rooms/${roomId}/members/${memberId}/encourage`);
  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 */
export async function leaveRoom(roomId) {
  const response = await apiClient.post(`/api/rooms/${roomId}/leave`);
  return unwrapApiData(response);
}
