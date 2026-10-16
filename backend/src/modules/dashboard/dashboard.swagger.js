module.exports = {
  tags: [
    {
      name: "Dashboard",
      description: "Aggregated clinical performance metrics, today's schedule, and role-tailored statistics",
    },
  ],
  paths: {
    "/api/v1/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Get dashboard clinical summary",
        description: "Returns high-level statistics tailored to caller's role (Super Admin clinic-wide, Receptionist front-desk, or Doctor personal caseload). Requires 'dashboard.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "date",
            in: "query",
            schema: { type: "string", example: "2026-10-20" },
            description: "Date in YYYY-MM-DD format (defaults to today)",
          },
          {
            name: "doctorId",
            in: "query",
            schema: { type: "string" },
            description: "Super Admin filter for specific doctor metrics",
          },
          {
            name: "role",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "super_admin",
                "doctor",
                "receptionist",
                "Super Admin",
                "Doctor",
                "Receptionist",
              ],
            },
            description: "Perspective role filter for Super Admin previewing other roles",
          },
        ],
        responses: {
          200: {
            description: "Aggregated clinical metrics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        todayAppointmentsCount: { type: "integer", example: 12 },
                        statusBreakdown: {
                          type: "object",
                          properties: {
                            scheduled: { type: "integer", example: 6 },
                            arrived: { type: "integer", example: 2 },
                            completed: { type: "integer", example: 3 },
                            cancelled: { type: "integer", example: 1 },
                          },
                        },
                        totalDoctors: { type: "integer", example: 8 },
                        totalPatients: { type: "integer", example: 140 },
                        totalDepartments: { type: "integer", example: 4 },
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
    "/api/v1/dashboard/appointments/today": {
      get: {
        tags: ["Dashboard"],
        summary: "Get today's appointments",
        description: "Retrieves today's appointments with optional grouping by status or time. Requires 'dashboard.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "date",
            in: "query",
            schema: { type: "string", example: "2026-10-20" },
            description: "Filter date in YYYY-MM-DD format",
          },
          {
            name: "groupBy",
            in: "query",
            schema: { type: "string", enum: ["status", "time", "none"], default: "none" },
            description: "Grouping mode",
          },
          {
            name: "doctorId",
            in: "query",
            schema: { type: "string" },
            description: "Filter by Doctor ObjectId",
          },
          {
            name: "departmentId",
            in: "query",
            schema: { type: "string" },
            description: "Filter by Department ObjectId",
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["scheduled", "arrived", "completed", "cancelled"],
            },
            description: "Filter by status",
          },
        ],
        responses: {
          200: {
            description: "Today's appointment records",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Appointment" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/dashboard/appointments/upcoming": {
      get: {
        tags: ["Dashboard"],
        summary: "Get upcoming appointments",
        description: "Retrieves paginated upcoming scheduled consultations across upcoming days. Requires 'dashboard.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
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
            name: "doctorId",
            in: "query",
            schema: { type: "string" },
          },
          {
            name: "departmentId",
            in: "query",
            schema: { type: "string" },
          },
          {
            name: "includeCancelled",
            in: "query",
            schema: { type: "boolean", default: false },
          },
        ],
        responses: {
          200: {
            description: "Upcoming appointment items",
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
                          items: { $ref: "#/components/schemas/Appointment" },
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
  },
};
