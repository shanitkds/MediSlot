# MediSlot Backend — Project Master Details & Execution Log

> **MANDATORY AGENT & DEVELOPER INSTRUCTION**
>
> ⚠️ **CRITICAL: READ BEFORE ANY EXECUTION**
> 1. **Always read this file first** before running commands, creating new features, modifying endpoints, schemas, or configurations in `backend/`.
> 2. **Document every minute change**: Whenever you plan, execute, or complete any task or modification (no matter how small), immediately record the update in the [Live Work Log & Change Tracker](#live-work-log--change-tracker) section below.
> 3. Keep this document synchronized with actual code and environment specifications.

---

## 1. Project Overview

| Attribute | Details |
| :--- | :--- |
| **Project Name** | MediSlot Backend (SaaS Boilerplate Engine) |
| **Service Type** | RESTful API Service |
| **Runtime** | Node.js (>= 20) |
| **Core Framework** | Express 4.21.2 |
| **Primary Database** | MongoDB via Mongoose 8.9.5 |
| **Default Port** | `5000` |
| **Base API Prefix** | `/api/v1` |
| **Health Check** | `GET /health` |
| **Authentication** | Stateful Session Cookies (`sid`) stored in MongoDB (`sessions` collection) |
| **Security Layer** | Helmet 8, CSRF protection, Rate Limiting (express-rate-limit), CORS |
| **Logging** | Structured logging via Pino 9 & Pino-HTTP with standardized metadata (`user`, `role`, `action`, `entity`, `timestamp`) |
| **Email Service** | Nodemailer 6.10 (Local SMTP / MailHog / External Provider) |

---

## 2. Directory & Architecture Map

```
backend/
├── .env                     # Local environment secrets & config
├── .env.example             # Template for environment configuration
├── Dockerfile               # Production container build
├── jest.config.js           # Test runner configuration
├── package.json             # NPM dependencies and scripts
├── PROJECT_DETAILS.md       # [THIS FILE] Master reference & live work log
├── src/
│   ├── server.js            # Server entrypoint (DB connection + HTTP listener)
│   ├── app.js               # Express application initialization & middleware stack
│   ├── config/              # Centralized configuration modules
│   │   ├── cors.js          # CORS origins and credentials configuration
│   │   ├── db.js            # MongoDB connection handler
│   │   ├── env.js           # Environment variable validation & typing
│   │   └── logger.js        # Pino structured logger instance
│   ├── constants/           # Enums, standard roles, and system permission definitions
│   │   ├── permissions.js   # Granular system permissions list
│   │   └── roles.js         # Default system roles (superadmin, admin, user, etc.)
│   ├── middleware/          # Express middlewares
│   │   ├── authenticate.js  # Session resolution & user population middleware
│   │   ├── csrf.js          # Double submit CSRF protection
│   │   ├── errorHandler.js  # Global API error handler & formatted JSON responses
│   │   ├── notFound.js      # 404 handler for unmatched routes
│   │   ├── rateLimit.js     # Rate limiting buckets (global, auth, etc.)
│   │   ├── requestId.js     # Unique X-Request-ID attribution
│   │   ├── requirePermission.js # Role/Permission authorization checks
│   │   └── validate.js      # Joi request validation middleware
│   ├── models/              # Mongoose database models
│   │   ├── index.js         # Centralized export barrel for all models
│   │   ├── Appointment.js   # Appointment bookings and consultation notes
│   │   ├── AuditLog.js      # System event audit records (userId, entityId, role, action, timestamp)
│   │   ├── Department.js    # Medical departments and active status
│   │   ├── Doctor.js        # Doctor profile, specialization, and duration (ref User & Department)
│   │   ├── DoctorSchedule.js# Doctor workdays, sessions, breaks, and slotDurationMinutes
│   │   ├── PasswordResetToken.js     # Password reset tokens
│   │   ├── Patient.js       # Patient registration (patientId, mobile, DOB, gender)
│   │   ├── Permission.js    # System permission catalog
│   │   ├── Role.js          # Role definitions with permission mappings
│   │   ├── Session.js       # Stateful user session documents
│   │   ├── Settings.js      # System/tenant configuration storage
│   │   ├── Slot.js          # Individual bookable slots with { doctorId, startAt } unique index
│   │   └── User.js          # User identity, password hash, status & role associations
│   ├── modules/             # Domain modules (routes, controllers, services, validators)
│   │   ├── audit/           # Audit logs viewer & query endpoints
│   │   ├── auth/            # Authentication, login/logout, password reset
│   │   ├── permissions/     # Permission listing endpoints
│   │   ├── profile/         # Current user profile management
│   │   ├── roles/           # Role management & permission assignments
│   │   ├── sessions/        # Active session listing and revocation
│   │   ├── settings/        # System settings inspection & updating
│   │   └── users/           # User administration (CRUD, disable, assign roles)
│   ├── seeds/               # Database seeder scripts
│   │   └── index.js         # Seeds permissions, roles, and default Super Admin
│   └── utils/               # Reusable utility functions
│       ├── ApiError.js      # Custom error class with HTTP status codes
│       ├── catchAsync.js    # Async wrapper for route handlers
│       └── email.js         # Nodemailer wrapper
└── tests/                   # Integration and unit tests
```

---

## 3. Environment Variables Reference

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | String | `development` | App environment (`development` / `production` / `test`) |
| `PORT` | Number | `5000` | HTTP server listening port |
| `LOG_LEVEL` | String | `info` | Pino logging level (`debug`, `info`, `warn`, `error`) |
| `MONGO_URI` | String | `mongodb://127.0.0.1:27017/saas_boilerplate` | MongoDB connection connection string |
| `CORS_ORIGIN` | String | `http://localhost:3000` | Allowed front-end origin |
| `APP_URL` | String | `http://localhost:3000` | Front-end web application URL (for reset links) |
| `COOKIE_NAME` | String | `sid` | Name of the session cookie |
| `COOKIE_SECRET` | String | *Required in prod* | Secret for signed cookies |
| `COOKIE_SECURE` | Boolean | `false` | Set to `true` when serving over HTTPS |
| `COOKIE_SAMESITE` | String | `lax` | SameSite cookie attribute (`lax`, `strict`, `none`) |
| `JWT_REFRESH_TTL_DAYS` | Number | `7` | Refresh / session token lifespan in days |
| `JWT_ACCESS_TTL_MINUTES` | Number | `15` | Access token lifespan in minutes |
| `SESSION_TTL_HOURS` | Number | `168` (7 days) | Absolute session expiration duration |
| `IDLE_TTL_HOURS` | Number | `12` | Inactivity session timeout |
| `PASSWORD_RESET_TTL_MINUTES` | Number | `60` | Reset token lifespan |
| `EMAIL_VERIFY_TTL_HOURS` | Number | `24` | Email verification token lifespan |
| `LOGIN_MAX_ATTEMPTS` | Number | `5` | Maximum failed attempts before lockout |
| `LOGIN_LOCK_MINUTES` | Number | `15` | Account lockout duration on failed logins |
| `SMTP_HOST` | String | `127.0.0.1` | SMTP server address |
| `SMTP_PORT` | Number | `1025` | SMTP server port |
| `SMTP_SECURE` | Boolean | `false` | TLS connection flag |
| `SMTP_USER` | String | `""` | SMTP authentication user |
| `SMTP_PASS` | String | `""` | SMTP authentication password |
| `SMTP_FROM` | String | `SaaS Boilerplate <noreply@localhost>` | Default sender email header |
| `SUPERADMIN_EMAIL` | String | `admin@example.com` | Email for default superadmin account |
| `SUPERADMIN_PASSWORD` | String | `ChangeMeNow!23` | Password for default superadmin account |
| `SUPERADMIN_NAME` | String | `Super Admin` | Display name for default superadmin |

---

## 4. API Endpoints Map

All API routes are prefixed with `/api/v1` (except `/health`).

### System / Health
- `GET /health` — Health check & uptime

### Authentication (`/api/v1/auth`)
- `POST /login` — Authenticate and establish session cookie (`sid`) and access token cookie (`access_token`)
- `POST /refresh` — Issue fresh access token using valid session cookie
- `POST /logout` — Invalidate current session and clear cookies
- `GET /me` — Get authenticated user details, roles, and permissions
- `POST /forgot-password` — Request password reset email
- `POST /reset-password` — Complete password reset with token
- `POST /change-password` — Change password for authenticated user

### Users (`/api/v1/users` — Super Admin Only)
- `POST /doctors` — Create a doctor login account
- `POST /receptionists` — Create a receptionist account
- `GET /` — List users (paginated, searchable, filterable)
- `GET /:id` — Get user details
- `PATCH /:id` — Update user details or role
- `PATCH /:id/status` — Activate or deactivate an account
- `DELETE /:id` — Soft-delete user (Super Admin only)

### Roles & Permissions (`/api/v1/roles`, `/api/v1/permissions`)
- `GET /api/v1/roles` — List all roles
- `POST /api/v1/roles` — Create custom role
- `GET /api/v1/roles/:id` — Get role details
- `PATCH /api/v1/roles/:id` — Update role name/permissions
- `DELETE /api/v1/roles/:id` — Delete role
- `GET /api/v1/permissions` — Catalog of available permissions

### Doctors (`/api/v1/doctors`)
- `POST /` — Create a doctor profile (Super Admin only; enforces unique user email & valid active department)
- `GET /` — View all doctor profiles (Super Admin, Receptionist, Doctor; paginated, searchable, filterable by departmentId, specialization, status)
- `GET /:id` — View a specific doctor profile (Super Admin, Receptionist, Doctor; lookup by Doctor `_id` or User `_id`)
- `PATCH /:id` — Update doctor profile (Super Admin, or Doctor own profile only; doctors prohibited from changing department, role, status)
- `PATCH /:id/specialization` — Assign or update specializations (Super Admin only)
- `PATCH /:id/department` — Assign or change department (Super Admin only; verifies department exists and is active)
- `DELETE /:id` — Deactivate doctor profile (Super Admin only; sets doctor & user status to disabled, preserves appointment history)

### Departments (`/api/v1/departments`)
- `POST /` — Create a department (validates unique name case-insensitively; requires `departments.create`)
- `GET /` — List departments (supports pagination, sort, search, and `isActive` filtering via common `paginate` utility; requires `departments.view`)
- `GET /:id` — View department details (requires `departments.view`)
- `PATCH /:id` — Update department (validates unique name, guards against deactivation if active doctors or future appointments exist; requires `departments.update`)
- `DELETE /:id` — Delete or deactivate department (safely blocks if active doctors or future scheduled appointments exist; deletes if unused with zero references, otherwise deactivates preserving historical doctor and appointment references; requires `departments.delete`)

### Patients (`/api/v1/patients`)
- `POST /` — Register a new patient (accepts optional custom `patientId` or auto-generates unique ID; validates DOB; requires `patients.create`)
- `GET /` — List patients with pagination (uses common `paginate` utility; requires `patients.view`)
- `GET /?patientId=PT001` — Search by patient ID (case-insensitive regex via common `paginate`; requires `patients.view`)
- `GET /?name=Ahmed` — Search by patient name (case-insensitive regex via common `paginate`; requires `patients.view`)
- `GET /?mobile=9876543210` — Search by mobile number (regex via common `paginate`; requires `patients.view`)
- `GET /:id` — View patient details by ObjectId or patientId string (requires `patients.view`)
- `PATCH /:id` — Update patient details (validates unique `patientId` on change; requires `patients.update`)
- `DELETE /:id` — Deactivate patient record (sets `isActive: false` & `status: "inactive"`, preserves historical appointment records, cancels upcoming scheduled appointments; blocks new appointment bookings; requires `patients.delete`)

### Doctor Schedules (`/api/v1/doctorschedule`, `/api/v1/doctorschedules`)
- `POST /` — Configure working days, sessions, breaks, and slot duration (Super Admin only; requires `doctorschedule.create`)
- `GET /` — View doctor schedule (Super Admin views specified or all schedules; Doctor views own schedule only; requires `doctorschedule.view`)
- `GET /:doctorId` — View specific doctor schedule (Super Admin, or Doctor own schedule; requires `doctorschedule.view`)
- `PUT /` — Update working days, sessions, breaks, and slot duration passing doctorId in body or query (Super Admin only; requires `doctorschedule.update`)
- `PUT /:doctorId` — Update working days, sessions, breaks, and slot duration via path parameter (Super Admin only; requires `doctorschedule.update`)

### Slots (`/api/v1/slots`, `/api/v1/slot`)
- `POST /generate` — Generate slots from a doctor's schedule for a specific date (requires `slots.create`)
- `GET /` — List available and booked slots (supports date, doctorId, status filters and pagination; Doctor restricted to own slots via common `checkRole`; requires `slots.view`)
- `GET /:id` — Check a specific slot's details and availability (Doctor restricted to own slots via common `checkRole`; requires `slots.view`)
- `PATCH /:id` — Update slot status to available or booked (requires `slots.update`)
- `POST /regenerate` — Regenerate slots after schedule changes while preserving booked slots (requires `slots.update`)

### Appointments (`/api/v1/appointments`, `/api/v1/appointment`)
- `POST /` — Book an appointment with atomic slot reservation to prevent double-booking (requires `appointments.create`)
- `GET /` — List, filter, sort, and paginate appointments (Doctor restricted to own appointments via common `checkRole`; requires `appointments.view`)
- `GET /:id` — View appointment details (Doctor restricted to own appointment via common `checkRole`; requires `appointments.view`)
- `PATCH /:id` — Update purpose/notes or reschedule slot atomically (Doctor restricted to own appointments; requires `appointments.update`)
- `DELETE /:id` — Cancel an appointment and automatically release reserved slot back to available (requires `appointments.delete`)
- `POST /:id/arrive` — Mark patient as arrived (requires `appointments.update`)
- `POST /:id/complete` — Mark appointment as completed with optional consultation notes (Doctor restricted to own appointment via common `checkRole`; requires `appointments.update`)

### Profile & Settings
- `GET /api/v1/profile` — Get current user profile
- `PATCH /api/v1/profile` — Update current user profile
- `GET /api/v1/settings` — Get application system settings
- `PATCH /api/v1/settings` — Update system settings

### Sessions & Auditing
- `GET /api/v1/sessions` — List active user sessions
- `DELETE /api/v1/sessions/:id` — Terminate a specific session
- `GET /api/v1/audit-logs` — Query audit logs

---

## 5. Security & Session Workflow

1. **Session Handling**: 
   - State stored in MongoDB `Session` collection with hashed tokens.
   - HTTP-only cookie `sid` passed on requests.
   - Checked via `src/middleware/authenticate.js` on protected endpoints.
2. **Access Control**:
   - `requirePermission(permissionName)` checks resolved permissions from assigned roles or Super Admin status.
3. **Structured Request Logging**:
   - Pino HTTP middleware captures `{ user, role, action, entity, timestamp }` on every request.
4. **CSRF & Rate Limiting**:
   - Rate limiters protect `/signup`, `/login`, and sensitive routes.
   - CSRF protection enabled for state-changing requests.

---

## 6. Development & Run Commands

```bash
# Install dependencies
npm install

# Run database seeder (Roles, Permissions, Super Admin)
npm run seed

# Run server with hot-reload (Nodemon)
npm run dev

# Run server in production mode
npm start

# Execute automated test suite
npm test
```

---

## 7. Live Work Log & Change Tracker

> **Notice for Developers & AI Agents**:
> Record every minute change, feature addition, refactoring, or bugfix in this section. Maintain exact timestamps and list affected files.

| Timestamp (Local/UTC) | Category / Module | Description of Work / Changes | Files Modified / Added | Status |
| :--- | :--- | :--- | :--- | :--- |
| **2026-10-14 14:00 UTC** | Config / Env | Created backend `.env` configuration file with local defaults. | `backend/.env` | Completed |
| **2026-10-14 14:18 UTC** | Auth / Verification | Removed mandatory email verification barrier: set user default status to `active` and default `emailVerifiedAt` to current timestamp. | `backend/src/models/User.js` | Completed |
| **2026-10-14 14:22 UTC** | Logging / Pino | Defined standardized log format inside Pino HTTP custom properties (`user`, `role`, `action`, `entity`, `timestamp`). | `backend/src/app.js` | Completed |
| **2026-10-14 14:24 UTC** | Documentation / System | Created master project reference and live execution log (`PROJECT_DETAILS.md`) with instructions to inspect before execution. | `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-14 14:55 UTC** | Models / Auditing | Added `role`, `entity`, and `Entity` fields, sync hooks, & indexes to `AuditLog` schema and updated `audit.service.js` to populate and filter them. | `backend/src/models/AuditLog.js`, `backend/src/modules/audit/audit.service.js` | Completed |
| **2026-10-14 15:05 UTC** | Models / Auditing | Cleaned `AuditLog` schema and service: removed `Entity`, `resourceType`, `resourceId`, `ip`, `userAgent`, and `metadata` to keep audit logs minimal (`actorId`, `actorEmail`, `role`, `action`, `module`, `entity`). | `backend/src/models/AuditLog.js`, `backend/src/modules/audit/audit.service.js` | Completed |
| **2026-10-14 15:20 UTC** | Auth / Tokens | Implemented dual-cookie session management (`sid` refresh token and `access_token` JWT) with `setSession`/`clearSession` helpers and concise `POST /api/v1/auth/refresh` API endpoint. | `backend/src/config/cookie.js`, `backend/src/config/env.js`, `backend/src/utils/tokens.js`, `backend/src/modules/auth/auth.service.js`, `backend/src/modules/auth/auth.controller.js`, `backend/src/modules/auth/auth.routes.js` | Completed |
| **2026-10-14 15:38 UTC** | Models / Schemas | Created `Department`, `Doctor`, `Patient`, `DoctorSchedule`, `Slot`, and `Appointment` models; updated `AuditLog` (userId, entityId, timestamp) & `User` (doctor virtual); added `models/index.js` export barrel and test suite. | `backend/src/models/Department.js`, `backend/src/models/Doctor.js`, `backend/src/models/Patient.js`, `backend/src/models/DoctorSchedule.js`, `backend/src/models/Slot.js`, `backend/src/models/Appointment.js`, `backend/src/models/AuditLog.js`, `backend/src/models/User.js`, `backend/src/models/index.js`, `backend/src/modules/audit/audit.service.js`, `backend/tests/models.test.js` | Completed |
| **2026-10-14 15:55 UTC** | Users / Module | Streamlined User model to strict user fields (`name`, `email`, `passwordHash`, `roleIds`, `isArchive`, `status: ["active", "disabled"]`), added archive/restore endpoints, updated user validation and APIs. | `backend/src/models/User.js`, `backend/src/utils/userSerializer.js`, `backend/src/modules/users/user.service.js`, `backend/src/modules/users/user.controller.js`, `backend/src/modules/users/user.routes.js`, `backend/src/modules/users/user.validator.js`, `backend/tests/users.test.js` | Completed |
| **2026-10-15 04:20 UTC** | Users / Module | Refactored User module to exact 7 Super Admin APIs (`POST /doctors`, `POST /receptionists`, `GET /`, `GET /:id`, `PATCH /:id`, `PATCH /:id/status`, `DELETE /:id`), removed unneeded endpoints, seeded Doctor & Receptionist roles, enforced Super Admin authorization. | `backend/src/middleware/requirePermission.js`, `backend/src/seeds/roles.js`, `backend/src/modules/users/user.routes.js`, `backend/src/modules/users/user.controller.js`, `backend/src/modules/users/user.service.js`, `backend/src/modules/users/user.validator.js`, `backend/src/utils/userSerializer.js`, `backend/tests/users.test.js` | Completed |
| **2026-10-15 04:30 UTC** | Users / Permissions | Integrated granular permission middleware (`users.create`, `users.view`, `users.update`, `users.delete`) on all user module routes and expanded test suite. | `backend/src/modules/users/user.routes.js`, `backend/src/middleware/requirePermission.js`, `backend/tests/users.test.js` | Completed |
| **2026-10-15 04:45 UTC** | Doctors / Module | Implemented Doctor module (`/api/v1/doctors`) with 7 endpoints, full permissions matrix (Super Admin, Receptionist, Doctor), Joi validation, pagination/filtering/sorting, unique email check, department validation, appointment history guard, inactive doctor appointment booking block, direct document returns matching module conventions (removed `doctor.serializer.js`). | `backend/src/models/Doctor.js`, `backend/src/models/Appointment.js`, `backend/src/models/Department.js`, `backend/src/middleware/authenticate.js`, `backend/src/middleware/requirePermission.js`, `backend/src/modules/doctor/doctor.validator.js`, `backend/src/modules/doctor/doctor.service.js`, `backend/src/modules/doctor/doctor.controller.js`, `backend/src/modules/doctor/doctor.routes.js`, `backend/src/app.js`, `backend/tests/doctors.test.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-15 05:10 UTC** | Doctors / Refactor | Streamlined `doctor.service.js`: removed redundant in-service permission checks (delegated to route middleware), eliminated duplicate user/email creation logic by delegating directly to `userService.createDoctor`. | `backend/src/modules/doctor/doctor.service.js`, `backend/src/modules/users/user.service.js`, `backend/tests/doctors.test.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-15 05:20 UTC** | Utils / Refactor | Avoided and removed unnecessary `userSerializer.js`: configured User model `toJSON` transform to strip `passwordHash` and `__v`, returned user documents directly in `user.service.js`, `auth.service.js`, and `profile.service.js`, and inlined session serialization in `session.service.js`. | `backend/src/models/User.js`, `backend/src/modules/users/user.service.js`, `backend/src/modules/auth/auth.service.js`, `backend/src/modules/profile/profile.service.js`, `backend/src/modules/sessions/session.service.js`, `backend/src/utils/userSerializer.js` (deleted), `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-15 05:22 UTC** | Utils / Pagination | Created unified common filtering (`buildFilter`) and pagination/sorting/filtering query executor (`paginate`) in `utils/pagination.js`; updated `user.service.js` list to use `paginate`. | `backend/src/utils/pagination.js`, `backend/src/modules/users/user.service.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-15 05:25 UTC** | Departments / Module | Implemented Department module (`/api/v1/departments`) with 5 APIs (`POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`), Joi validation, unique name duplicate prevention, pagination & filtering via common `paginate`, deactivation guards checking active doctors and future appointments, appointment booking exclusion for inactive departments, permissions seed, and 100% test coverage. | `backend/src/modules/department/department.validator.js`, `backend/src/modules/department/department.service.js`, `backend/src/modules/department/department.controller.js`, `backend/src/modules/department/department.routes.js`, `backend/src/models/Appointment.js`, `backend/src/constants/permissions.js`, `backend/src/seeds/roles.js`, `backend/src/app.js`, `backend/tests/departments.test.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-15 05:35 UTC** | Doctors / Refactor | Updated Doctor listing to use the common `paginate` helper; enhanced `buildFilter` with `regexFields` and async `customFilter` support. | `backend/src/utils/pagination.js`, `backend/src/modules/doctor/doctor.service.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-15 05:55 UTC** | Patients / Module | Implemented complete Patient module (`/api/v1/patients`) with 8 endpoints, common pagination/search/sorting via `paginate`, unique ID generation/validation, patient deactivation with appointment history preservation, and new booking guards for deactivated patients. | `backend/src/models/Patient.js`, `backend/src/models/Appointment.js`, `backend/src/constants/permissions.js`, `backend/src/seeds/roles.js`, `backend/src/modules/patient/patient.validator.js`, `backend/src/modules/patient/patient.service.js`, `backend/src/modules/patient/patient.controller.js`, `backend/src/modules/patient/patient.routes.js`, `backend/src/app.js`, `backend/tests/patients.test.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-15 06:20 UTC** | Slots / Module & Role Check | Implemented Slot module schedule APIs (`POST /`, `GET /`, `PUT /`, `GET /:doctorId`, `PUT /:doctorId`), centralized unified `checkRole` helper/middleware across the project, enforced strict Doctor own-schedule view and Super Admin privileges, and validated session/break non-overlap constraints. | `backend/src/utils/checkRole.js`, `backend/src/middleware/requirePermission.js`, `backend/src/modules/slot/slot.validator.js`, `backend/src/modules/slot/slot.service.js`, `backend/src/modules/slot/slot.controller.js`, `backend/src/modules/slot/slot.routes.js`, `backend/src/app.js`, `backend/tests/slots.test.js`, `backend/tests/models.test.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-15 06:30 UTC** | Slots / Permissions Refactor | Renamed permissions to `doctorschedule` (`doctorschedule.create`, `doctorschedule.view`, `doctorschedule.update`, `doctorschedule.delete`) in `permissions.js` and `roles.js`; applied `requirePermission("doctorschedule.*")` across all schedule routes; retained `checkRole(userOrReq, "Super Admin", "Doctor")` inside the service layer. | `backend/src/constants/permissions.js`, `backend/src/seeds/roles.js`, `backend/src/modules/slot/slot.routes.js`, `backend/src/modules/doctorschedule/slot.routes.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-15 06:55 UTC** | DoctorSchedule / Module Renaming | Renamed `slot.*.js` files in `doctorschedule` module to `doctorschedule.*.js` (`doctorschedule.controller.js`, `doctorschedule.routes.js`, `doctorschedule.service.js`, `doctorschedule.validator.js`), configured routes with `requirePermission("doctorschedule.*")`, mounted at `/api/v1/doctorschedule` and aliases. | `backend/src/modules/doctorschedule/doctorschedule.controller.js`, `backend/src/modules/doctorschedule/doctorschedule.routes.js`, `backend/src/modules/doctorschedule/doctorschedule.service.js`, `backend/src/modules/doctorschedule/doctorschedule.validator.js`, `backend/src/app.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-15 07:15 UTC** | Slots / Dynamic Slot Module | Implemented full Slot Module (`/api/v1/slots`) with 5 APIs (`POST /generate`, `GET /`, `GET /:id`, `PATCH /:id`, `POST /regenerate`), schedule-based slot interval computation, lunch/break skipping, doctor working day validation, atomic non-overlapping generation, doctor own-slots access enforcement via common `checkRole` in service, slot regeneration preserving booked slots, and granular `requirePermission("slots.*")`. | `backend/src/modules/slot/slot.validator.js`, `backend/src/modules/slot/slot.service.js`, `backend/src/modules/slot/slot.controller.js`, `backend/src/modules/slot/slot.routes.js`, `backend/src/app.js`, `backend/tests/slots.test.js`, `backend/tests/doctorschedule.test.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-15 07:30 UTC** | Appointments / Module & Double-Booking Prevention | Implemented complete Appointment Module (`/api/v1/appointments`) with 7 APIs (`POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `POST /:id/arrive`, `POST /:id/complete`), atomic slot reservation preventing double booking in database (`Slot.findOneAndUpdate`), doctor own-appointment scoping for listing, viewing, updating consultation notes, and completing via centralized `checkRole`, automatic slot release on cancellation and rescheduling, status workflow validation (`scheduled` -> `arrived` -> `completed` / `cancelled`), and granular `requirePermission("appointments.*")`. | `backend/src/modules/appointment/appointment.validator.js`, `backend/src/modules/appointment/appointment.service.js`, `backend/src/modules/appointment/appointment.controller.js`, `backend/src/modules/appointment/appointment.routes.js`, `backend/src/app.js`, `backend/tests/appointments.test.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-15 08:00 UTC** | Audit / Standardization | Audited all module functions for `auditService.log` usage; standardized `entity` and `entityId` fields across all services; added audit logging to direct doctor creation, auth logout, and resend-verification; made `auditService.log` resilient with safe error handling and backward-compatible parameter resolution (`entityId`/`resourceId`, `email`/`metadata`). | `backend/src/modules/audit/audit.service.js`, `backend/src/modules/auth/auth.service.js`, `backend/src/modules/auth/auth.controller.js`, `backend/src/modules/doctor/doctor.service.js`, `backend/src/modules/users/user.service.js`, `backend/src/modules/roles/role.service.js`, `backend/src/modules/sessions/session.service.js`, `backend/src/modules/settings/settings.service.js`, `backend/src/modules/profile/profile.service.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-15 18:40 UTC** | Auth / Cookie & Seed Fix | Made `seedSuperAdmin` idempotent to avoid duplicate key conflict on existing admin accounts; added automatic clearing of `sid` and `access_token` cookies in `errorHandler.js` when catching 401 Unauthorized errors to prevent stale cookie loops. | `backend/src/seeds/superAdmin.js`, `backend/src/middleware/errorHandler.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-16 02:55 UTC** | Dashboard / Tests & Stabilization | Adjusted test appointment timestamps relative to start of day in `tests/dashboard.test.js` to ensure reliable test execution across all local timezones without future/past time drift. | `backend/tests/dashboard.test.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-16 02:58 UTC** | Dashboard / Perspective Query Support | Added `role` and `doctorId` query support to `GET /api/v1/dashboard/summary` in `dashboard.validator.js` and `dashboard.service.js` enabling Super Admin to inspect individual doctor and front-desk receptionist statistics without mock data. | `backend/src/modules/dashboard/dashboard.validator.js`, `backend/src/modules/dashboard/dashboard.service.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-16 04:10 UTC** | Doctors / Delete & Status Sync | Added permanent delete support to `DELETE /api/v1/doctors/:id?permanent=true` when doctor has 0 appointments (cleans up doctor, schedules, slots, and archives user); synchronized user status when updating doctor profile status; accepted `slotDurationMinutes` alongside `consultationDuration` in validation schema and service. | `backend/src/modules/doctor/doctor.validator.js`, `backend/src/modules/doctor/doctor.service.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-16 05:12 UTC** | Slots / Session Alignment & Break Exclusion | Enhanced `calculateSlotIntervals` to safely handle session/break time fields (`startTime`/`start`, `endTime`/`end`), strictly exclude intervals overlapping doctor rest breaks, and updated `generateSlots` to automatically purge stale available slots from outdated schedules while preserving booked appointments. | `backend/src/modules/slot/slot.service.js`, `backend/PROJECT_DETAILS.md` | Completed |
| **2026-10-16 06:28 UTC** | Socket.IO / Real-Time Appointments | Initialized Socket.IO on existing Express HTTP server with handshake authentication middleware (resolves stateful session cookie or bearer token, maps doctor profile & role rooms), implemented secure room-scoped `emitAppointmentEvent` emitting after successful DB ops across 5 lifecycle APIs (`appointment:created`, `appointment:updated`, `appointment:cancelled`, `appointment:arrived`, `appointment:completed`) with consistent payload (`appointmentId`, `doctorId`, `status`, `changedFields`, `appointment`), added unit & integration test suite passing 100%. | `backend/src/socket.js`, `backend/src/server.js`, `backend/src/modules/appointment/appointment.service.js`, `backend/tests/socket.test.js`, `backend/package.json`, `backend/PROJECT_DETAILS.md` | Completed |

---


### Step-by-Step Change Log Detail

#### Entry 1: Standardized Logging Format
- **Purpose**: Ensure all HTTP requests generate clean, structured logs for monitoring and auditing.
- **Implementation**: Added customProps function to `pinoHttp` in `backend/src/app.js`.

#### Entry 2: Instant User Activation on Signup
- **Purpose**: Prevent user lockouts during local testing and simplify signup flow by eliminating forced email verification requirement.
- **Implementation**: Set `status: "active"` and `emailVerifiedAt: Date.now` in `backend/src/models/User.js`.

#### Entry 3: Master Project Details & Work Tracker Setup
- **Purpose**: Single source of truth for the entire backend architecture, models, routes, environment, and ongoing task updates.
- **Implementation**: Created `backend/PROJECT_DETAILS.md` and added rules to guide all subsequent agent and developer executions.

#### Entry 4: AuditLog Role & Entity Integration
- **Purpose**: Ensure audit log entries record the actor's role and target entity for accurate tracking and filtering.
- **Implementation**: Added `role`, `entity`, and `Entity` fields with indexes and automatic synchronization hooks in `backend/src/models/AuditLog.js`; updated `auditService.log` and `auditService.list` in `backend/src/modules/audit/audit.service.js` to automatically extract, write, and query both fields.

#### Entry 5: Simplified AuditLog Model Fields
- **Purpose**: Streamline audit log records by eliminating unnecessary metadata fields (`Entity`, `resourceType`, `resourceId`, `ip`, `userAgent`, `metadata`).
- **Implementation**: Removed extraneous fields and hooks from `backend/src/models/AuditLog.js` and `backend/src/modules/audit/audit.service.js`, retaining only `actorId`, `actorEmail`, `role`, `action`, `module`, and `entity`.

#### Entry 6: Access Token Cookies & Refresh API
- **Purpose**: Support dual-cookie authentication (long-lived session/refresh cookie + short-lived `access_token` cookie) with a lightweight token refresh route.
- **Implementation**: Configured `accessCookieOptions` and `sessionCookieOptions` in `backend/src/config/cookie.js`, added `createAccessToken` in `backend/src/utils/tokens.js`, updated `setSession` and `clearSession` in `backend/src/modules/auth/auth.controller.js`, implemented `authService.refresh(rawToken)`, and wired up `POST /api/v1/auth/refresh` route in `backend/src/modules/auth/auth.routes.js`.

#### Entry 7: Healthcare Domain Models & AuditLog Enhancement
- **Purpose**: Implement MediSlot core medical appointment entities, scheduling, slot management, and audit tracking.
- **Implementation**:
  - `Department.js`: Name (unique), description, isActive flag.
  - `Doctor.js`: Linked to `User` (unique) and `Department`, specialization, consultationDuration.
  - `Patient.js`: Unique `patientId`, name, mobile, dateOfBirth, gender with indexing on mobile and name.
  - `DoctorSchedule.js`: Doctor reference (unique), workingDays (1-7), sessions array, breaks array, slotDurationMinutes.
  - `Slot.js`: Doctor reference, startAt, endAt, status (`available`/`booked`), with unique compound index `{ doctorId: 1, startAt: 1 }`.
  - `Appointment.js`: Links Patient, Doctor, Department, Slot, bookedBy User; purpose, notes, status, appointmentDate, and indexing.
  - `AuditLog.js`: Updated to support `userId`, `role`, `action`, `entity`, `entityId`, `timestamp`, keeping compatibility with `actorId`.
  - `User.js`: Added `doctor` virtual reference for `User → Doctor` resolution.
  - `models/index.js`: Central barrel exporting all models.
  - `tests/models.test.js`: Comprehensive automated test suite validating all schemas, indexes, and entity relationships.

#### Entry 8: Streamlined User Model & Updated User APIs
- **Purpose**: Keep the User model strictly minimal according to user requirements, eliminate extraneous fields, remove `pending_verification`, add `isArchive` field, and update user module endpoints/validators.
- **Implementation**:
  - `User.js`: Contains only `name`, `email`, `passwordHash`, `roleIds`, `isArchive: Boolean` (default `false`), and `status: ["active", "disabled"]` (default `"active"`), with `{ timestamps: true }`.
  - Indexes: `{ email: 1 }` unique with `{ isArchive: false }` partial filter, `{ status: 1 }`, `{ roleIds: 1 }`, and `{ isArchive: 1 }`.
  - `user.validator.js`: Removed `pending_verification` from valid status values; added `isArchive` boolean; removed obsolete fields.
  - `user.service.js`: Replaced `deletedAt: null` with `isArchive: false`; updated `list` with `isArchive` filtering; added `archive` and `restore` handlers; updated `create` and `update` logic.
  - `user.controller.js` & `user.routes.js`: Added `POST /api/v1/users/:id/archive` and `POST /api/v1/users/:id/restore` endpoints alongside soft delete `DELETE /api/v1/users/:id`.
  - `userSerializer.js`: Added `isArchive` and streamlined returned properties.
  - `tests/users.test.js`: Created test suite covering user creation, rejection of `pending_verification`, details updating, archiving & restoring, and activating/deactivating.

#### Entry 9: User Module Refactoring for Super Admin Exact APIs
- **Purpose**: Strip out all unneeded user module endpoints and implement the exact 7 Super Admin APIs according to specifications.
- **Implementation**:
  - `requirePermission.js`: Added `requireSuperAdmin` middleware guarding all user administration operations.
  - `roles.js` (seed): Added `Doctor` and `Receptionist` system roles.
  - `user.routes.js`: Guarded by `authenticate` and `requireSuperAdmin`, exposing only:
    1. `POST /doctors` — Create a doctor login account (creates User and Doctor document if department/specialization provided).
    2. `POST /receptionists` — Create a receptionist login account (assigns `receptionist` role).
    3. `GET /` — List users (supports pagination, search, status, roleId, isArchive).
    4. `GET /:id` — Get single user details (populates roles and doctor virtual).
    5. `PATCH /:id` — Update user details (name, email, password, roleIds).
    6. `PATCH /:id/status` — Activate or deactivate account (checks last Super Admin guard, clears sessions if disabled).
    7. `DELETE /:id` — Soft-delete / archive user account (checks last Super Admin guard, clears sessions).
  - `user.controller.js` & `user.service.js`: Cleaned up to support only the 7 routes. Removed obsolete endpoints (`POST /`, `/sessions`, `/archive`, `/restore`, `/reset-password`, `/activate`, `/deactivate`).
  - `userSerializer.js`: Populates `doctor` virtual details when present on the user document.
  - `tests/users.test.js`: Validated all 7 endpoints with automated tests passing 100%.

#### Entry 10: Granular Permission Enforcement on User Module Endpoints
- **Purpose**: Enforce exact permissions on all 7 User management APIs while permitting Super Admin to bypass checks.
- **Implementation**:
  - `user.routes.js`: Added `requirePermission("users.create")` for `POST /doctors` and `POST /receptionists`, `requirePermission("users.view")` for `GET /` and `GET /:id`, `requirePermission("users.update")` for `PATCH /:id` and `PATCH /:id/status`, and `requirePermission("users.delete")` for `DELETE /:id`.
  - `requirePermission.js`: Fixed exports to ensure `requirePermission`, `requireSuperAdmin`, `requireVerified`, and `requireRole` are available.
  - `tests/users.test.js`: Added automated test cases asserting 403 Forbidden responses for unauthorized members and 200/201 responses for authorized callers.

#### Entry 11: Doctor Module APIs & Permissions Matrix Implementation
- **Purpose**: Implement the 7 Doctor Module APIs (`/api/v1/doctors`) according to specs with role permissions matrix, validation, search/filtering/pagination, and integrity guarantees.
- **Implementation**:
  - `Doctor.js`: Added `status` (`"active"` / `"disabled"`) and `isActive: Boolean` (default `true`) fields with indexes.
  - `Appointment.js`: Added pre-save validation hook preventing appointment creation or rescheduling with inactive or non-existent doctors.
  - `permissions.js`: Added `doctors.view`, `doctors.create`, `doctors.update`, `doctors.delete` permissions to system catalog.
  - `roles.js` (seed): Assigned `doctors.view` and `doctors.update` to Doctor role, and `doctors.view` to Receptionist role.
  - `requirePermission.js`: Kept strictly minimal with `requirePermission`, `requireSuperAdmin`, and `requireVerified`. Removed `requireRole`.
  - `doctor.validator.js`: Joi validation schemas for creating, listing (with pagination, sort, search, filters), updating profile, assigning specialization, and changing department.
  - Removed `doctor.serializer.js` and returned populated Doctor documents directly with virtuals enabled (`toJSON: { virtuals: true }`).
  - `doctor.service.js`:
    - `POST /api/v1/doctors`: Super Admin creates doctor profile; validates unique user email; validates department exists and is active; synchronizes User & Doctor records with active status and doctor role.
    - `GET /api/v1/doctors`: Guarded with `requirePermission("doctors.view")` (accessible to Super Admin, Receptionist, Doctor); paginated via `parsePagination`, sorted via `parseSort`, filtered by `departmentId`, `specialization`, `status`, and text `search` across doctor user name/email/specialization.
    - `GET /api/v1/doctors/:id`: Guarded with `requirePermission("doctors.view")`; lookup by doctor `_id` or `userId`.
    - `PATCH /api/v1/doctors/:id`: Guarded with `requirePermission("doctors.update")`; Super Admin or Doctor own profile only; doctors prohibited from changing role, department, status, or specialization.
    - `PATCH /api/v1/doctors/:id/specialization`: Super Admin assigns/updates doctor's specialization.
    - `PATCH /api/v1/doctors/:id/department`: Super Admin assigns/changes department; verifies department exists and is active.
    - `DELETE /api/v1/doctors/:id`: Super Admin deactivates doctor; sets doctor and user status to `disabled`; invalidates active sessions; preserves appointment history intact.
  - `doctor.controller.js` & `doctor.routes.js`: Wired endpoints with standard `requirePermission` and `requireSuperAdmin` guards.
  - `app.js`: Mounted router at `/api/v1/doctors`.
  - `tests/doctors.test.js`: Comprehensive test suite validating all 7 endpoints, full permissions matrix, appointment guards, validation failures, and consistency checks.

#### Entry 12: Doctor Service Simplification & User Service Reuse
- **Purpose**: Remove redundant in-service permission checks in `doctor.service.js` and eliminate duplicate user creation / unique email validation logic by delegating directly to `userService.createDoctor`.
- **Implementation**:
  - `doctor.service.js`:
    - Replaced custom user creation and email duplicate checks with a call to `userService.createDoctor(payload, actor, req)`.
    - Removed `// Permission check: Super Admin or own profile only` block from `update`, allowing route-level `requirePermission("doctors.update")` to handle authorization.
    - Removed unused `getOrCreateRole` and `hashPassword` helpers.
  - `user.service.js`:
    - Updated `createDoctor` to validate active department (`!dept.isActive` check) and initialize `status: "active"` and `isActive: true` on `Doctor.create`.
  - `tests/doctors.test.js`: Updated update tests to assert 403 Forbidden on callers lacking `doctors.update` permission. All 58 backend tests passing.
 
#### Entry 13: Removal of userSerializer.js & Direct Document Returns
- **Purpose**: Avoid unnecessary serialization layer (`userSerializer.js`), aligning User and Session handling with other modules (Doctor, Department) that return clean documents directly.
- **Implementation**:
  - `User.js`: Configured `toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.passwordHash; delete ret.__v; return ret; } }` ensuring security and standard serialization without separate serializer functions.
  - `user.service.js`: Removed `serializeUser` import; returned `items` and `user` directly.
  - `auth.service.js`: Removed `serializeUser` import; returned `{ user }` in `signup` and formatted `{ ...populated.toJSON(), roles, permissions }` in `buildCurrentUser`.
  - `profile.service.js`: Removed `serializeUser` import; returned User document directly.
  - `session.service.js`: Inlined session serialization directly, removing dependency on `userSerializer.js`.
  - Deleted `src/utils/userSerializer.js`.
  - Validated with test suite: all 58 tests across 7 suites passing 100%.

#### Entry 14: Unified Common Pagination, Filtering & Sorting Utility
- **Purpose**: Provide a centralized, reusable function across the project that combines pagination, dynamic filtering (regex text search, exact match mappings, boolean fields, base filters), and sorting into a single call.
- **Implementation**:
  - `src/utils/pagination.js`:
    - Added `buildFilter(query, options)`: parses boolean fields, exact key/field maps, escapes regex queries across search fields, and supports custom filter callbacks.
    - Added `paginate(model, query, options)`: executes paginated, sorted, and filtered Mongoose queries, applies projections (`select`) and populations (`populate`), and returns `{ items, pagination: paginationMeta({ page, limit, total }) }`.
    - Maintained full backward compatibility for `parsePagination`, `paginationMeta`, and `parseSort`.
  - `src/modules/users/user.service.js`:
    - Refactored `list` to utilize `paginate(User, query, { ... })`.
  - Automated tests: All 58 backend tests passing.

#### Entry 15: Department Module APIs & Safeguards Implementation
- **Purpose**: Implement the 5 Department Module APIs (`/api/v1/departments`) with Joi validation, name uniqueness, deactivation guards against active doctors & future appointments, appointment booking exclusion for inactive departments, and common pagination.
- **Implementation**:
  - `src/models/Appointment.js`: Updated pre-save hook to block booking appointments with inactive departments.
  - `src/constants/permissions.js`: Added `departments.view`, `departments.create`, `departments.update`, `departments.delete` permissions.
  - `src/seeds/roles.js`: Granted `departments.view` to Doctor and Receptionist roles.
  - `src/modules/department/department.validator.js`: Joi validation schemas for creating, listing (with pagination, sort, search, isActive filter), and updating departments.
  - `src/modules/department/department.service.js`:
    - `create`: Validates unique name case-insensitively, creates Department, logs audit trail.
    - `list`: Reuses common `paginate` helper with text search across `name` & `description`, boolean filter `isActive`, and sorting.
    - `getById`: Validates ObjectId and returns Department document.
    - `update`: Checks duplicate name on rename; if deactivating (`isActive: false`), asserts no active doctors or future scheduled appointments exist.
    - `deleteOrDeactivate`: Asserts no active doctors or future scheduled appointments exist; if zero references exist, deletes from DB; if historical doctor/appointment references exist, deactivates (`isActive: false`) to preserve audit and historical records.
  - `src/modules/department/department.controller.js`: Clean controller handlers returning standard API envelopes via `ApiResponse.success`.
  - `src/modules/department/department.routes.js`: Guarded by `authenticate` and granular `requirePermission`, mounted in `app.js` at `/api/v1/departments`.
  - `tests/departments.test.js`: Comprehensive integration test suite verifying all 5 APIs, uniqueness validation, deactivation guards, deletion vs deactivation behavior, appointment booking exclusion, and permissions matrix. All 76 tests across 8 test suites passing.

#### Entry 16: Common Pagination & Filtering Integration in Doctor Listing
- **Purpose**: Unify doctor listing under the centralized `paginate` utility, eliminating manual pagination, sorting, and count aggregation across User, Department, and Doctor services.
- **Implementation**:
  - `src/utils/pagination.js`:
    - Added `regexFields` processing to `buildFilter` for field-specific case-insensitive regex filtering (e.g. `specialization`).
    - Made `buildFilter` async and awaited `customFilter`, enabling cross-collection subqueries (e.g. matching `User` IDs for doctor search).
  - `src/modules/doctor/doctor.service.js`:
    - Refactored `list` to invoke `paginate(Doctor, query, { ... })` with `departmentId`, `status`, `specialization`, `search` subquery, and population.
  - Automated tests: All 76 tests across 8 test suites passing 100%.

#### Entry 17: Patient Module APIs & Business Rules Implementation
- **Purpose**: Implement the 8 Patient Module APIs (`/api/v1/patients`) according to specifications, utilizing the common pagination and search helper, enforcing unique patient IDs, and safeguarding appointment history and new bookings upon deactivation.
- **Implementation**:
  - `src/models/Patient.js`: Added `isActive` (Boolean, default `true`), `status` (`"active"` | `"inactive"`, default `"active"`), and indexed both.
  - `src/models/Appointment.js`: Added pre-save validation guard ensuring `patientId` refers to an existing and active patient, blocking appointment bookings for deactivated patients.
  - `src/constants/permissions.js`: Added `patients.view`, `patients.create`, `patients.update`, `patients.delete` to catalog.
  - `src/seeds/roles.js`: Granted full patient management permissions (`patients.view`, `patients.create`, `patients.update`, `patients.delete`) to Receptionist, and `patients.view` to Doctor.
  - `src/modules/patient/patient.validator.js`: Joi validation schemas for patient creation (optional custom `patientId`, required `name`, `mobile`, `dateOfBirth` max now, `gender`), listing (pagination, `patientId`, `name`, `mobile`, `search`, `status`, `isActive`), ID param (ObjectId or patientId), and updating.
  - `src/modules/patient/patient.service.js`:
    - `create`: Validates custom `patientId` uniqueness or auto-generates unique `PT...` ID; saves patient and logs audit.
    - `list`: Uses common `paginate` helper from `utils/pagination.js` across `patientId`, `name`, `mobile`, `search`, and boolean `isActive`.
    - `getById`: Supports resolution by MongoDB ObjectId or `patientId` string.
    - `update`: Updates details with uniqueness validation for `patientId`.
    - `deactivate`: Sets `isActive: false` and `status: "inactive"`, automatically cancels upcoming scheduled appointments, and preserves all historical appointment records (completed, arrived, cancelled) without deletion.
  - `src/modules/patient/patient.controller.js`: Clean controller handlers returning standard API envelopes (`ApiResponse.success`).
  - `src/modules/patient/patient.routes.js`: Guarded with `authenticate` and granular `requirePermission`, mounted in `app.js` at `/api/v1/patients`.
  - `tests/patients.test.js`: Comprehensive integration test suite validating all 8 endpoints, query-based search (`?patientId`, `?name`, `?mobile`), pagination, historical appointment preservation, and deactivation booking guards.
  - Automated tests: All 94 tests across 9 test suites passing 100%.

#### Entry 18: Slot Module Schedule APIs & Centralized checkRole Implementation
- **Purpose**: Implement the doctor schedule management endpoints in the Slot module (`POST /`, `GET /`, `PUT /`, `GET /:doctorId`, `PUT /:doctorId`), create a single, unified common `checkRole` function for checking roles across routes and services (avoiding disparate role check functions), enforce strict role permissions (Super Admin, Doctor own schedule), and validate session/break time continuity and non-overlap.
- **Implementation**:
  - `src/utils/checkRole.js`:
    - Created single, common `checkRole` function.
    - Dual mode functionality:
      1. Direct evaluation: `checkRole(reqOrUser, ...roles)` checks `isSuperAdmin`, `roles` array (slugs, names), and `user.roleIds`, returning boolean.
      2. Express Route Middleware: `checkRole("Super Admin", "Doctor")` returns `(req, res, next)` route guard.
    - Normalizes role names and slugs case-insensitively (e.g. `"super-admin"`, `"Super Admin"`, `"superadmin"`).
    - Avoids proliferation of disparate role-checking functions (`isDoctor`, `isSuperAdmin`, etc.) by serving as the project's single source of role truth.
  - `src/middleware/requirePermission.js`:
    - Refactored `requireSuperAdmin` to use `checkRole(req, "Super Admin")`.
    - Exported `checkRole` (and `requireRole` alias) for clean middleware imports.
  - `src/modules/slot/slot.validator.js`:
    - `configureScheduleSchema`: Validates `doctorId`, `workingDays` (0-7 array), `sessions` (`startTime`, `endTime` in `HH:mm` 24-hr format), `breaks`, and `slotDurationMinutes`.
    - `getScheduleSchema`: Validates optional `doctorId` parameter or query.
    - `updateScheduleSchema`: Validates update payload with at least one field present.
  - `src/modules/slot/slot.service.js`:
    - `timeToMinutes`: Parses `HH:mm` format to minute integers.
    - `validateSessions`: Enforces `startTime < endTime` and asserts strictly non-overlapping session windows.
    - `validateBreaks`: Enforces `startTime < endTime` and asserts non-overlapping break windows.
    - `configureSchedule`: Super Admin only; verifies doctor exists and is active; blocks duplicate schedule configuration with 409 Conflict; records audit log; populates doctor and user info.
    - `getSchedule`: Employs `checkRole(userOrReq, "Super Admin", "Doctor")` directly within the service function without needing any secondary service functions; for Doctors, automatically resolves own doctor record from `req.user._id`, strictly forbidding viewing another doctor's schedule; for Super Admin, allows querying any doctor's schedule or retrieving all schedules; returns 404 if schedule unconfigured.
    - `updateSchedule`: Super Admin only; updates working days, sessions, breaks, and slot duration with full time validations and audit tracking.
  - `src/modules/slot/slot.controller.js`: Clean handlers returning standardized `ApiResponse.success` payloads.
  - `src/modules/slot/slot.routes.js`: Guarded by `authenticate` and `requireSuperAdmin` on `POST`/`PUT` endpoints; `GET` routes directly to the controller where `slotService.getSchedule` enforces role access with `checkRole(req, "Super Admin", "Doctor")`.
  - `src/app.js`: Mounted router at both `/api/v1/slots` and `/api/v1/slot`.
  - `tests/models.test.js`: Updated `beforeAll` with `init()` to ensure schema indexes are built.
  - `tests/slots.test.js`: Integration test suite with 25 tests verifying `checkRole` unit logic, Super Admin configuration, duplicate schedule rejection, session time & overlap validations, doctor own-schedule access, cross-doctor access prevention, update persistence, and alias routes.
  - Automated tests: All 119 tests across all 10 test suites passing 100%.

#### Entry 19: Slot Module Route Alignment with requirePermission
- **Purpose**: Align the slot module routes ([slot.routes.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/backend/src/modules/slot/slot.routes.js)) with the project-wide middleware pattern using `requirePermission("")` across all endpoints, while retaining `checkRole("Super Admin", "Doctor")` inside the service layer for fine-grained role resolution without redundant service functions.
- **Implementation**:
  - `src/constants/permissions.js`: Added `doctorschedule.view`, `doctorschedule.create`, `doctorschedule.update`, `doctorschedule.delete` to the system permission catalog.
  - `src/seeds/roles.js`: Granted `doctorschedule.view` permission to the Doctor role (Super Admin bypasses all permissions by default).
  - `src/modules/slot/slot.routes.js` & `src/modules/doctorschedule/slot.routes.js`:
    - `POST /`: Guarded with `requirePermission("doctorschedule.create")`
    - `GET /` & `GET /:doctorId`: Guarded with `requirePermission("doctorschedule.view")`
    - `PUT /` & `PUT /:doctorId`: Guarded with `requirePermission("doctorschedule.update")`
  - `src/modules/slot/slot.service.js`:
    - Preserved `if (!checkRole(userOrReq, "Super Admin", "Doctor"))` within `getSchedule` to enforce that Doctors can only view their own schedule and block unauthorized cross-doctor access, while Super Admin can view any doctor's schedule or all schedules.
  - Automated tests: All 119 tests across all 10 test suites passing 100%.

#### Entry 20: DoctorSchedule Module File & Route Renaming
- **Purpose**: Fully transition file naming in the `doctorschedule` module from `slot.*` to `doctorschedule.*` ([doctorschedule.controller.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/backend/src/modules/doctorschedule/doctorschedule.controller.js), [doctorschedule.routes.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/backend/src/modules/doctorschedule/doctorschedule.routes.js), [doctorschedule.service.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/backend/src/modules/doctorschedule/doctorschedule.service.js), [doctorschedule.validator.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/backend/src/modules/doctorschedule/doctorschedule.validator.js)), ensuring routes use `requirePermission("doctorschedule.*")` and mounting at `/api/v1/doctorschedule` while retaining `/api/v1/slots` backward compatibility.
- **Implementation**:
  - `src/modules/doctorschedule/`:
    - Created `doctorschedule.controller.js`, `doctorschedule.routes.js`, `doctorschedule.service.js`, and `doctorschedule.validator.js`.
    - Removed old `slot.*.js` files in `doctorschedule`.
  - `src/modules/doctorschedule/doctorschedule.routes.js`:
    - `POST /` guarded by `requirePermission("doctorschedule.create")`
    - `GET /` and `GET /:doctorId` guarded by `requirePermission("doctorschedule.view")`
    - `PUT /` and `PUT /:doctorId` guarded by `requirePermission("doctorschedule.update")`
  - `src/app.js`:
    - Imported `doctorScheduleRoutes` from `./modules/doctorschedule/doctorschedule.routes`.
    - Mounted at `/api/v1/doctorschedule`, `/api/v1/doctorschedules`, and aliases `/api/v1/slots` and `/api/v1/slot`.
  - Automated tests: All 119 tests across all 10 test suites passing 100%.

#### Entry 21: Dynamic Slot Generation & Slot Management Module
- **Purpose**: Implement the 5 Slot Module APIs (`POST /generate`, `GET /`, `GET /:id`, `PATCH /:id`, `POST /regenerate`), generate non-overlapping appointment slots from doctor schedules, enforce Doctor own-slots check inside the service using common `checkRole`, and support slot regeneration preserving existing bookings.
- **Implementation**:
  - `src/modules/slot/slot.validator.js`: Joi schemas for `generateSlotsSchema`, `listSlotsSchema`, `idParamSchema`, `updateSlotSchema`, `regenerateSlotsSchema`.
  - `src/modules/slot/slot.service.js`:
    - `generateSlots`: Validates doctor schedule, checks working days, computes non-overlapping intervals skipping breaks, creates available slots idempotently.
    - `listSlots`: Supports filtering by `doctorId`, `date`, `startDate`, `endDate`, `status`, and pagination via `paginate`. Uses `checkRole(userOrReq, "Doctor")` to restrict doctors to their own slots.
    - `getSlotById`: Returns slot details with populated doctor and department; enforces Doctor own-slot access via `checkRole`.
    - `updateSlotStatus`: Updates slot status (`available` / `booked`).
    - `regenerateSlots`: Deletes available slots for date, calculates new schedule intervals avoiding collisions with booked slots, and preserves existing booked slots.
  - `src/modules/slot/slot.controller.js` & `src/modules/slot/slot.routes.js`: Guarded by `authenticate` and `requirePermission("slots.*")`.
  - Mounted router at `/api/v1/slots` and `/api/v1/slot`.
  - `tests/slots.test.js`: Comprehensive integration test suite validating all 5 slot APIs, break avoidance, idempotent generation, doctor own-slot restrictions, and regeneration preserving bookings.

#### Entry 22: Appointment Module & Atomic Double-Booking Prevention
- **Purpose**: Implement the 7 Appointment Module APIs (`POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `POST /:id/arrive`, `POST /:id/complete`), enforce database-level atomic slot reservations to prevent double-booking, and enforce Doctor own-appointment checks using the common `checkRole` function.
- **Implementation**:
  - `src/modules/appointment/appointment.validator.js`: Joi validation schemas for booking, listing, ID params, updating/rescheduling, and completion with consultation notes.
  - `src/modules/appointment/appointment.service.js`:
    - `bookAppointment`: Validates active patient, doctor, and department; performs atomic slot reservation (`Slot.findOneAndUpdate({ _id: slotId, doctorId, status: "available" }, { $set: { status: "booked" } })`), preventing double-booking; rolls back slot if creation fails.
    - `listAppointments`: Supports pagination, sorting, search (`purpose`, `notes`), and filters (`doctorId`, `patientId`, `status`, `date`); enforces Doctor own-appointments via `checkRole(userOrReq, "Doctor")`.
    - `getAppointmentById`: Returns appointment details with populated references; enforces Doctor own-appointment access via `checkRole`.
    - `updateAppointment`: Allows updating purpose/notes; supports slot rescheduling with atomic reservation of the new slot and automatic release of the old slot; restricts doctors to updating their own appointments.
    - `cancelAppointment`: Validates non-completed status, transitions status to `"cancelled"`, and automatically releases reserved slot back to `"available"`.
    - `markArrived`: Validates scheduled status and transitions appointment to `"arrived"`.
    - `markCompleted`: Restricts Doctors to completing their own appointments; accepts consultation notes; transitions status to `"completed"`.
  - `src/modules/appointment/appointment.controller.js` & `src/modules/appointment/appointment.routes.js`: Guarded by `authenticate` and granular `requirePermission("appointments.*")`.
  - Mounted router at `/api/v1/appointments` and `/api/v1/appointment`.
  - `tests/appointments.test.js`: Integration test suite covering all 7 APIs, atomic double-booking prevention (concurrent/conflict booking rejections), slot rescheduling, cancellation slot release, arrival/completion lifecycle, and Doctor own-appointment access rules.
  - Automated tests: 100% test pass rate across all 12 test suites (147/147 tests).

#### Entry 23: Complete Module Audit Logging Review & Standardization
- **Purpose**: Verify audit logging (`auditService.log`) coverage across all modules, ensure state-changing functions properly log their actions, standardize `entity` and `entityId` parameters across services, and harden `auditService.log`.
- **Implementation**:
  - `src/modules/audit/audit.service.js`:
    - Added support for `actorEmail`, `email`, and `metadata.email` fallback for failed logins or non-user actors.
    - Added `resolvedEntityId = entityId || resourceId || null` for backward compatibility with legacy calls.
    - Wrapped database insert in try-catch with Pino logger warning so audit writes never disrupt API execution if an unexpected DB issue occurs.
  - `src/modules/doctor/doctor.service.js`:
    - Added `auditService.log` for doctor creation (`action: "create"`, `module: "doctors"`, `entity: "Doctor"`, `entityId: doctorDoc._id`) across both user ID and direct user creation paths.
  - `src/modules/auth/auth.service.js` & `auth.controller.js`:
    - Added `auditService.log` to `logout` (`action: "logout"`, `entity: "Session"`).
    - Added `auditService.log` to `resendVerification` (`action: "resend_verification"`).
    - Standardized `signup`, `login_failed`, `login`, `verify_email`, `forgot_password`, `reset_password`, and `change_password` to explicitly provide `entity` and `entityId`.
  - `src/modules/users/user.service.js`:
    - Standardized `createDoctor`, `createReceptionist`, `update`, `updateStatus`, and `remove` to use `entity: "User"` and `entityId: user._id`.
  - `src/modules/roles/role.service.js`:
    - Standardized `create`, `update`, and `remove` to use `entity: "Role"` and `entityId: role._id`.
  - `src/modules/sessions/session.service.js`:
    - Standardized `revoke` and `revokeAll` to use `entity` and `entityId`.
  - `src/modules/settings/settings.service.js` & `src/modules/profile/profile.service.js`:
    - Standardized updates to use `entity` and `entityId`.
  - Validated with automated test suite: 100% pass rate across all 12 test suites (147/147 tests).

#### Entry 20: Removal of Signup, Email Verification & Notification Systems
- **Purpose**: Clean up unneeded public signup, email verification barriers, verification tokens, and in-app notifications according to project requirements.
- **Implementation**:
  - `auth.routes.js`: Removed `POST /signup`, `POST /verify-email`, and `POST /resend-verification`.
  - `auth.controller.js`: Removed `signup`, `verifyEmail`, and `resendVerification` handlers and exports.
  - `auth.service.js`: Removed `signup`, `issueVerification`, `verifyEmail`, and `resendVerification` functions; removed `EmailVerificationToken`, `sendVerificationEmail`, and `notificationService` dependencies.
  - `auth.validator.js`: Removed `signupSchema` and `tokenSchema`.
  - `mailer.js`: Removed `sendVerificationEmail`.
  - `User.js`: Updated `status` enum to `["active", "disabled"]` (removed `pending_verification`).
  - `models/index.js`: Removed `EmailVerificationToken` and `Notification` imports and exports.
  - `models/EmailVerificationToken.js` & `models/Notification.js`: Deleted model files.
  - `modules/notifications/`: Deleted entire module (`notification.routes.js`, `notification.controller.js`, `notification.service.js`).
  - `app.js`: Removed `notificationRoutes` import and `/api/v1/notifications` route mounting.
  - `tests/auth.test.js` & `tests/validation.test.js`: Updated tests to remove signup and verification token checks; verified all 13 test suites (158/158 tests) pass 100%.

#### Entry 24: Configured Doctor and Receptionist Seed Role Permissions Matrix
- **Timestamp**: 2026-10-15T22:24:00+05:30
- **Purpose**: Configure exact permission lists for Doctor and Receptionist roles during database seeding.
- **Role Permissions Configured**:
  - **Doctor (`doctor`)**:
    - `appointments.view`
    - `appointments.update`
    - `patients.view`
    - `doctors.view`
    - `departments.view`
    - `doctorschedule.view`
    - `slots.view`
    - `dashboard.view`
  - **Receptionist (`receptionist`)**:
    - `appointments.create`
    - `appointments.view`
    - `appointments.update`
    - `appointments.delete`
    - `patients.create`
    - `patients.view`
    - `patients.update`
    - `doctors.view`
    - `departments.view`
    - `doctorschedule.view`
    - `slots.view`
    - `dashboard.view`
- **Implementation & Modifications**:
  - `src/seeds/roles.js`: Updated `doctorIds` and `receptionistIds` filters to match the exact specified lists.
  - `tests/doctors.test.js`: Updated doctor profile update test to verify Doctor role (without `doctors.update`) receives 403, and Super Admin successfully updates profile (200).
  - `tests/patients.test.js`: Updated patient deactivation test to verify Receptionist (without `patients.delete`) receives 403, and Super Admin successfully deactivates patient (200).
  - `tests/slots.test.js`: Updated slot generation and status modification tests to verify Receptionist (who only has `slots.view`) receives 403 for slot generation and status patching, while Super Admin succeeds (200/201).
- **Status**: Completed & verified. All 13 test suites pass (158/158 tests).

### 2026-10-15: Dual Access and Refresh Token Handling & Clean Logout
- **Task**: Connect login, logout, and dual access/refresh token handling across backend and frontend.
- **Backend Implementation**:
  - `src/utils/tokens.js`: Added `verifyAccessToken(token)` to validate HMAC-SHA256 JWT access tokens and expiration.
  - `src/middleware/authenticate.js`: Enhanced `authenticate` and `optionalAuthenticate` to support `Authorization: Bearer <accessToken>`, `access_token` cookie, or `sid` session cookie interchangeably.
  - `src/modules/auth/auth.controller.js`: Explicitly returned `refreshToken` along with `accessToken` and `user` in both `login` and `refresh` responses.
  - `src/modules/auth/auth.routes.js`: Applied `optionalAuthenticate` on `POST /logout` to ensure clean cookie clearing and 200 response even if the session has already expired.
  - `src/modules/auth/auth.service.js`: Added fallback deletion of session in DB via body/cookie refreshToken when `sessionId` is not pre-populated.
- **Status**: Completed.

### 2026-10-16 09:30 IST: Added Status Field to Doctor Update Endpoint
- **Task**: Support updating doctor practitioner status (`active` / `disabled`) alongside `name`, `specialization`, `departmentId`, and `consultationDuration`.
- **Backend Implementation**:
  - `src/modules/doctor/doctor.validator.js`: Added `status: Joi.string().valid("active", "disabled")` to `updateDoctorSchema`.
  - `src/modules/doctor/doctor.service.js`: Handled `payload.status` in `update()` to synchronize `doctor.status` and `doctor.isActive` (`status === "active"`).
- **Status**: Completed.

### 2026-10-16 12:20 IST: Future Slot Enforcement, Past Slot Booking Prevention, and Live Rebooking on Slot Cancellation
- **Task**: Enforce backend checks so that slot queries can filter strictly future slots based on current time, prevent booking past slots, and ensure slots released by appointment cancellations or rescheduling can be immediately rebooked by other patients.
- **Backend Implementation**:
  - `src/modules/slot/slot.validator.js`: Added `onlyFuture: Joi.boolean().truthy("true", "1").falsy("false", "0")` query filter to `listSlotsSchema`.
  - `src/modules/slot/slot.service.js`: Added current-time filtering (`startAt: { $gt: now }`) when `onlyFuture` is specified in `listSlots()`. When combined with `date`, bounds query from `max(dayStart, now)` to `dayEnd`, returning zero slots for past dates.
  - `src/modules/appointment/appointment.service.js`:
    - Updated atomic slot reservation in `bookAppointment()` to require `startAt: { $gt: now }`. If slot start time is in the past, rejects with `400 Bad Request` ("Cannot book a past time slot. Please select an upcoming consultation slot.").
    - Updated atomic slot reservation in `updateAppointment()` (rescheduling) to require `startAt: { $gt: now }`. Rejects rescheduling to past slots with `400 Bad Request`.
    - Maintained slot release (`status: "available"`) in `cancelAppointment()` and `updateAppointment()` so cancelled/rescheduled slots can be booked by others immediately.
  - `src/modules/patient/patient.service.js`: Updated `deactivate()` to release slots for any upcoming scheduled appointments back to `"available"`.
  - `src/socket.js`: Granted room membership in `appointments:all` to users with `appointments.create` or `slots.view` so clients on booking/slot views receive real-time appointment cancellation and booking notifications.
  - `tests/slots.test.js`: Added unit tests for `onlyFuture=true` filter asserting past dates return empty lists and upcoming dates return future slots.
  - `tests/appointments.test.js`: Added unit tests verifying rejection of past slot booking and asserting that cancelled slots are freed and can be immediately rebooked by another patient.
### 2026-10-16 13:50 IST: Modular Swagger / OpenAPI 3.0 Documentation Implementation
- **Task**: Implement comprehensive, modular Swagger / OpenAPI 3.0 documentation for all 11 core modules (`appointment`, `audit`, `auth`, `dashboard`, `department`, `doctor`, `doctorschedule`, `patient`, `slot`, `users`, `profile`), centralize aggregation in `config/swagger.js`, mount interactive Swagger UI in `src/app.js`, and document in main `README.md`.
- **Backend Implementation**:
  - Created dedicated modular swagger definition files in each module:
    - `src/modules/appointment/appointment.swagger.js`
    - `src/modules/audit/audit.swagger.js`
    - `src/modules/auth/auth.swagger.js`
    - `src/modules/dashboard/dashboard.swagger.js`
    - `src/modules/department/department.swagger.js`
    - `src/modules/doctor/doctor.swagger.js`
    - `src/modules/doctorschedule/doctorschedule.swagger.js`
    - `src/modules/patient/patient.swagger.js`
    - `src/modules/slot/slot.swagger.js`
    - `src/modules/users/user.swagger.js`
    - `src/modules/profile/profile.swagger.js`
  - `src/config/swagger.js`: Aggregated tags, paths, and component schemas, configured OpenAPI 3.0 base metadata and security schemes (`cookieAuth`, `bearerAuth`).
  - `src/app.js`: Installed `swagger-ui-express`, mounted Swagger UI at `/api-docs` and `/api/docs`, exposed OpenAPI spec at `/api-docs.json`, and configured Helmet CSP to allow inline Swagger assets.
  - `tests/swagger.test.js`: Added automated test suite verifying Swagger JSON, UI endpoints, and presence of all 11 modules.
  - `README.md`: Documented interactive Swagger Explorer URLs and modular architecture table in root README.
- **Status**: Completed & verified. All 15 test suites pass (166/166 tests).







