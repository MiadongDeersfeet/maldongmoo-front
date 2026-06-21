import apiClient, { unwrapApiData } from '@/api/apiClient.js';

/** Kakao OAuth2 login entry (Spring Security default). */
export const KAKAO_LOGIN_URL = '/oauth2/authorization/kakao';

/**
 * @typedef {Object} MeResponse
 * @property {boolean} authenticated
 * @property {number} memberId
 * @property {string} memberName
 * @property {string | null} profileImageUrl
 * @property {string} role
 */

/**
 * @typedef {Object} CsrfTokenResponse
 * @property {string} headerName
 * @property {string} parameterName
 * @property {string} token
 */

/**
 * Redirects the browser to Kakao OAuth login.
 */
export function redirectToKakaoLogin() {
  window.location.href = KAKAO_LOGIN_URL;
}

/**
 * @returns {Promise<CsrfTokenResponse>}
 */
export async function getCsrfToken() {
  const response = await apiClient.get('/api/csrf');
  return unwrapApiData(response);
}

/**
 * @returns {Promise<MeResponse>}
 */
export async function getMe() {
  const response = await apiClient.get('/api/me');
  return unwrapApiData(response);
}

/**
 * @returns {Promise<void>}
 */
export async function logout() {
  await apiClient.post('/api/auth/logout');
}
