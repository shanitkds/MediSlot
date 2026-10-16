module.exports = {
  tags: [
    {
      name: "Profile",
      description: "Personal profile management for the authenticated user",
    },
  ],
  paths: {
    "/api/v1/profile": {
      get: {
        tags: ["Profile"],
        summary: "Get my profile",
        description: "Retrieves profile information for the currently authenticated user.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: "Profile information",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: { description: "Unauthorized" },
        },
      },
      patch: {
        tags: ["Profile"],
        summary: "Update my profile",
        description: "Updates authenticated user's name, avatarUrl, or in-app notification preference.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Dr. Sarah Jenkins" },
                  avatarUrl: { type: "string", example: "https://example.com/avatar.jpg" },
                  notifyInApp: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
