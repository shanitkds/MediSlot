module.exports = {
  tags: [
    {
      name: "Audit Logs",
      description: "Immutable system activity audit trail and compliance inspection endpoints",
    },
  ],
  paths: {
    "/api/v1/audit-logs": {
      get: {
        tags: ["Audit Logs"],
        summary: "Query audit logs",
        description: "Retrieve chronological system audit logs with actor, role, action, and entity filtering. Requires 'audit.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "query",
            schema: { type: "string" },
            description: "Filter by actor or target User ObjectId",
          },
          {
            name: "role",
            in: "query",
            schema: { type: "string", example: "Super Admin" },
            description: "Filter by actor role",
          },
          {
            name: "module",
            in: "query",
            schema: { type: "string", example: "appointments" },
            description: "Filter by system module (e.g. auth, doctors, appointments)",
          },
          {
            name: "action",
            in: "query",
            schema: { type: "string", example: "create" },
            description: "Filter by operation action (e.g. login, create, update, delete)",
          },
          {
            name: "entity",
            in: "query",
            schema: { type: "string", example: "Appointment" },
            description: "Filter by target entity type",
          },
          {
            name: "entityId",
            in: "query",
            schema: { type: "string" },
            description: "Filter by target entity identifier",
          },
          {
            name: "from",
            in: "query",
            schema: { type: "string", format: "date-time" },
            description: "Start timestamp filter",
          },
          {
            name: "to",
            in: "query",
            schema: { type: "string", format: "date-time" },
            description: "End timestamp filter",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Pagination page index",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
            description: "Records per page (max 100)",
          },
        ],
        responses: {
          200: {
            description: "Paginated list of audit records",
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
                          items: { $ref: "#/components/schemas/AuditLogItem" },
                        },
                        pagination: { $ref: "#/components/schemas/PaginationMeta" },
                      },
                    },
                  },
                },
              },
            },
          },
          403: { description: "Forbidden - Insufficient permissions" },
        },
      },
    },
  },
  components: {
    schemas: {
      AuditLogItem: {
        type: "object",
        properties: {
          id: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
          userId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d2" },
          actorId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d2" },
          actorEmail: { type: "string", example: "admin@example.com" },
          role: { type: "string", example: "Super Admin" },
          action: { type: "string", example: "appointments.create" },
          module: { type: "string", example: "appointments" },
          entity: { type: "string", example: "Appointment" },
          entityId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d3" },
          timestamp: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
