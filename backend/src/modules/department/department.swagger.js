module.exports = {
  tags: [
    {
      name: "Departments",
      description: "Medical clinic departments management, active status flags, and doctor allocations",
    },
  ],
  paths: {
    "/api/v1/departments": {
      post: {
        tags: ["Departments"],
        summary: "Create department",
        description: "Creates a new clinical department. Enforces unique case-insensitive department name. Requires 'departments.create' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Cardiology", minLength: 2, maxLength: 100 },
                  description: { type: "string", example: "Heart and cardiovascular system care" },
                  isActive: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Department successfully created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Department created successfully" },
                    data: { $ref: "#/components/schemas/Department" },
                  },
                },
              },
            },
          },
          409: { description: "Department with this name already exists" },
        },
      },
      get: {
        tags: ["Departments"],
        summary: "List departments",
        description: "List all clinical departments with search, active status filter, and pagination. Requires 'departments.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Search text by department name or description",
          },
          {
            name: "isActive",
            in: "query",
            schema: { type: "boolean" },
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
          {
            name: "sort",
            in: "query",
            schema: { type: "string", default: "name" },
          },
        ],
        responses: {
          200: {
            description: "List of departments",
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
                          items: { $ref: "#/components/schemas/Department" },
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
    "/api/v1/departments/{id}": {
      get: {
        tags: ["Departments"],
        summary: "Get department by ID",
        description: "Retrieve single department details. Requires 'departments.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Department ObjectId",
          },
        ],
        responses: {
          200: {
            description: "Department found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Department" },
                  },
                },
              },
            },
          },
          404: { description: "Department not found" },
        },
      },
      patch: {
        tags: ["Departments"],
        summary: "Update department",
        description: "Update department details. Prevents deactivation if department has active doctors or future scheduled appointments. Requires 'departments.update' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Department ObjectId",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Department updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Department" },
                  },
                },
              },
            },
          },
          400: { description: "Cannot deactivate department with active doctors or future appointments" },
        },
      },
      delete: {
        tags: ["Departments"],
        summary: "Delete or deactivate department",
        description: "Safely deletes department if it has zero doctor or appointment references; otherwise deactivates it to preserve historical records. Requires 'departments.delete' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Department ObjectId",
          },
        ],
        responses: {
          200: {
            description: "Department deleted or deactivated",
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
          400: { description: "Cannot delete or deactivate department with active references" },
        },
      },
    },
  },
  components: {
    schemas: {
      Department: {
        type: "object",
        properties: {
          _id: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
          name: { type: "string", example: "Cardiology" },
          description: { type: "string", example: "Comprehensive cardiovascular care" },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
