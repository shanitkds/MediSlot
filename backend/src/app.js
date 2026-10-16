const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const pinoHttp = require("pino-http");
const env = require("./config/env");
const logger = require("./config/logger");
const { corsOptions } = require("./config/cors");
const requestId = require("./middleware/requestId");
const csrfProtection = require("./middleware/csrf");
const { globalLimiter } = require("./middleware/rateLimit");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const swaggerUi = require("swagger-ui-express");
const { swaggerSpec } = require("./config/swagger");
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");
const roleRoutes = require("./modules/roles/role.routes");
const permissionRoutes = require("./modules/permissions/permission.routes");
const profileRoutes = require("./modules/profile/profile.routes");
const settingsRoutes = require("./modules/settings/settings.routes");
const sessionRoutes = require("./modules/sessions/session.routes");
const auditRoutes = require("./modules/audit/audit.routes");
const doctorRoutes = require("./modules/doctor/doctor.routes");
const departmentRoutes = require("./modules/department/department.routes");
const patientRoutes = require("./modules/patient/patient.routes");
const doctorScheduleRoutes = require("./modules/doctorschedule/doctorschedule.routes");
const slotRoutes = require("./modules/slot/slot.routes");
const appointmentRoutes = require("./modules/appointment/appointment.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");

function createApp() {
  const app = express();
  app.set("trust proxy", 1);

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.requestId,
      customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
    })
  );
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    })
  );
  app.use(compression());
  app.use(cors(corsOptions()));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(globalLimiter);
  app.use(csrfProtection);

  app.get("/health", (req, res) => {
    res.json({
      success: true,
      message: "OK",
      data: { status: "ok", uptime: process.uptime() },
    });
  });

  // Swagger API Documentation
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "MediSlot REST API Documentation",
      customCss: ".swagger-ui .topbar { display: none }",
    })
  );
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "MediSlot REST API Documentation",
      customCss: ".swagger-ui .topbar { display: none }",
    })
  );

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/roles", roleRoutes);
  app.use("/api/v1/permissions", permissionRoutes);
  app.use("/api/v1/profile", profileRoutes);
  app.use("/api/v1/settings", settingsRoutes);
  app.use("/api/v1/sessions", sessionRoutes);
  app.use("/api/v1/audit-logs", auditRoutes);
  app.use("/api/v1/doctors", doctorRoutes);
  app.use("/api/v1/departments", departmentRoutes);
  app.use("/api/v1/patients", patientRoutes);
  app.use("/api/v1/doctorschedule", doctorScheduleRoutes);
  app.use("/api/v1/doctorschedules", doctorScheduleRoutes);
  app.use("/api/v1/slots", slotRoutes);
  app.use("/api/v1/slot", slotRoutes);
  app.use("/api/v1/appointments", appointmentRoutes);
  app.use("/api/v1/appointment", appointmentRoutes);
  app.use("/api/v1/dashboard", dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
