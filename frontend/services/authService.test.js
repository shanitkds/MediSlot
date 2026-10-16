import { authService } from "./authService";
import { tokenManager } from "@/lib/auth/tokenManager";
import * as apiClientModule from "@/lib/api/apiClient";

jest.mock("@/lib/api/apiClient", () => ({
  apiClient: jest.fn(),
}));

describe("authService Token and API Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenManager.clearTokens();
  });

  it("stores access and refresh tokens upon successful login", async () => {
    apiClientModule.apiClient.mockResolvedValueOnce({
      success: true,
      data: {
        user: { id: "u1", email: "doc@hospital.org", role: "doctor" },
        accessToken: "jwt-access-token-abc",
        refreshToken: "refresh-token-xyz",
      },
    });

    const res = await authService.login({
      email: "doc@hospital.org",
      password: "SecretPassword123!",
    });

    expect(apiClientModule.apiClient).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: { email: "doc@hospital.org", password: "SecretPassword123!" },
    });

    expect(tokenManager.getAccessToken()).toBe("jwt-access-token-abc");
    expect(tokenManager.getRefreshToken()).toBe("refresh-token-xyz");
    expect(res.data.user.role).toBe("doctor");
  });

  it("clears tokens on logout", async () => {
    tokenManager.setTokens({
      accessToken: "access-token-to-delete",
      refreshToken: "refresh-token-to-delete",
    });

    apiClientModule.apiClient.mockResolvedValueOnce({
      success: true,
      message: "Logged out",
    });

    await authService.logout();

    expect(apiClientModule.apiClient).toHaveBeenCalledWith("/auth/logout", {
      method: "POST",
      body: { refreshToken: "refresh-token-to-delete" },
    });

    expect(tokenManager.getAccessToken()).toBeNull();
    expect(tokenManager.getRefreshToken()).toBeNull();
  });

  it("rotates tokens upon successful refresh", async () => {
    tokenManager.setTokens({
      accessToken: "old-access-token",
      refreshToken: "active-refresh-token",
    });

    apiClientModule.apiClient.mockResolvedValueOnce({
      success: true,
      data: {
        user: { id: "u1" },
        accessToken: "fresh-new-access-token",
        refreshToken: "rotated-refresh-token",
      },
    });

    await authService.refresh();

    expect(tokenManager.getAccessToken()).toBe("fresh-new-access-token");
    expect(tokenManager.getRefreshToken()).toBe("rotated-refresh-token");
  });
});
