const appointmentSwagger = require("../modules/appointment/appointment.swagger");
const auditSwagger = require("../modules/audit/audit.swagger");
const authSwagger = require("../modules/auth/auth.swagger");
const dashboardSwagger = require("../modules/dashboard/dashboard.swagger");
const departmentSwagger = require("../modules/department/department.swagger");
const doctorSwagger = require("../modules/doctor/doctor.swagger");
const doctorScheduleSwagger = require("../modules/doctorschedule/doctorschedule.swagger");
const patientSwagger = require("../modules/patient/patient.swagger");
const slotSwagger = require("../modules/slot/slot.swagger");
const userSwagger = require("../modules/users/user.swagger");
const profileSwagger = require("../modules/profile/profile.swagger");

const modules = [
  authSwagger,
  userSwagger,
  profileSwagger,
  doctorSwagger,
  departmentSwagger,
  doctorScheduleSwagger,
  slotSwagger,
  appointmentSwagger,
  patientSwagger,
  dashboardSwagger,
  auditSwagger,
];

// Aggregate tags, paths, and component schemas
const mergedTags = [];
const mergedPaths = {};
const mergedSchemas = {
  PaginationMeta: {
    type: "object",
    properties: {
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 10 },
      total: { type: "integer", example: 42 },
      totalPages: { type: "integer", example: 5 },
      hasNext: { type: "boolean", example: true },
      hasPrev: { type: "boolean", example: false },
    },
  },
  ApiErrorResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: {
        type: "object",
        properties: {
          code: { type: "string", example: "VALIDATION_ERROR" },
          message: { type: "string", example: "Invalid request payload" },
          details: { type: "object" },
        },
      },
    },
  },
};

for (const mod of modules) {
  if (mod.tags && Array.isArray(mod.tags)) {
    mergedTags.push(...mod.tags);
  }
  if (mod.paths) {
    Object.assign(mergedPaths, mod.paths);
  }
  if (mod.components && mod.components.schemas) {
    Object.assign(mergedSchemas, mod.components.schemas);
  }
}

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "MediSlot REST API Documentation",
    version: "1.0.0",
    description: `
## MediSlot Clinical Scheduling & Appointment Management API

Welcome to the interactive MediSlot API documentation. MediSlot provides a comprehensive RESTful backend for clinics and healthcare institutions, featuring:
- **Role-Based Access Control (RBAC)**: Enforced across Super Admin, Doctor, Receptionist, and Patient roles.
- **Stateful Authentication**: Powered by HTTP-only session cookies (\`sid\`) or JWT access tokens.
- **Concurrency-Safe Slot Engine**: Atomic slot reservation eliminating double-booking under high load.
- **Real-Time Integration**: Synchronized with Socket.IO room events.

### Authentication
Protected endpoints accept either:
1. **Stateful Session Cookie (\`sid\`)**: Automatically set upon successful \`POST /api/v1/auth/login\`.
2. **Bearer JWT Access Token**: Provided in the \`Authorization: Bearer <token>\` request header.
    `,
    contact: {
      name: "MediSlot Engineering",
      url: "https://github.com/srj-brandbook/saas-boilerplate",
    },
  },
  servers: [
    {
      url: "/",
      description: "Current Host Server",
    },
    {
      url: "http://localhost:5000",
      description: "Direct Backend Server (Port 5000)",
    },
    {
      url: "http://localhost:3000",
      description: "Frontend Proxy Gateway (Port 3000)",
    },
  ],
  tags: mergedTags,
  paths: mergedPaths,
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "sid",
        description: "Stateful session identifier cookie set upon login.",
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT access token sent in 'Authorization: Bearer <token>' header.",
      },
    },
    schemas: mergedSchemas,
  },
};

module.exports = { swaggerSpec };
