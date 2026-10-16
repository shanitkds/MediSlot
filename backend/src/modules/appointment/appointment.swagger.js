module.exports = {
  tags: [
    {
      name: "Appointments",
      description: "Clinical appointment booking, atomic slot reservation, arrival check-in, notes, and completion",
    },
  ],
  paths: {
    "/api/v1/appointments": {
      post: {
        tags: ["Appointments"],
        summary: "Book an appointment",
        description: "Books an appointment with atomic slot reservation to eliminate double-booking. Requires 'appointments.create' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["patientId", "doctorId", "slotId"],
                properties: {
                  patientId: {
                    type: "string",
                    example: "65f1a2b3c4d5e6f7a8b9c0d1",
                    description: "24-character hexadecimal ObjectId of the Patient",
                  },
                  doctorId: {
                    type: "string",
                    example: "65f1a2b3c4d5e6f7a8b9c0d2",
                    description: "24-character hexadecimal ObjectId of the Doctor",
                  },
                  slotId: {
                    type: "string",
                    example: "65f1a2b3c4d5e6f7a8b9c0d3",
                    description: "24-character hexadecimal ObjectId of the available Slot",
                  },
                  departmentId: {
                    type: "string",
                    example: "65f1a2b3c4d5e6f7a8b9c0d4",
                    description: "Optional 24-character hexadecimal ObjectId of the Department",
                  },
                  purpose: {
                    type: "string",
                    example: "Routine cardiac evaluation",
                    description: "Reason for the clinical consultation",
                  },
                  notes: {
                    type: "string",
                    example: "Patient experiencing mild chest discomfort",
                    description: "Pre-consultation clinical notes",
                  },
                  appointmentDate: {
                    type: "string",
                    format: "date-time",
                    example: "2026-10-20T09:00:00.000Z",
                    description: "Scheduled consultation date and time",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Appointment successfully booked",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AppointmentResponse",
                },
              },
            },
          },
          400: {
            description: "Invalid input or past slot booking rejected",
          },
          409: {
            description: "Slot already booked by another user",
          },
        },
      },
      get: {
        tags: ["Appointments"],
        summary: "List appointments",
        description: "List, filter, sort, and paginate clinical appointments. Doctor users are automatically scoped to their own appointments. Requires 'appointments.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "doctorId",
            in: "query",
            schema: { type: "string" },
            description: "Filter appointments by Doctor ObjectId",
          },
          {
            name: "patientId",
            in: "query",
            schema: { type: "string" },
            description: "Filter appointments by Patient ObjectId",
          },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["scheduled", "arrived", "completed", "cancelled"],
            },
            description: "Filter by appointment lifecycle status",
          },
          {
            name: "date",
            in: "query",
            schema: { type: "string", example: "2026-10-20" },
            description: "Filter by exact date (YYYY-MM-DD)",
          },
          {
            name: "startDate",
            in: "query",
            schema: { type: "string", format: "date-time" },
            description: "Range start date (ISO format)",
          },
          {
            name: "endDate",
            in: "query",
            schema: { type: "string", format: "date-time" },
            description: "Range end date (ISO format)",
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Search text across patient name, appointment number, or notes",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
            description: "Page number for pagination",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
            description: "Number of records per page (max 100)",
          },
          {
            name: "sort",
            in: "query",
            schema: { type: "string", default: "-appointmentDate" },
            description: "Sort order (e.g. appointmentDate or -appointmentDate)",
          },
        ],
        responses: {
          200: {
            description: "Paginated list of appointments",
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
    "/api/v1/appointments/{id}": {
      get: {
        tags: ["Appointments"],
        summary: "Get appointment details",
        description: "Retrieve complete details for a specific appointment. Doctors can only view their own assigned appointments. Requires 'appointments.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Appointment ObjectId",
          },
        ],
        responses: {
          200: {
            description: "Appointment details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AppointmentResponse" },
              },
            },
          },
          404: { description: "Appointment not found" },
        },
      },
      patch: {
        tags: ["Appointments"],
        summary: "Update appointment or reschedule",
        description: "Update appointment purpose/notes or atomically reschedule to a new slot. Requires 'appointments.update' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Appointment ObjectId",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  purpose: { type: "string", example: "Follow-up consultation" },
                  notes: { type: "string", example: "Patient reported headache resolved" },
                  slotId: {
                    type: "string",
                    example: "65f1a2b3c4d5e6f7a8b9c0d5",
                    description: "New Slot ObjectId for rescheduling",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Appointment successfully updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AppointmentResponse" },
              },
            },
          },
          409: { description: "New slot is already booked" },
        },
      },
      delete: {
        tags: ["Appointments"],
        summary: "Cancel appointment",
        description: "Cancels appointment, marks status as 'cancelled', and automatically releases the slot back to available. Doctors can cancel their own appointments; Super Admins and Receptionists can cancel clinic appointments.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Appointment ObjectId",
          },
        ],
        responses: {
          200: {
            description: "Appointment cancelled and slot released",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Appointment cancelled successfully" },
                    data: { $ref: "#/components/schemas/Appointment" },
                  },
                },
              },
            },
          },
          404: { description: "Appointment not found" },
        },
      },
    },
    "/api/v1/appointments/{id}/arrive": {
      post: {
        tags: ["Appointments"],
        summary: "Mark patient arrived",
        description: "Updates appointment status to 'arrived' upon patient check-in at front desk. Emits real-time event. Requires 'appointments.update' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Appointment ObjectId",
          },
        ],
        responses: {
          200: {
            description: "Patient marked as arrived",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AppointmentResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/appointments/{id}/complete": {
      post: {
        tags: ["Appointments"],
        summary: "Complete appointment",
        description: "Doctor marks consultation as completed and optionally records final consultation notes. Requires 'appointments.update' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Appointment ObjectId",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  notes: {
                    type: "string",
                    example: "Prescribed medication for 7 days. Scheduled follow-up in two weeks.",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Appointment marked completed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AppointmentResponse" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Appointment: {
        type: "object",
        properties: {
          _id: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
          appointmentNumber: { type: "string", example: "APT-20261020-001" },
          patientId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d2" },
          doctorId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d3" },
          slotId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d4" },
          departmentId: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d5" },
          purpose: { type: "string", example: "Routine cardiac checkup" },
          notes: { type: "string", example: "All vital indicators normal" },
          status: {
            type: "string",
            enum: ["scheduled", "arrived", "completed", "cancelled"],
            example: "scheduled",
          },
          appointmentDate: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AppointmentResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Appointment booked successfully" },
          data: { $ref: "#/components/schemas/Appointment" },
        },
      },
    },
  },
};
