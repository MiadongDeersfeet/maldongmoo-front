import axios from 'axios';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * @typedef {Object} ApiErrorPayload
 * @property {number} status
 * @property {string} code
 * @property {string} message
 * @property {unknown} [data]
 */

/**
 * Backend ApiResponse error with HTTP status and business code.
 */
export class ApiError extends Error {
  /** @param {ApiErrorPayload} payload */
  constructor({ status, code, message, data }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.message = message;
    this.data = data;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isConflict() {
    return this.status === 409;
  }

  get isServerError() {
    return this.status >= 500;
  }

  get isCsrfInvalid() {
    return this.code === 'AUTH_CSRF_INVALID';
  }

  get isRoomAccessDenied() {
    return this.code === 'ROOM_ACCESS_DENIED';
  }
}

/**
 * Reads the Spring Security CSRF cookie set by GET /api/csrf.
 */
export function getXsrfTokenFromCookie() {
  const raw = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')
    .slice(1)
    .join('=');

  if (!raw) {
    return '';
  }

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
});

/** CSRF bootstrap calls use the same client without mutating-method interceptor recursion. */
const csrfBootstrapClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
});

let csrfTokenPromise = null;

/**
 * Ensures a CSRF token is available via cookie (preferred) or /api/csrf response body.
 */
export async function ensureCsrfToken() {
  if (!csrfTokenPromise) {
    csrfTokenPromise = csrfBootstrapClient
      .get('/api/csrf')
      .then((response) => {
        const bodyToken = response.data?.data?.token ?? '';
        const cookieToken = getXsrfTokenFromCookie();
        return cookieToken || bodyToken;
      })
      .finally(() => {
        csrfTokenPromise = null;
      });
  }

  return csrfTokenPromise;
}

apiClient.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toUpperCase();

  if (UNSAFE_METHODS.has(method)) {
    const token = await ensureCsrfToken();

    if (token) {
      config.headers.set('X-XSRF-TOKEN', token);
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;

    if (body && body.success === false) {
      return Promise.reject(
        new ApiError({
          status: response.status,
          code: body.code ?? 'UNKNOWN',
          message: body.message ?? '요청 처리에 실패했습니다.',
          data: body.data,
        }),
      );
    }

    return response;
  },
  (error) => {
    const response = error.response;

    if (response?.data) {
      const body = response.data;

      return Promise.reject(
        new ApiError({
          status: response.status,
          code: body.code ?? 'UNKNOWN',
          message: body.message ?? error.message,
          data: body.data,
        }),
      );
    }

    return Promise.reject(error);
  },
);

/**
 * Unwraps a successful ApiResponse and returns the `data` field.
 * @param {import('axios').AxiosResponse} response
 */
export function unwrapApiData(response) {
  return response.data.data;
}

export default apiClient;
