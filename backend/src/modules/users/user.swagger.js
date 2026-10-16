module.exports = {
  tags: [
    {
      name: "Users",
      description: "User account management, staff creation (Doctors & Receptionists), role assignment, and status controls",
    },
  ],
  paths: {
    "/api/v1/users/doctors": {
      post: {
        tags: ["Users"],
        summary: "Create doctor account",
        description: "Creates doctor login account with password, assigned Doctor role, and optional clinical profile. Super Admin only. Requires 'users.create' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Dr. Gregory House" },
                  email: { type: "string", format: "email", example: "dr.house@clinic.org" },
                  password: { type: "string", format: "password", example: "SecurePass123!" },
                  departmentId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
                  specialization: { type: "string", example: "Diagnostics" },
                  consultationDuration: { type: "integer", default: 15 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Doctor account created successfully",
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
          409: { description: "Email already exists" },
        },
      },
    },
    "/api/v1/users/receptionists": {
      post: {
        tags: ["Users"],
        summary: "Create receptionist account",
        description: "Creates front-desk receptionist staff login account. Super Admin only. Requires 'users.create' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Mary Jane Watson" },
                  email: { type: "string", format: "email", example: "reception@clinic.org" },
                  password: { type: "string", format: "password", example: "SecureReception123!" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Receptionist account created",
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
    "/api/v1/users": {
      get: {
        tags: ["Users"],
        summary: "List users",
        description: "List user accounts with search, role filter, status filter, and pagination. Super Admin only. Requires 'users.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Search across name and email",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["active", "disabled"] },
          },
          {
            name: "roleId",
            in: "query",
            schema: { type: "string" },
          },
          {
            name: "isArchive",
            in: "query",
            schema: { type: "boolean" },
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          200: {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        items: {
                          type: "array",
                          items: { $ref: "#/components/schemas/User" },
                        },
                        pagination: { $ref: "#/components/schemas/PaginationMeta" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user details",
        description: "Retrieve complete user account details by ID. Super Admin only. Requires 'users.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "User ObjectId",
          },
        ],
        responses: {
          200: {
            description: "User found",
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
          404: { description: "User not found" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update user details",
        description: "Update user's name, email, password, or assigned role IDs. Super Admin only. Requires 'users.update' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Dr. Gregory House" },
                  email: { type: "string", format: "email", example: "dr.house@clinic.org" },
                  password: { type: "string", format: "password" },
                  roleIds: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "User updated successfully",
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
      delete: {
        tags: ["Users"],
        summary: "Soft-delete/archive user",
        description: "Soft deletes/archives the user account and invalidates active sessions. Super Admin only. Requires 'users.delete' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "User account archived successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "User deleted successfully" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/users/{id}/status": {
      patch: {
        tags: ["Users"],
        summary: "Update user active status",
        description: "Activates or disables a user account. Disabling revokes active sessions. Super Admin only. Requires 'users.update' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["active", "disabled"], example: "active" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "User status updated",
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
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
          name: { type: "string", example: "Dr. Gregory House" },
          email: { type: "string", example: "dr.house@clinic.org" },
          status: { type: "string", enum: ["active", "disabled"], example: "active" },
          isArchive: { type: "boolean", example: false },
          roleIds: {
            type: "array",
            items: { type: "string" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
