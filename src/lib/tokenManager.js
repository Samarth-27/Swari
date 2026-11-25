// Swari Enterprise Token Manager
// Manages short-lived JWT access tokens and long-lived refresh tokens with rotation

const ACCESS_TOKEN_KEY = 'swari_access_token';
const REFRESH_TOKEN_KEY = 'swari_refresh_token';
const USER_KEY = 'swari_auth_user';

class TokenManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.listeners = new Set();
    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;
    try {
      this.accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY) || null;
      this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || null;
      const storedUser = localStorage.getItem(USER_KEY);
      this.user = storedUser ? JSON.parse(storedUser) : null;
    } catch {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  getRefreshToken() {
    if (this.refreshToken) return this.refreshToken;
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(REFRESH_TOKEN_KEY) || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  getUser() {
    if (this.user) return this.user;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(USER_KEY);
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  setTokens({ accessToken, refreshToken, user }) {
    if (accessToken !== undefined) this.accessToken = accessToken || null;
    if (refreshToken !== undefined) this.refreshToken = refreshToken || null;
    if (user !== undefined) this.user = user || null;

    if (typeof window !== 'undefined') {
      try {
        if (this.accessToken) {
          sessionStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken);
          localStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken);
        } else {
          sessionStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(ACCESS_TOKEN_KEY);
        }

        if (this.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken);
        } else if (refreshToken === null) {
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }

        if (this.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(this.user));
        } else if (user === null) {
          localStorage.removeItem(USER_KEY);
        }
      } catch (err) {
        console.warn('[TokenManager] Failed to persist tokens:', err);
      }
    }

    this.notify(this.user || this.getUser());
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } catch (err) {
        console.warn('[TokenManager] Failed to clear tokens:', err);
      }
    }
    this.notify(null);
  }

  isAccessTokenExpired() {
    if (!this.accessToken) return true;
    try {
      const payloadBase64 = this.accessToken.split('.')[1];
      if (!payloadBase64) return true;
      const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(decodedJson);
      if (!payload.exp) return false;
      return (payload.exp * 1000) < (Date.now() + 30000);
    } catch {
      return true;
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(user) {
    for (const listener of this.listeners) {
      try {
        listener(user);
      } catch (e) {
        console.error('[TokenManager] Listener error:', e);
      }
    }
  }
}

export const tokenManager = new TokenManager();
