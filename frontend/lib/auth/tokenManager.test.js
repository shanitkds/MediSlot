import { tokenManager } from "./tokenManager";

describe("tokenManager", () => {
  beforeEach(() => {
    tokenManager.clearTokens();
    localStorage.clear();
  });

  it("stores and retrieves access token and refresh token", () => {
    expect(tokenManager.hasAccessToken()).toBe(false);
    expect(tokenManager.hasRefreshToken()).toBe(false);

    tokenManager.setTokens({
      accessToken: "mock-access-token-123",
      refreshToken: "mock-refresh-token-456",
    });

    expect(tokenManager.getAccessToken()).toBe("mock-access-token-123");
    expect(tokenManager.getRefreshToken()).toBe("mock-refresh-token-456");
    expect(tokenManager.hasAccessToken()).toBe(true);
    expect(tokenManager.hasRefreshToken()).toBe(true);
  });

  it("clears tokens on clearTokens()", () => {
    tokenManager.setTokens({
      accessToken: "access-to-be-cleared",
      refreshToken: "refresh-to-be-cleared",
    });

    tokenManager.clearTokens();

    expect(tokenManager.getAccessToken()).toBeNull();
    expect(tokenManager.getRefreshToken()).toBeNull();
    expect(tokenManager.hasAccessToken()).toBe(false);
    expect(tokenManager.hasRefreshToken()).toBe(false);
  });
});
