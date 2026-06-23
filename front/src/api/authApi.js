import apiClient, { unwrapApiData } from '@/api/apiClient.js';

const KAKAO_OAUTH_PATH = '/oauth2/authorization/kakao';

/** Absolute Kakao OAuth start URL (uses VITE_API_BASE_URL when set). */
export function getKakaoLoginUrl() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

  if (!baseUrl) {
    return KAKAO_OAUTH_PATH;
  }

  return `${baseUrl}${KAKAO_OAUTH_PATH}`;
}

/**
 * Redirects the browser to Kakao OAuth login on the API origin.
 */
export function redirectToKakaoLogin() {
  window.location.href = getKakaoLoginUrl();
}

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
