module.exports = {
  tags: [
    {
      name: "Slots",
      description: "Dynamic consultation slot generation, regeneration, availability checking, and concurrency control",
    },
  ],
  paths: {
    "/api/v1/slots/generate": {
      post: {
        tags: ["Slots"],
        summary: "Generate slots for date",
        description: "Pre-generates bookable time intervals for a doctor on a specific date based on active DoctorSchedule, excluding lunch and rest breaks. Requires 'slots.create' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["doctorId", "date"],
                properties: {
                  doctorId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
                  date: { type: "string", example: "2026-10-20", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Slots generated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "16 slots generated successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Slot" },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Doctor does not practice on this day or no schedule configured" },
        },
      },
    },
    "/api/v1/slots/regenerate": {
      post: {
        tags: ["Slots"],
        summary: "Regenerate slots for date",
        description: "Regenerates slots after schedule updates while safely preserving already booked slots. Requires 'slots.update' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["doctorId", "date"],
                properties: {
                  doctorId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
                  date: { type: "string", example: "2026-10-20" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Slots regenerated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Slots regenerated successfully" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Slot" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/slots": {
      get: {
        tags: ["Slots"],
        summary: "List slots",
        description: "List slots for booking. Supports filtering by doctorId, date, status ('available' / 'booked'), and 'onlyFuture=true' to exclude past times. Doctors can view their own slots; Receptionists/Super Admins can view all. Requires 'slots.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "doctorId",
            in: "query",
            schema: { type: "string" },
            description: "Filter by Doctor ObjectId",
          },
          {
            name: "date",
            in: "query",
            schema: { type: "string", example: "2026-10-20" },
            description: "Filter by date (YYYY-MM-DD)",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["available", "booked"] },
            description: "Filter by slot status",
          },
          {
            name: "onlyFuture",
            in: "query",
            schema: { type: "boolean", default: false },
            description: "If true, strictly filters out past slots relative to current server time",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 50 },
          },
        ],
        responses: {
          200: {
            description: "List of slots",
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
                          items: { $ref: "#/components/schemas/Slot" },
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
    "/api/v1/slots/{id}": {
      get: {
        tags: ["Slots"],
        summary: "Get slot details",
        description: "Check a specific slot's details and real-time availability. Requires 'slots.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Slot ObjectId",
          },
        ],
        responses: {
          200: {
            description: "Slot found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Slot" },
                  },
                },
              },
            },
          },
          404: { description: "Slot not found" },
        },
      },
      patch: {
        tags: ["Slots"],
        summary: "Update slot status",
        description: "Manually updates slot status to 'available' or 'booked'. Requires 'slots.update' permission.",
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
                  status: { type: "string", enum: ["available", "booked"] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Slot status updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Slot" },
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
      Slot: {
        type: "object",
        properties: {
          _id: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
          doctorId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d2" },
          date: { type: "string", example: "2026-10-20" },
          startAt: { type: "string", format: "date-time", example: "2026-10-20T09:00:00.000Z" },
          endAt: { type: "string", format: "date-time", example: "2026-10-20T09:15:00.000Z" },
          status: { type: "string", enum: ["available", "booked"], example: "available" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
