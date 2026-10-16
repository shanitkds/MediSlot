const ACCESS_TOKEN_KEY = "medislot_access_token";
const REFRESH_TOKEN_KEY = "medislot_refresh_token";

let inMemoryAccessToken = null;
let inMemoryRefreshToken = null;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export const tokenManager = {
  getAccessToken() {
    if (inMemoryAccessToken) return inMemoryAccessToken;
    if (isBrowser()) {
      try {
        const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (stored) {
          inMemoryAccessToken = stored;
          return stored;
        }
      } catch {
        // LocalStorage might be restricted or unavailable
      }
    }
    return null;
  },

  getRefreshToken() {
    if (inMemoryRefreshToken) return inMemoryRefreshToken;
    if (isBrowser()) {
      try {
        const stored = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (stored) {
          inMemoryRefreshToken = stored;
          return stored;
        }
      } catch {
        // LocalStorage might be restricted or unavailable
      }
    }
    return null;
  },

  setTokens({ accessToken, refreshToken } = {}) {
    if (accessToken) {
      inMemoryAccessToken = accessToken;
      if (isBrowser()) {
        try {
          localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        } catch {
          // ignore
        }
      }
    }

    if (refreshToken) {
      inMemoryRefreshToken = refreshToken;
      if (isBrowser()) {
        try {
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        } catch {
          // ignore
        }
      }
    }
  },

  clearTokens() {
    inMemoryAccessToken = null;
    inMemoryRefreshToken = null;
    if (isBrowser()) {
      try {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } catch {
        // ignore
      }
    }
  },

  hasAccessToken() {
    return Boolean(this.getAccessToken());
  },

  hasRefreshToken() {
    return Boolean(this.getRefreshToken());
  },
};
