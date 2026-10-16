module.exports = {
  tags: [
    {
      name: "Patients",
      description: "Patient demographic registry, identification (patientId), mobile lookup, and medical history",
    },
  ],
  paths: {
    "/api/v1/patients": {
      post: {
        tags: ["Patients"],
        summary: "Register patient",
        description: "Registers a new patient. Can accept a custom patientId or auto-generate one (e.g. PT1001). Requires 'patients.create' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "mobile", "dateOfBirth", "gender"],
                properties: {
                  patientId: { type: "string", example: "PT1001", description: "Optional custom unique ID" },
                  name: { type: "string", example: "John Doe" },
                  mobile: { type: "string", example: "+1-555-0199" },
                  dateOfBirth: { type: "string", format: "date", example: "1990-05-15" },
                  gender: { type: "string", enum: ["male", "female", "other"], example: "male" },
                  isActive: { type: "boolean", default: true },
                  status: { type: "string", enum: ["active", "inactive"], default: "active" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Patient registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Patient" },
                  },
                },
              },
            },
          },
          409: { description: "Patient ID already exists" },
        },
      },
      get: {
        tags: ["Patients"],
        summary: "List patients",
        description: "List patients with regex search across name, patientId, or mobile number, with pagination and sorting. Requires 'patients.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Search text across name, mobile, and patientId",
          },
          {
            name: "patientId",
            in: "query",
            schema: { type: "string" },
            description: "Filter by exact or partial patient identifier",
          },
          {
            name: "name",
            in: "query",
            schema: { type: "string" },
            description: "Filter by patient name",
          },
          {
            name: "mobile",
            in: "query",
            schema: { type: "string" },
            description: "Filter by mobile phone number",
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["active", "inactive"] },
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
            description: "List of patients",
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
                          items: { $ref: "#/components/schemas/Patient" },
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
    "/api/v1/patients/{id}": {
      get: {
        tags: ["Patients"],
        summary: "Get patient details",
        description: "Retrieve patient profile by MongoDB ObjectId or patientId string. Requires 'patients.view' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Patient ObjectId or patientId (e.g. PT1001)",
          },
        ],
        responses: {
          200: {
            description: "Patient profile found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Patient" },
                  },
                },
              },
            },
          },
          404: { description: "Patient not found" },
        },
      },
      patch: {
        tags: ["Patients"],
        summary: "Update patient records",
        description: "Update patient demographics. Requires 'patients.update' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Patient ObjectId or patientId",
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
                  mobile: { type: "string" },
                  dateOfBirth: { type: "string", format: "date" },
                  gender: { type: "string", enum: ["male", "female", "other"] },
                  status: { type: "string", enum: ["active", "inactive"] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Patient records updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Patient" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Patients"],
        summary: "Deactivate patient",
        description: "Deactivates patient record, cancels upcoming scheduled appointments, and automatically frees booked slots. Requires 'patients.delete' permission.",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Patient ObjectId or patientId",
          },
        ],
        responses: {
          200: {
            description: "Patient deactivated and upcoming slots freed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Patient deactivated successfully" },
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
      Patient: {
        type: "object",
        properties: {
          _id: { type: "string", example: "65f1a2b3c4d5e6f7a8b9c0d1" },
          patientId: { type: "string", example: "PT1001" },
          name: { type: "string", example: "John Doe" },
          mobile: { type: "string", example: "+1-555-0199" },
          dateOfBirth: { type: "string", format: "date", example: "1990-05-15" },
          gender: { type: "string", example: "male" },
          status: { type: "string", example: "active" },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
