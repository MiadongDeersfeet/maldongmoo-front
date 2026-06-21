import apiClient, { unwrapApiData } from '@/api/apiClient.js';
import { normalizeVoiceUploadFile } from '@/utils/voiceFile.js';

/**
 * @param {number | string} roomId
 */
export async function getSections(roomId) {
  const response = await apiClient.get(`/api/rooms/${roomId}/sections`);
  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 * @param {{ sectionTitle: string, sectionRange: string, sectionContent: string, displayOrder: number }} payload
 */
export async function createSection(roomId, payload) {
  const response = await apiClient.post(`/api/rooms/${roomId}/sections`, payload);
  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 * @param {number | string} sectionId
 * @param {{ sectionTitle: string, sectionRange: string, sectionContent: string, isActive: string, displayOrder: number }} payload
 */
export async function updateSection(roomId, sectionId, payload) {
  const response = await apiClient.put(
    `/api/rooms/${roomId}/sections/${sectionId}`,
    payload,
  );
  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 */
export async function getTodayCheckIn(roomId) {
  const response = await apiClient.get(`/api/rooms/${roomId}/check-ins/today`);
  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 * @param {{ counterCount: number }} payload
 */
export async function createCounterCheckIn(roomId, payload) {
  const response = await apiClient.post(
    `/api/rooms/${roomId}/check-ins/counter`,
    payload,
  );
  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 * @param {File | Blob} voiceFile
 */
export async function createVoiceCheckIn(roomId, voiceFile) {
  const uploadFile = normalizeVoiceUploadFile(voiceFile);
  const formData = new FormData();
  formData.append('voiceFile', uploadFile, uploadFile.name);

  const response = await apiClient.post(
    `/api/rooms/${roomId}/check-ins/voice`,
    formData,
  );

  return unwrapApiData(response);
}

/**
 * @param {number | string} roomId
 * @param {string} [date] yyyy-MM-dd
 */
export async function getCheckInFeed(roomId, date) {
  const response = await apiClient.get(`/api/rooms/${roomId}/check-ins`, {
    params: date ? { date } : undefined,
  });
  return unwrapApiData(response);
}

/**
 * @param {number | string} checkInId
 */
export async function addAmen(checkInId) {
  const response = await apiClient.post(`/api/check-ins/${checkInId}/amen`);
  return unwrapApiData(response);
}

/**
 * @param {number | string} checkInId
 */
export async function cancelAmen(checkInId) {
  const response = await apiClient.delete(`/api/check-ins/${checkInId}/amen`);
  return unwrapApiData(response);
}
