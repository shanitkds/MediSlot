const { Server } = require("socket.io");
const env = require("./config/env");
const logger = require("./config/logger");
const { parseOrigins } = require("./config/cors");
const Session = require("./models/Session");
const User = require("./models/User");
const Doctor = require("./models/Doctor");
const { hashToken } = require("./utils/hash");
const { verifyAccessToken } = require("./utils/tokens");
const { resolveAccess } = require("./modules/auth/auth.access");

let io = null;

function parseCookies(cookieHeader = "") {
  const cookies = {};
  if (!cookieHeader) return cookies;
  const items = cookieHeader.split(";");
  for (const item of items) {
    const parts = item.split("=");
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      cookies[name] = decodeURIComponent(val);
    }
  }
  return cookies;
}

async function authenticateSocket(socket, next) {
  try {
    const cookieHeader = socket.request?.headers?.cookie || "";
    const cookies = parseCookies(cookieHeader);
    const rawSession = cookies[env.COOKIE_NAME];
    const accessCookie = cookies.access_token;

    // Check auth header or handshake auth payload
    const authHeader = socket.handshake?.headers?.authorization;
    let bearerToken = null;
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      bearerToken = authHeader.slice(7).trim();
    } else if (socket.handshake?.auth?.token) {
      bearerToken = String(socket.handshake.auth.token).replace(/^Bearer\s+/i, "").trim();
    }

    let user = null;
    let session = null;

    // 1. Try resolving via Bearer JWT or access_token cookie
    const tokenToVerify = bearerToken || accessCookie;
    if (tokenToVerify) {
      const decoded = verifyAccessToken(tokenToVerify);
      if (decoded && decoded.userId) {
        user = await User.findOne({ _id: decoded.userId, isArchive: false }).populate("roleIds");
      }
    }

    // 2. If not resolved via JWT, try session lookup via rawSession or bearerToken (if opaque)
    if (!user) {
      const candidateRaw =
        rawSession || (bearerToken && !bearerToken.includes(".") ? bearerToken : null);
      if (candidateRaw) {
        session = await Session.findOne({ tokenHash: hashToken(candidateRaw) });
        if (session && session.expiresAt > new Date()) {
          const idleMs = env.IDLE_TTL_HOURS * 60 * 60 * 1000;
          if (Date.now() - new Date(session.lastSeenAt).getTime() <= idleMs) {
            user = await User.findOne({ _id: session.userId, isArchive: false }).populate("roleIds");
            if (user) {
              session.lastSeenAt = new Date();
              await session.save();
            }
          }
        }
      }
    }

    if (!user) {
      return next(new Error("Authentication error: Unauthorized"));
    }

    if (user.status === "disabled") {
      return next(new Error("Authentication error: Account is disabled"));
    }

    const access = await resolveAccess(user);
    socket.user = user;
    socket.roles = access.roles || [];
    socket.permissions = access.permissions || [];
    socket.isSuperAdmin = access.isSuperAdmin;

    // Check if user is linked to a doctor profile
    const doctor = await Doctor.findOne({ userId: user._id, isActive: true });
    if (doctor) {
      socket.doctorId = doctor._id.toString();
    }

    return next();
  } catch (error) {
    logger.error({ err: error }, "Socket authentication failed");
    return next(new Error("Authentication error: Internal error"));
  }
}

function initSocket(httpServer) {
  const allowlist = parseOrigins();

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowlist.includes(origin)) return callback(null, true);
        return callback(new Error("Origin not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    socket.join(`user:${userId}`);

    // Roles room assignment
    const roleNames = socket.roles.map((r) => (typeof r === "string" ? r : r.name || r.slug || ""));
    roleNames.filter(Boolean).forEach((r) => socket.join(`role:${r.toLowerCase()}`));

    const canViewAllAppointments =
      socket.isSuperAdmin ||
      roleNames.includes("Super Admin") ||
      roleNames.includes("Receptionist") ||
      socket.permissions.includes("appointments.view") ||
      socket.permissions.includes("appointments.create") ||
      socket.permissions.includes("slots.view");

    if (canViewAllAppointments) {
      socket.join("appointments:all");
    }

    if (socket.doctorId) {
      socket.join(`doctor:${socket.doctorId}`);
    }

    logger.info(
      {
        socketId: socket.id,
        userId,
        roles: socket.roles,
        doctorId: socket.doctorId,
        canViewAllAppointments,
      },
      "Socket client connected and joined authorized rooms"
    );

    socket.on("disconnect", (reason) => {
      logger.info({ socketId: socket.id, userId, reason }, "Socket client disconnected");
    });
  });

  return io;
}

function getIO() {
  return io;
}

/**
 * Emit an appointment event to authorized clients only.
 * Consistent payload format:
 * {
 *   appointmentId: string,
 *   doctorId: string,
 *   status: string,
 *   changedFields: object,
 *   appointment: object
 * }
 */
function emitAppointmentEvent(eventName, { appointment, appointmentId, doctorId, status, changedFields = {} }) {
  if (!io) return;

  const apptId = String(appointmentId || appointment?._id || "");
  const docId = String(doctorId || appointment?.doctorId?._id || appointment?.doctorId || "");
  const currentStatus = status || appointment?.status || "";

  const payload = {
    appointmentId: apptId,
    doctorId: docId,
    status: currentStatus,
    changedFields: changedFields || {},
    appointment: appointment ? (appointment.toJSON ? appointment.toJSON() : appointment) : null,
  };

  try {
    // Emit to users authorized to see all appointments (Super Admin, Receptionist)
    io.to("appointments:all").emit(eventName, payload);

    // If there's a doctorId, emit to that doctor's room as well
    if (docId) {
      io.to(`doctor:${docId}`).emit(eventName, payload);
    }

    logger.info(
      { eventName, appointmentId: apptId, doctorId: docId, status: currentStatus },
      "Emitted real-time appointment event"
    );
  } catch (err) {
    logger.error({ err, eventName, appointmentId: apptId }, "Failed to emit real-time appointment event");
  }
}

module.exports = {
  initSocket,
  getIO,
  emitAppointmentEvent,
};
