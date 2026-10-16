module.exports = {
  tags: [
    {
      name: "Doctor Schedules",
      description: "Weekly practitioner schedules, working days, consultation sessions, and lunch/break time configurations",
    },
  ],
  paths: {
    "/api/v1/doctorschedule": {
      post: {
        tags: ["Doctor Schedules"],
        summary: "Configure doctor schedule",
        description: "Configure working days (1-7), session windows (e.g. 09:00-13:00, 14:00-18:00), breaks, and slot duration. Requires 'doctorschedule.create' permission (Super Admin).",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ConfigureScheduleInput",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Doctor schedule successfully created/configured",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/DoctorSchedule" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid session or break format, or overlapping periods" },
        },
      },
      get: {
        tags: ["Doctor Schedules"],
        summary: "View doctor schedule",
        description: "View schedule for a doctor. Doctors can view their own schedule; Super Admin can view any doctor's schedule by passing doctorId. Requires 'doctorschedule.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "doctorId",
            in: "query",
            schema: { type: "string" },
            description: "Doctor ObjectId (required for Super Admin inspecting a doctor)",
          },
        ],
        responses: {
          200: {
            description: "Doctor schedule found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/DoctorSchedule" },
                  },
                },
              },
            },
          },
          404: { description: "Schedule not found" },
        },
      },
      put: {
        tags: ["Doctor Schedules"],
        summary: "Update doctor schedule",
        description: "Updates working days, sessions, breaks, or slotDurationMinutes for a doctor. Super Admin only. Requires 'doctorschedule.update' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ConfigureScheduleInput",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Doctor schedule updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/DoctorSchedule" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/doctorschedule/{doctorId}": {
      get: {
        tags: ["Doctor Schedules"],
        summary: "View schedule by doctor ID",
        description: "View schedule for a specific doctor. Requires 'doctorschedule.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "doctorId",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Doctor ObjectId",
          },
        ],
        responses: {
          200: {
            description: "Doctor schedule found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/DoctorSchedule" },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ["Doctor Schedules"],
        summary: "Update schedule by doctor ID",
        description: "Updates doctor working schedule by doctor ID path parameter. Requires 'doctorschedule.update' permission (Super Admin).",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "doctorId",
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
                  workingDays: {
                    type: "array",
                    items: { type: "integer", minimum: 0, maximum: 7 },
                    example: [1, 2, 3, 4, 5],
                  },
                  sessions: {
                    type: "array",
                    items: { $ref: "#/components/schemas/TimeRange" },
                  },
                  breaks: {
                    type: "array",
                    items: { $ref: "#/components/schemas/TimeRange" },
                  },
                  slotDurationMinutes: { type: "integer", example: 15 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Doctor schedule updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/DoctorSchedule" },
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
      TimeRange: {
        type: "object",
        required: ["startTime", "endTime"],
        properties: {
          startTime: { type: "string", example: "09:00", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" },
          endTime: { type: "string", example: "13:00", pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" },
        },
      },
      ConfigureScheduleInput: {
        type: "object",
        required: ["doctorId", "sessions"],
        properties: {
          doctorId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
          workingDays: {
            type: "array",
            items: { type: "integer", minimum: 0, maximum: 7 },
            example: [1, 2, 3, 4, 5],
            description: "Days of week (1=Monday, 7=Sunday)",
          },
          sessions: {
            type: "array",
            items: { $ref: "#/components/schemas/TimeRange" },
            example: [
              { startTime: "09:00", endTime: "12:30" },
              { startTime: "14:00", endTime: "17:30" },
            ],
          },
          breaks: {
            type: "array",
            items: { $ref: "#/components/schemas/TimeRange" },
            example: [{ startTime: "12:30", endTime: "14:00" }],
          },
          slotDurationMinutes: { type: "integer", default: 15, minimum: 5, maximum: 240 },
        },
      },
      DoctorSchedule: {
        type: "object",
        properties: {
          _id: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
          doctorId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d2" },
          workingDays: {
            type: "array",
            items: { type: "integer" },
            example: [1, 2, 3, 4, 5],
          },
          sessions: {
            type: "array",
            items: { $ref: "#/components/schemas/TimeRange" },
          },
          breaks: {
            type: "array",
            items: { $ref: "#/components/schemas/TimeRange" },
          },
          slotDurationMinutes: { type: "integer", example: 15 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
