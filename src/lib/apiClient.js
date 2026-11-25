// Swari Enterprise Hardened Typed API Client
// Features: Typed ApiError, automatic JWT Bearer injection, refresh token rotation on 401,
// automatic Idempotency-Key on mutations, and exponential backoff retry on 5xx/network errors.

import { tokenManager } from './tokenManager.js';

export class ApiError extends Error {
  constructor(status, error, message, details = null) {
    super(message || error || `HTTP Error ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.error = error;
    this.details = details;
  }
}

export const API_BASE = (typeof window !== 'undefined' && window.location.port === '5174')
  ? 'http://localhost:8000/api/v1' 
  : (typeof window === 'undefined'
      ? (typeof process !== 'undefined' && process.env?.SWARI_API_URL ? `${process.env.SWARI_API_URL}/api/v1` : 'http://localhost:8000/api/v1')
      : '/api/v1');

let refreshPromise = null;

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      if (!refreshToken) {
        tokenManager.clearTokens();
        throw new ApiError(401, 'NO_REFRESH_TOKEN', 'Session expired. Please sign in again.');
      }

      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!res.ok) {
        tokenManager.clearTokens();
        throw new ApiError(res.status, 'REFRESH_FAILED', 'Session refresh failed.');
      }

      const data = await res.json();
      if (data.data && data.data.accessToken) {
        tokenManager.setTokens({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken || refreshToken
        });
        return data.data.accessToken;
      }

      tokenManager.clearTokens();
      throw new ApiError(401, 'INVALID_REFRESH_RESPONSE', 'Invalid token refresh payload.');
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const maxRetries = options.retries !== undefined ? options.retries : (method === 'GET' ? 2 : 1);
  const timeoutMs = options.timeoutMs || 15000;

  const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  const idempotencyKey = options.idempotencyKey || (isMutation ? generateUUID() : null);

  let attempt = 0;

  while (attempt <= maxRetries) {
    attempt++;
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    // Attach Authorization Bearer token if not explicitly provided
    if (!headers.has('Authorization')) {
      const token = tokenManager.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    if (idempotencyKey && !headers.has('Idempotency-Key')) {
      headers.set('Idempotency-Key', idempotencyKey);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        signal: options.signal || controller.signal
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized: Attempt token refresh once
      if (response.status === 401 && !options._isRetryAfterRefresh && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
        try {
          const newToken = await refreshAccessToken();
          if (newToken) {
            return await request(endpoint, {
              ...options,
              _isRetryAfterRefresh: true,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${newToken}`
              }
            });
          }
        } catch (refreshErr) {
          throw refreshErr instanceof ApiError ? refreshErr : new ApiError(401, 'AUTH_EXPIRED', 'Your session has expired. Please sign in again.');
        }
      }

      // Check HTTP Success
      if (!response.ok) {
        let errData = null;
        try {
          errData = await response.json();
        } catch {
          // Non-JSON response body
        }

        const errorCode = errData?.error || `HTTP_${response.status}`;
        const errorMessage = errData?.message || `Request failed with status ${response.status}`;
        const details = errData?.details || null;

        // Retry 5xx errors if retry attempts remain
        if (response.status >= 500 && attempt <= maxRetries) {
          const delay = Math.min(300 * Math.pow(2, attempt - 1), 2000);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        throw new ApiError(response.status, errorCode, errorMessage, details);
      }

      // Return parsed JSON or null
      if (response.status === 204) return null;
      return await response.json();

    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof ApiError) {
        throw err;
      }

      const isNetworkOrTimeout = err.name === 'AbortError' || err.name === 'TypeError' || err.message.includes('fetch');

      if (isNetworkOrTimeout && attempt <= maxRetries) {
        const delay = Math.min(300 * Math.pow(2, attempt - 1), 2000);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      throw new ApiError(
        0,
        err.name === 'AbortError' ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
        err.name === 'AbortError' ? 'Network request timed out. Please check your connectivity.' : 'Unable to connect to the Swari servers. Please check your network.',
        err.message
      );
    }
  }
}

export const apiClient = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' })
};
