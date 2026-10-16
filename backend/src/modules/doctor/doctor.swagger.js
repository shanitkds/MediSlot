module.exports = {
  tags: [
    {
      name: "Doctors",
      description: "Physician directory, specializations, department assignments, and profile management",
    },
  ],
  paths: {
    "/api/v1/doctors": {
      post: {
        tags: ["Doctors"],
        summary: "Create doctor profile",
        description: "Creates doctor profile with User account and assigned active department. Enforces unique email. Super Admin only.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["departmentId", "specialization"],
                properties: {
                  name: { type: "string", example: "Dr. Alexander Fleming" },
                  email: { type: "string", format: "email", example: "fleming@clinic.org" },
                  password: { type: "string", format: "password", example: "SecurePass123!" },
                  departmentId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
                  specialization: { type: "string", example: "Microbiology & Immunology" },
                  consultationDuration: { type: "integer", default: 15, minimum: 5, maximum: 180 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Doctor profile created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Doctor" },
                  },
                },
              },
            },
          },
          400: { description: "Department is invalid or inactive" },
          409: { description: "Email already exists" },
        },
      },
      get: {
        tags: ["Doctors"],
        summary: "List doctors",
        description: "List all doctors with search, department filtering, specialization, status, and pagination. Requires 'doctors.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Search text across doctor name, email, or specialization",
          },
          {
            name: "departmentId",
            in: "query",
            schema: { type: "string" },
            description: "Filter by Department ObjectId",
          },
          {
            name: "specialization",
            in: "query",
            schema: { type: "string" },
            description: "Filter by specialization",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["active", "disabled"] },
            description: "Filter by active status",
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
            description: "List of doctors",
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
                          items: { $ref: "#/components/schemas/Doctor" },
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
    "/api/v1/doctors/{id}": {
      get: {
        tags: ["Doctors"],
        summary: "Get doctor by ID",
        description: "Lookup doctor profile by Doctor ID or associated User ID. Requires 'doctors.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Doctor ObjectId or User ObjectId",
          },
        ],
        responses: {
          200: {
            description: "Doctor profile details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Doctor" },
                  },
                },
              },
            },
          },
          404: { description: "Doctor not found" },
        },
      },
      patch: {
        tags: ["Doctors"],
        summary: "Update doctor profile",
        description: "Updates doctor profile details (name, consultation duration, specialization, status). Requires 'doctors.update' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Doctor ObjectId",
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
                  consultationDuration: { type: "integer", example: 20 },
                  slotDurationMinutes: { type: "integer", example: 20 },
                  specialization: { type: "string", example: "Diagnostic Medicine" },
                  departmentId: { type: "string" },
                  status: { type: "string", enum: ["active", "disabled"] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Doctor profile updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Doctor" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Doctors"],
        summary: "Deactivate or delete doctor",
        description: "Deactivates doctor and marks account disabled. If query parameter 'permanent=true' is passed and the doctor has 0 appointments, permanently cleans up the record. Super Admin only.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Doctor ObjectId",
          },
          {
            name: "permanent",
            in: "query",
            schema: { type: "boolean" },
            description: "Permanently delete if doctor has zero appointment records",
          },
        ],
        responses: {
          200: {
            description: "Doctor deactivated or deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/doctors/{id}/specialization": {
      patch: {
        tags: ["Doctors"],
        summary: "Update specialization",
        description: "Updates doctor's clinical specialization. Super Admin only.",
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
                required: ["specialization"],
                properties: {
                  specialization: { type: "string", example: "Neurology" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Specialization updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Doctor" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/doctors/{id}/department": {
      patch: {
        tags: ["Doctors"],
        summary: "Change doctor department",
        description: "Assigns doctor to a new active department. Verifies department exists and is active. Super Admin only.",
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
                required: ["departmentId"],
                properties: {
                  departmentId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Department assigned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Doctor" },
                  },
                },
              },
            },
          },
          400: { description: "Department not found or inactive" },
        },
      },
    },
  },
  components: {
    schemas: {
      Doctor: {
        type: "object",
        properties: {
          _id: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
          userId: {
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string", example: "Dr. Alexander Fleming" },
              email: { type: "string", example: "fleming@clinic.org" },
              status: { type: "string", example: "active" },
            },
          },
          departmentId: {
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string", example: "Cardiology" },
            },
          },
          specialization: { type: "string", example: "Cardiovascular Surgery" },
          consultationDuration: { type: "integer", example: 15 },
          status: { type: "string", enum: ["active", "disabled"], example: "active" },
          isActive: { type: "boolean", example: true },
        },
      },
    },
  },
};
