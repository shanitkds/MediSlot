import { apiClient } from "@/lib/api/apiClient";
import { tokenManager } from "@/lib/auth/tokenManager";

export const authService = {
  signup: (body) => apiClient("/auth/signup", { method: "POST", body }),

  login: async (body) => {
    const res = await apiClient("/auth/login", { method: "POST", body });
    if (res?.data?.accessToken || res?.data?.refreshToken) {
      tokenManager.setTokens({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
    }
    return res;
  },

  refresh: async () => {
    const refreshToken = tokenManager.getRefreshToken();
    const res = await apiClient("/auth/refresh", {
      method: "POST",
      body: refreshToken ? { refreshToken } : {},
    });
    if (res?.data?.accessToken || res?.data?.refreshToken) {
      tokenManager.setTokens({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      });
    }
    return res;
  },

  logout: async () => {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      return await apiClient("/auth/logout", {
        method: "POST",
        body: refreshToken ? { refreshToken } : {},
      });
    } finally {
      tokenManager.clearTokens();
    }
  },

  me: () => apiClient("/auth/me"),

  resendVerification: (data) =>
    apiClient("/auth/resend-verification", {
      method: "POST",
      body: typeof data === "string" ? { email: data } : data,
    }),

  forgotPassword: (data) =>
    apiClient("/auth/forgot-password", {
      method: "POST",
      body: typeof data === "string" ? { email: data } : data,
    }),

  resetPassword: (body) => apiClient("/auth/reset-password", { method: "POST", body }),

  changePassword: (body) => apiClient("/auth/change-password", { method: "POST", body }),
};
