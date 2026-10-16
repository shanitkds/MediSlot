module.exports = {
  tags: [
    {
      name: "Authentication",
      description: "Stateful session login, cookie management, token refresh, and password recovery",
    },
  ],
  paths: {
    "/api/v1/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "User login",
        description: "Authenticates user credentials, sets HTTP-only 'sid' session cookie and 'access_token' cookie, and returns authenticated user profile.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "admin@example.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "ChangeMeNow!23",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful; sets 'sid' and 'access_token' cookies",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login successful" },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/AuthUser" },
                        accessToken: { type: "string" },
                        refreshToken: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Invalid email or password" },
          429: { description: "Too many failed attempts; account temporarily locked" },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Refresh access token",
        description: "Exchanges valid session cookie or refresh token for a fresh access token.",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Fresh tokens issued",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        accessToken: { type: "string" },
                        refreshToken: { type: "string" },
                        user: { $ref: "#/components/schemas/AuthUser" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Invalid or expired session" },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout",
        description: "Invalidates the active session in MongoDB and clears session and access cookies.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: "Logged out successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Logged out successfully" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current authenticated user",
        description: "Returns currently authenticated user profile, resolved roles, permissions, and doctor reference.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: "Current user session context",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/AuthUser" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/api/v1/auth/forgot-password": {
      post: {
        tags: ["Authentication"],
        summary: "Request password reset",
        description: "Sends a one-time password reset token link to the user's registered email address.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "doctor@example.com",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Reset email dispatched (if account exists)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "If an account exists, a reset link was sent.",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/reset-password": {
      post: {
        tags: ["Authentication"],
        summary: "Complete password reset",
        description: "Sets a new password using a valid one-time password reset token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: { type: "string", example: "a1b2c3d4e5f6..." },
                  password: {
                    type: "string",
                    format: "password",
                    example: "NewSecurePassword123!",
                    description: "At least 8 chars with letters and numbers",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password reset successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Password reset successful" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid or expired token" },
        },
      },
    },
    "/api/v1/auth/change-password": {
      post: {
        tags: ["Authentication"],
        summary: "Change password",
        description: "Changes the authenticated user's password given their current password.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string", format: "password" },
                  newPassword: {
                    type: "string",
                    format: "password",
                    example: "BrandNewPassword123!",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Password changed successfully" },
                  },
                },
              },
            },
          },
          400: { description: "Incorrect current password" },
        },
      },
    },
  },
  components: {
    schemas: {
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
          _id: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
          name: { type: "string", example: "Dr. Sarah Jenkins" },
          email: { type: "string", example: "sarah.jenkins@example.com" },
          status: { type: "string", enum: ["active", "disabled"], example: "active" },
          roles: {
            type: "array",
            items: { type: "string", example: "Doctor" },
          },
          permissions: {
            type: "array",
            items: { type: "string", example: "appointments.view" },
          },
          isSuperAdmin: { type: "boolean", example: false },
          doctor: {
            type: "object",
            nullable: true,
            properties: {
              _id: { type: "string" },
              departmentId: { type: "string" },
              specialization: { type: "string" },
              consultationDuration: { type: "number" },
            },
          },
        },
      },
    },
  },
};
