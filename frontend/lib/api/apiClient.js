import { apiUrl } from "@/config/env";
import { mapError, ApiClientError, getErrorMessage } from "./errors";
import { tokenManager } from "@/lib/auth/tokenManager";

const pending = new Map();
let refreshPromise = null;

function getBaseUrl() {
  return apiUrl.replace(/\/$/, "");
}

async function requestTokenRefresh() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshToken = tokenManager.getRefreshToken();
        const res = await fetch(`${getBaseUrl()}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...(tokenManager.getAccessToken()
              ? { Authorization: `Bearer ${tokenManager.getAccessToken()}` }
              : {}),
          },
          body: JSON.stringify(refreshToken ? { refreshToken } : {}),
        });

        if (!res.ok) {
          tokenManager.clearTokens();
          throw new Error("Token refresh failed");
        }

        const data = await res.json();
        const newAccessToken = data?.data?.accessToken;
        const newRefreshToken = data?.data?.refreshToken;
        if (newAccessToken) {
          tokenManager.setTokens({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          });
        }
        return data;
      } catch (err) {
        tokenManager.clearTokens();
        throw err;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiClient(path, { method = "GET", body, signal, retry = false } = {}) {
  const url = `${getBaseUrl()}/api/v1${path}`;
  const key = `${method}:${url}`;
  if (signal) pending.set(key, signal);

  // Attach access token header if available
  const accessToken = tokenManager.getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  let response;
  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiClientError({
      message: "Network connection error. Please check your internet connection.",
      status: 0,
      code: "NETWORK_ERROR",
    });
  }

  // Handle 401 Unauthorized with token refresh & request retry
  if (response.status === 401 && !retry) {
    const isAuthRoute =
      path.startsWith("/auth/login") ||
      path.startsWith("/auth/refresh") ||
      path.startsWith("/auth/logout");

    if (!isAuthRoute) {
      try {
        await requestTokenRefresh();
        // Retry the original request with the fresh access token
        return apiClient(path, { method, body, signal, retry: true });
      } catch {
        tokenManager.clearTokens();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.assign(`/login?next=${next}`);
        }
      }
    }
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = {
      success: false,
      message:
        response.statusText ||
        (response.status >= 500
          ? `Server error (${response.status})`
          : "Invalid response from server"),
      error: { code: response.status >= 500 ? "SERVER_ERROR" : "PARSE_ERROR", fields: {} },
    };
  }

  if (!response.ok) {
    if (response.status >= 500 && !retry && method === "GET") {
      return apiClient(path, { method, body, signal, retry: true });
    }
    throw mapError(payload, response.status);
  }

  return payload;
}

export { ApiClientError, getErrorMessage };
