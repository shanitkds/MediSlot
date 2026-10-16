# MediSlot — Healthcare Appointment & Clinic Scheduling System

A full-stack clinical scheduling and appointment management platform featuring granular role-based access control (RBAC), atomic slot reservation, and real-time Socket.IO updates.

Reusable production foundation for MediSlot:
- `frontend/` — Next.js App Router (JavaScript, Tailwind)
- `backend/` — Express REST API at `/api/v1` (JavaScript, MongoDB, Mongoose)

The apps are independently deployable and can later become separate repositories. MongoDB is accessed only by Express.

---

## Quick Start

### Copy environment files:
```cmd
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

### Start MongoDB and MailHog (recommended):
```bash
docker compose up mongo mailhog -d
```
- **MailHog UI**: [http://localhost:8025](http://localhost:8025)

### Install, seed, and run:

**Backend:**
```bash
cd backend
npm install
npm run seed
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Endpoints & Credentials:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:5000](http://localhost:5000)
- **Interactive Swagger Docs**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **Health**: [http://localhost:5000/health](http://localhost:5000/health)
- **Default Super Admin (from `.env`)**: `admin@example.com` / `ChangeMeNow!23`

*In development the Next.js app rewrites `/api/*` to `http://localhost:5000/api/*` so session cookies stay first-party.*

### Documentation
See [docs/](docs/README.md) for architecture, auth, API, and how to add a module.

### Scripts

| App | Command | Purpose |
| :--- | :--- | :--- |
| **backend** | `npm run dev` | Nodemon API on `:5000` |
| **backend** | `npm run seed` | Permissions, roles, Super Admin |
| **backend** | `npm test` | Jest + Supertest |
| **frontend** | `npm run dev` | Next.js on `:3000` |
| **frontend** | `npm test` | Jest + Testing Library |
| **frontend** | `npm run test:e2e` | Playwright (apps must be running) |

---

## 1. Project Overview

MediSlot simplifies clinical operations by connecting healthcare providers, receptionists, and patients:
- **Stateful Authentication & RBAC**: Session-based auth with granular permissions across Super Admin, Doctor, Receptionist, and Patient roles.
- **Doctor & Department Directory**: Departmental organization, specialized doctor profiles, consultation durations, and availability.
- **Dynamic Scheduling & Slot Generation**: Configurable session intervals, breaks, and auto-generated bookable slots.
- **Atomic Booking Engine**: Concurrency-safe slot reservation to eliminate double bookings.
- **Real-Time Live Updates**: Socket.IO integration for instant appointment and status updates across client dashboards.
- **Interactive OpenAPI 3.0 / Swagger Explorer**: Full API documentation and live request testing available at `/api-docs` and `/api-docs.json`.

> **Additional Technical Documentation**:
> - [Engineering Decisions & Rationale](ENGINEERING_DECISIONS.md) — Architectural rationale, concurrency model, and security trade-offs.
> - [Database Schema & ER Diagram](DATABASE_SCHEMA.md) — Complete visual Mermaid ER diagrams, collection specifications, indexes, and constraints.

---

## 2. Folder Structure

MediSlot follows a modular, clean monorepo architecture separating the backend API service, frontend Next.js application, and technical documentation.

### 2.1 Repository Root Overview

```
MediSlot/
├── backend/                 # Express 4 REST API, MongoDB Mongoose models, Socket.IO server
├── frontend/                # Next.js 15 App Router, React 19, Tailwind CSS, TanStack Query
├── docs/                    # Dedicated technical & operational documentation
├── docker-compose.yml       # Local development services (MongoDB 7.0 & MailHog SMTP)
├── DATABASE_SCHEMA.md       # Complete MongoDB schema reference and ER diagrams
├── ENGINEERING_DECISIONS.md # In-depth architectural trade-offs, concurrency & security rationale
└── README.md                # Master project documentation & developer guide
```

---

### 2.2 Backend Directory Structure (`backend/`)

```
backend/
├── .env                     # Local environment configuration & secrets (git-ignored)
├── .env.example             # Template for required environment variables
├── Dockerfile               # Production container definition
├── jest.config.js           # Jest automated test runner configuration
├── package.json             # Backend dependencies, scripts, and runtime engines
├── PROJECT_DETAILS.md       # Master project reference and live execution change log
├── src/
│   ├── server.js            # Server entrypoint: boots MongoDB, HTTP server, and Socket.IO
│   ├── app.js               # Express application initialization & middleware pipeline
│   ├── socket.js            # Socket.IO initialization, handshake auth & room-based emitters
│   ├── config/              # Centralized environment & infrastructure configurations
│   │   ├── cookie.js        # Cookie options for session (`sid`) and access tokens
│   │   ├── cors.js          # CORS whitelist, origin validation, and credentials
│   │   ├── db.js            # Mongoose connection handler with retry logic
│   │   ├── env.js           # Joi-validated environment variables and runtime typing
│   │   └── logger.js        # Pino structured logger instance with custom formatting
│   ├── constants/           # Global enums, system roles, and permissions
│   │   ├── permissions.js   # Granular system permissions catalog (modules & actions)
│   │   └── roles.js         # Default role definitions (Super Admin, Doctor, Receptionist)
│   ├── middleware/          # Express middleware pipeline components
│   │   ├── authenticate.js  # Stateful session resolver & user population from `sid` cookie
│   │   ├── csrf.js          # Double-submit CSRF protection for mutating requests
│   │   ├── errorHandler.js  # Global error handler with formatted JSON error responses
│   │   ├── maintenance.js   # System maintenance mode guard
│   │   ├── notFound.js      # 404 handler for unmatched routes
│   │   ├── rateLimit.js     # Rate-limiting buckets (global API, auth, password reset)
│   │   ├── requestId.js     # Unique `X-Request-ID` attribution for distributed tracing
│   │   ├── requirePermission.js # Granular permission & Super Admin authorization gates
│   │   └── validate.js      # Joi request schema validation middleware (body, query, params)
│   ├── models/              # Mongoose database schemas & models
│   │   ├── index.js         # Centralized export barrel for all database models
│   │   ├── Appointment.js   # Appointment bookings, consultation notes, and status
│   │   ├── AuditLog.js      # Minimal immutable system event audit trail
│   │   ├── Department.js    # Clinical departments with uniqueness constraints
│   │   ├── Doctor.js        # Doctor profiles linked to User and Department
│   │   ├── DoctorSchedule.js# Weekly schedules, working days, sessions, and breaks
│   │   ├── PasswordResetToken.js # One-time password reset tokens with TTL expiry
│   │   ├── Patient.js       # Patient demographic records with unique patientId
│   │   ├── Permission.js    # Granular permission registry
│   │   ├── Role.js          # System roles with permission mappings
│   │   ├── Session.js       # Stateful user sessions with token hashes and TTL index
│   │   ├── Settings.js      # Global application & clinic operational settings
│   │   ├── Slot.js          # Individual bookable slots with compound unique indexes
│   │   └── User.js          # User credentials, roles, and status with JSON sanitization
│   ├── modules/             # Domain-driven feature modules (routes, controllers, services, validators)
│   │   ├── appointment/     # Appointment booking, atomic reservation, status updates
│   │   ├── audit/           # System audit log querying and inspection
│   │   ├── auth/            # Login, logout, refresh, password reset, and session verification
│   │   ├── dashboard/       # Aggregated clinical metrics and role-specific stats
│   │   ├── department/      # Department management and active reference guards
│   │   ├── doctor/          # Doctor profiles, department mapping, and specializations
│   │   ├── doctorschedule/  # Weekly schedule configuration and session timing
│   │   ├── patient/         # Patient registration, search, and history tracking
│   │   ├── permissions/     # Permission catalog listing endpoints
│   │   ├── profile/         # Current user profile management
│   │   ├── roles/           # Role management and permission assignments
│   │   ├── sessions/        # Active user session inspection and remote termination
│   │   ├── settings/        # System configuration management
│   │   ├── slot/            # Dynamic slot generation, regeneration, and query engine
│   │   └── users/           # User administration (doctor/receptionist account creation)
│   ├── seeds/               # Database seeder scripts
│   │   ├── index.js         # Main seed runner orchestrating roles, permissions & admin
│   │   ├── roles.js         # Seed catalog for system roles and permission sets
│   │   └── superAdmin.js    # Idempotent Super Admin user creation
│   └── utils/               # Reusable helper functions and abstraction utilities
│       ├── ApiError.js      # Custom operational error class with HTTP status codes
│       ├── ApiResponse.js   # Standardized JSON response formatting utility
│       ├── catchAsync.js    # High-order function catching unhandled async exceptions
│       ├── checkRole.js     # Unified role verification and doctor resource ownership helper
│       ├── hash.js          # Cryptographic hashing helpers (SHA-256 for sessions & tokens)
│       ├── mailer.js        # Nodemailer email transport wrapper
│       ├── pagination.js    # Reusable query builder for pagination, sorting & regex filtering
│       └── tokens.js        # Access and refresh token generation utilities
└── tests/                   # Automated test suite (Jest & Supertest)
    ├── appointments.test.js # Atomic booking, cancellation, and status transition tests
    ├── auth.test.js         # Authentication, session establishment, and cookie tests
    ├── dashboard.test.js    # Role-tailored metrics and appointment summary tests
    ├── departments.test.js  # Department CRUD and deactivation integrity tests
    ├── doctors.test.js      # Doctor profile, specialization, and role tests
    ├── doctorschedule.test.js # Schedule generation and session overlap tests
    ├── health.test.js       # Health check endpoint tests
    ├── helpers.js           # Test fixtures, database resets, and session mocks
    ├── models.test.js       # Mongoose schemas, relationships, and index verification
    ├── patients.test.js     # Patient registration, ID generation, and search tests
    ├── permissions.test.js  # Permission catalog and role mapping tests
    ├── setupEnv.js          # Test environment configuration
    ├── slots.test.js        # Slot generation algorithms and break exclusion tests
    ├── socket.test.js       # Real-time WebSocket event emission and room routing tests
    ├── users.test.js        # User management, doctor/receptionist creation tests
    └── validation.test.js   # Joi request validation tests
```

---

### 2.3 Frontend Directory Structure (`frontend/`)

```
frontend/
├── .env.example             # Template for frontend environment variables
├── .eslintrc.json           # ESLint configuration (Next.js Core Web Vitals)
├── jsconfig.json            # Path alias configuration (`@/*` mapping to root)
├── jest.config.js           # Jest client-side test runner configuration
├── jest.setup.js            # React Testing Library custom DOM matchers
├── playwright.config.js     # Playwright End-to-End test configuration
├── postcss.config.js        # PostCSS configuration for Tailwind CSS
├── tailwind.config.js       # Design tokens, color system, custom shadows, and typography
├── next.config.js           # Next.js 15 build config with API rewrite reverse proxy
├── package.json             # Frontend dependencies (React 19, Next 15, TanStack Query v5)
├── middleware.js            # Next.js Edge middleware for session guards & route redirection
├── FRONTEND_DETAILS.md      # Master frontend architecture reference and live work log
├── app/                     # Next.js 15 App Router directory
│   ├── globals.css          # CSS custom properties (light & dark design tokens), Tailwind directives
│   ├── layout.js            # Root layout (Google Fonts, ToastProvider, AuthProvider, QueryProvider)
│   ├── loading.js           # Global loading skeleton
│   ├── error.js             # Global client error boundary
│   ├── not-found.js         # Global 404 page
│   ├── page.js              # Root entry route (redirects authenticated users to dashboard, guests to login)
│   ├── (auth)/              # Unauthenticated authentication layout & pages
│   │   ├── layout.js        # Auth card shell layout with branding
│   │   ├── login/page.js    # Login page with credentials form
│   │   ├── signup/page.js   # Patient/User registration page
│   │   ├── forgot-password/page.js # Password recovery request page
│   │   ├── reset-password/page.js  # Password reset page with token verification
│   │   ├── verify-email/page.js    # Email verification confirmation page
│   │   └── change-password/page.js # Authenticated password update page
│   └── (dashboard)/         # Authenticated clinical management & dashboard pages
│       ├── layout.js        # Dashboard shell layout with AppShell, Sidebar, Header
│       ├── loading.js       # Dashboard view loading skeleton
│       ├── dashboard/page.js# Role-tailored dashboard (Super Admin, Receptionist, Doctor)
│       ├── appointments/    # Appointment management pages
│       │   ├── page.js      # Appointments list, filters, and status controls
│       │   ├── new/page.js  # Appointment booking wizard with patient & slot selection
│       │   └── [id]/page.js # Appointment details, consultation notes & completion
│       ├── departments/     # Clinical department pages (list, create, edit, details)
│       ├── doctors/         # Doctor directory pages (list, new profile, edit, details)
│       ├── patients/        # Patient directory pages (list, registration, profile, history)
│       ├── schedules/       # Doctor weekly working schedules & session configuration
│       ├── slots/           # Bookable slot generation and daily slot visualizer
│       ├── users/           # Staff & user administration (create doctors/receptionists)
│       ├── audit-logs/page.js # System activity audit log viewer
│       ├── profile/page.js  # Logged-in user profile view & edit
│       ├── settings/        # System & security settings (security, permissions)
│       └── forbidden/page.js# 403 Forbidden access denied screen
├── components/              # Componentized UI architecture (17 categories)
│   ├── ui/                  # 20+ design primitives (Button, Input, Select, Modal, Card, Badge, Drawer, Table)
│   ├── common/              # 16 composite components (DataTable, SearchInput, SearchFilter, Pagination, DatePicker)
│   ├── medical/             # 15 clinical domain widgets (DoctorScheduleCalendar, SlotCalendar, SlotSelector, PatientSearch, BreakTimeEditor)
│   ├── dashboard/           # Role-based dashboards (SuperAdminDashboard, ReceptionistDashboard, DoctorDashboard, StatCard, DashboardChart)
│   ├── layout/              # Structural components (AppShell, Sidebar, Header, Breadcrumbs, MobileSidebar, PermissionGate, UserMenu, ThemeToggle)
│   ├── appointments/        # Appointment domain views (AppointmentsView, BookAppointmentView, AppointmentDetailView)
│   ├── departments/         # Department views & modals (DepartmentsView, DepartmentFormModal, DepartmentDetailView)
│   ├── doctors/             # Doctor management views (DoctorsView, DoctorDetailView, CreateDoctorView, EditDoctorView)
│   ├── patients/            # Patient management views (PatientsView, CreatePatientView, PatientDetailView)
│   ├── schedules/           # Schedule views (SchedulesView, ConfigureScheduleView)
│   ├── slots/               # Slot management views (SlotsView, GenerateSlotsView, SlotDetailView)
│   ├── users/               # User views (UsersView, UserDetailView, CreateDoctorUserView, CreateReceptionistUserView)
│   ├── audit/               # Audit views & modals (AuditLogsView, AuditLogDetailModal, AuditStats)
│   ├── auth/                # Authentication forms (LoginForm, SignupForm, ForgotPasswordForm, ResetPasswordForm)
│   ├── permissions/         # Permission matrix & access control widgets (PermissionGate, AccessDenied)
│   ├── profile/             # Profile management views (ProfileView)
│   └── settings/            # Security settings views (SecuritySettingsView)
├── contexts/                # React context providers
│   ├── AuthProvider.js      # Session management, current user state, and `can()` permission evaluation
│   └── ToastProvider.js     # Global toast notification stack (`toast.success()`, `toast.error()`)
├── providers/               # App-level state providers
│   └── QueryProvider.js     # TanStack React Query client provider with caching defaults
├── hooks/                   # Custom React hooks
│   ├── queries/             # 11 TanStack Query hook suites for server-state synchronization
│   │   ├── useAppointmentQuery.js   # Appointment queries and mutation hooks
│   │   ├── useAuditQuery.js         # Audit log query hooks
│   │   ├── useAuthQuery.js          # Current user session and auth mutation hooks
│   │   ├── useDashboardQuery.js     # Aggregated clinical metrics hooks
│   │   ├── useDepartmentQuery.js    # Department listing and mutation hooks
│   │   ├── useDoctorQuery.js        # Doctor directory and specialization hooks
│   │   ├── useDoctorScheduleQuery.js# Doctor working schedule hooks
│   │   ├── usePatientQuery.js       # Patient search and profile hooks
│   │   ├── useSlotQuery.js          # Slot generation and query hooks
│   │   └── useUserQuery.js          # User administration hooks
│   ├── useAppointmentSocket.js      # Socket.IO client hook with automatic React Query invalidation
│   ├── useAuth.js                   # Authentication context hook export
│   ├── usePermission.js             # Boolean permission evaluation hook
│   ├── useDebouncedSearch.js        # Debounced search input state hook
│   └── usePagination.js             # Page & limit state management hook
├── services/                # API client abstraction services (pure functions calling apiClient)
│   ├── appointmentService.js# Appointment booking, arrival, completion, and cancellation
│   ├── auditService.js      # System audit query service
│   ├── authService.js       # Authentication, login, logout, password resets
│   ├── dashboardService.js  # Summary metrics, today's and upcoming appointments
│   ├── departmentService.js # Department CRUD service
│   ├── doctorScheduleService.js # Doctor weekly schedule service
│   ├── doctorService.js     # Doctor profiles and department assignments
│   ├── patientService.js    # Patient records service
│   ├── profileService.js    # Current user profile service
│   ├── slotService.js       # Slot generation, regeneration, and query service
│   ├── userService.js       # User administration service
│   └── index.js             # Centralized service export barrel
├── lib/                     # Core utilities & foundational libraries
│   ├── api/
│   │   ├── apiClient.js     # Centralized fetch wrapper with 401 redirect, 500 retry & CSRF handling
│   │   └── errors.js        # Structured ApiClientError class and error status parser
│   ├── auth/
│   │   └── session.js       # Client cookie detection utilities
│   ├── permissions/
│   │   └── can.js           # Pure permission checking functions
│   └── utils.js             # Classnames utility (`cn`), date formatting (`formatDate`), avatar initials
├── config/                  # Static application configurations
│   ├── env.js               # Runtime environment variables (`apiUrl`, `appName`)
│   └── nav.js               # Navigation menu items with permission gates
└── constants/               # System enums and route paths
    ├── permissions.js       # System permission constants matching backend
    └── routes.js            # Application route constants and role access matrix
```

---

### 2.4 Documentation Directory Structure (`docs/`)

```
docs/
├── README.md                # Documentation index and architecture handbook
├── adding-module.md         # Guide for implementing new full-stack feature modules
├── api.md                   # REST API design standards, error formats, and response conventions
├── architecture.md          # Multi-tier system architecture and request lifecycle
├── authentication.md        # Stateful session flow, cookie management, and security
├── authorization.md         # Granular Role-Based Access Control (RBAC) specification
├── backend.md               # Backend module conventions, validation, and database patterns
├── components.md            # Frontend UI primitive and composite component catalog
├── database.md              # MongoDB data models, relationships, and indexing strategies
├── deployment.md            # Production deployment guidelines, Docker, and reverse proxy setup
├── frontend.md              # Next.js App Router guidelines, state management, and theming
└── styling.md               # Tailwind CSS design system tokens and dark mode standards
```

---

## 3. Architecture Overview

MediSlot is built on a modern, decoupled **3-Tier + Real-Time WebSocket Architecture** designed for high concurrency, security, and responsiveness.

### 3.1 Multi-Tier Architecture Diagram

```
+===================================================================================+
|                                  CLIENT TIER                                      |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                       Next.js 15 App Router (React 19)                    |   |
|   |  - Route Groups: (public), (auth), (dashboard)                            |   |
|   |  - Role-Tailored Dashboards (Super Admin, Receptionist, Doctor)           |   |
|   |  - Design System: Tailwind CSS 3.4 (Design Tokens, Light/Dark Modes)      |   |
|   |  - Icons: react-icons/fi (Standardized, zero raw SVGs)                    |   |
|   +---------------------------------------------------------------------------+   |
|            |                                                    ^                 |
|            v                                                    |                 |
|   +---------------------------------------+          +------------------------+   |
|   |       State & Data Fetching           |          |   Real-Time Client     |   |
|   |  - TanStack React Query v5 (Cache)    |          |  - Socket.IO Client    |   |
|   |  - Centralized Services Layer         |          |  - useAppointmentSocket|   |
|   |  - AuthProvider (RBAC & can())        |          |  - Auto-Cache Invalidate|  |
|   +---------------------------------------+          +------------------------+   |
+===================================================================================+
             | (HTTP REST + HTTP-Only Cookies)                     ^ (WebSocket)
             |                                                     |
             v                                                     |
+===================================================================================+
|                        EDGE & REVERSE PROXY TIER                                  |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |  Next.js Edge Middleware (middleware.js)                                  |   |
|   |  - First-party 'sid' cookie inspection                                     |   |
|   |  - Unauthenticated route protection (/dashboard -> /login)                |   |
|   |  - Authenticated guest redirect (/login -> /dashboard)                    |   |
|   |  - Next.js Rewrites: /api/* -> http://localhost:5000/api/*                |   |
|   +---------------------------------------------------------------------------+   |
+===================================================================================+
             |                                                     |
             v                                                     v
+===================================================================================+
|                            BACKEND API SERVICE TIER                               |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                         Express 4 HTTP Server                             |   |
|   |  - Security & Observability: Helmet 8, CORS, Request ID, Pino HTTP Logger |   |
|   |  - Traffic Protection: express-rate-limit (Global, Auth, Password Reset)  |   |
|   |  - CSRF Protection: Double-Submit Cookie Mechanism                       |   |
|   +---------------------------------------------------------------------------+   |
|                                     |                                             |
|                                     v                                             |
|   +---------------------------------------------------------------------------+   |
|   |                     Authentication & Security Layer                       |   |
|   |  - Session Resolver: Inspects HTTP-only signed cookie 'sid'               |   |
|   |  - MongoDB Session Lookup & Activity Timestamp Update                     |   |
|   |  - RBAC Middleware: requirePermission('appointments.create', etc.)        |   |
|   |  - Super Admin Override & checkRole Ownership Verification                |   |
|   +---------------------------------------------------------------------------+   |
|                                     |                                             |
|                                     v                                             |
|   +---------------------------------------------------------------------------+   |
|   |                   Domain Modules & Concurrency Engine                     |   |
|   |  - Joi Request Validation (Body, Query, Params)                           |   |
|   |  - Atomic Slot Reservation Engine (Slot.findOneAndUpdate status: 'avail') |   |
|   |  - Dynamic Slot Generation (Doctor schedule, working days, break exclude)|   |
|   |  - Audit Logger (Minimal immutable actor & entity tracking)               |   |
|   +---------------------------------------------------------------------------+   |
|            |                                                    |                 |
|            v                                                    v                 |
|   +-------------------+                              +------------------------+   |
|   |  Socket.IO Server |                              | Nodemailer Transport   |   |
|   |  - Handshake Auth |                              | - SMTP / MailHog       |   |
|   |  - Room Pub/Sub   |                              | - Password Resets      |   |
|   +-------------------+                              +------------------------+   |
+===================================================================================+
             |                                                    |
             v                                                    v
+===================================================================================+
|                                PERSISTENCE TIER                                   |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                         MongoDB 7.0 (Mongoose ODM)                        |   |
|   |  - Atomic Document Locks: Slot status transition ({ status: 'available' }) |   |
|   |  - Compound Indexes: { doctorId: 1, startAt: 1 } (Unique Slot Index)      |   |
|   |  - Partial Indexes: { email: 1 } with { isArchive: false }                |   |
|   |  - Automatic TTL Indexing: Session expiresAt (Automatic Expiration)       |   |
|   +---------------------------------------------------------------------------+   |
+===================================================================================+
```

---

### 3.2 Client Tier (Presentation & State Architecture)

The frontend is implemented using **Next.js 15 (App Router)** and **React 19**:

1. **Route Partitioning**:
   - `(public)`: Public entry and marketing landing.
   - `(auth)`: Unauthenticated auth card layouts (`/login`, `/signup`, `/forgot-password`, `/reset-password`).
   - `(dashboard)`: Authenticated application views wrapped in `AppShell` with responsive sidebar, top navbar, theme switcher, and role gates.
2. **Server-State Synchronization**:
   - **TanStack React Query v5**: Manages asynchronous server state, automated cache caching, query deduplication, and optimistic mutations.
   - **Service Layer**: UI components never call `fetch` or `apiClient` directly; all network calls are routed through dedicated pure service functions in `frontend/services/`.
3. **Role-Based Client Access Control**:
   - `AuthProvider`: Resolves user state upon application mount via `GET /api/v1/auth/me`. Exposes the reactive `can(permission)` helper and current role.
   - `<PermissionGate>`: Page-level authorization wrapper rendering a clean `403 Access Denied` screen if the user lacks the required permission.
   - `<Can>`: Conditional UI primitive that safely hides or displays buttons, actions, and tabs without layout shifts.
4. **Design System & Aesthetics**:
   - Built with Tailwind CSS and CSS custom properties for instant zero-runtime Light/Dark theme switching.
   - 20+ accessible UI primitives in `components/ui/` and 16 composite data management components in `components/common/` (e.g., `DataTable`, `SearchFilter`, `Pagination`).
   - Standardized icons from `react-icons/fi` with 0 raw SVGs.

---

### 3.3 Edge Routing, Reverse Proxy & Session Flow

To guarantee rock-solid session security without cross-site cookie restrictions:
1. **Next.js Edge Middleware (`middleware.js`)**:
   - Inspects incoming requests at the edge.
   - Verifies the existence of the `sid` session cookie.
   - Prevents unauthenticated access to dashboard routes (`/dashboard`, `/appointments`, `/doctors`, etc.) by instantly redirecting to `/login?next=<path>`.
   - Prevents authenticated users from seeing login/signup pages by redirecting them directly to `/dashboard`.
2. **First-Party API Proxy Rewrites**:
   - Configured in `next.config.js`: `/api/:path*` &rarr; `http://localhost:5000/api/:path*`.
   - This ensures requests to the API are treated as **same-origin (first-party)**, eliminating browser third-party cookie blocking, Safari ITP issues, and complex CORS preflight latency.

---

### 3.4 Layered API Service Pipeline (Express 4)

The backend follows a strict **Layered Controller-Service-Repository Pattern**:

```
HTTP Request
     │
     ▼
[Middleware Pipeline]
  ├── X-Request-ID Injection
  ├── Pino HTTP Request Logging (user, role, action, entity)
  ├── Helmet Security Headers
  ├── CORS Origin Validation
  ├── Rate Limiters (Global, Auth, Mutating)
  ├── Cookie Parser (Signed Cookies)
  ├── Double-Submit CSRF Validation
  ├── Stateful Session Authentication (Resolves user from MongoDB)
  ├── Granular RBAC Check (requirePermission)
  └── Joi Input Validation (Body, Query, Params)
     │
     ▼
[Module Controller] ──> Unpacks request, invokes service, passes actor context
     │
     ▼
[Module Service]    ──> Business rules, domain validation, atomic DB operations
     │
     ▼
[Mongoose Model]    ──> Schema validation, compound index constraints, MongoDB ops
     │
     ▼
[Audit & Real-Time] ──> Minimal audit logging + Socket.IO event emission
     │
     ▼
Standard JSON Response (`ApiResponse.success(res, data, message, statusCode)`)
```

---

### 3.5 Real-Time WebSocket Infrastructure (Socket.IO)

MediSlot features instant real-time synchronization to prevent front-desk scheduling conflicts:

1. **Handshake Authentication**:
   - Attached directly to the Express HTTP listener (`backend/src/socket.js`).
   - Authenticates connections during the WebSocket handshake using the session cookie or bearer token.
   - Resolves user identity, role, and associated doctor profile.
2. **Room Architecture**:
   - `role:super_admin`: Receives all clinic-wide operational events.
   - `role:receptionist`: Receives booking, arrival, and scheduling updates.
   - `doctor:<doctorId>`: Scoped exclusively to the specific physician for their appointments.
   - `user:<userId>`: Individual user notifications.
3. **Event Lifecycle & Payloads**:
   - `appointment:created`: Emitted when an appointment is booked.
   - `appointment:updated`: Emitted when an appointment is rescheduled or notes are modified.
   - `appointment:arrived`: Emitted when reception checks in a patient.
   - `appointment:completed`: Emitted when a doctor finishes a consultation.
   - `appointment:cancelled`: Emitted when an appointment is cancelled and the slot is freed.
4. **Client-Side Reactive Updates**:
   - The frontend `useAppointmentSocket` hook listens to WebSocket events and immediately invalidates TanStack Query keys (`["appointments"]`, `["dashboard"]`, `["slots"]`), ensuring all open browser tabs reflect fresh state without manual page refreshes.

---

### 3.6 Concurrency Control & Atomic Booking Engine

In clinical environments, multiple patients or receptionists may attempt to book the same doctor's slot simultaneously. MediSlot guarantees **zero double-booking** through database-level atomic operations:

1. **Pre-Generated Slots Model**:
   - Rather than calculating slots dynamically on every search query, slots are pre-generated from the doctor's weekly `DoctorSchedule` (taking working days, session windows, and lunch/break exclusions into account).
   - Each slot is stored as a concrete document in the `slots` collection with status (`available` or `booked`).
2. **Compound Unique Index**:
   - Enforced at the database level: `{ doctorId: 1, startAt: 1 }` with `{ unique: true }`.
   - Physically prevents duplicate slot generation for the same doctor at the same start time.
3. **Atomic Slot Reservation**:
   - Booking uses an atomic MongoDB operation:
     ```javascript
     const slot = await Slot.findOneAndUpdate(
       { _id: slotId, status: "available" },
       { $set: { status: "booked" } },
       { new: true, session }
     );
     if (!slot) {
       throw new ApiError(409, "Slot has already been booked by another user");
     }
     ```
   - If two requests arrive at the exact same millisecond, MongoDB's document-level locking ensures only one update succeeds; the second request immediately fails with a `409 Conflict`.
4. **Automated Slot Rollback & Release**:
   - When an appointment is cancelled or rescheduled, the associated slot is atomically released back to `status: "available"`.
   - When a schedule is modified, `slotService.regenerateSlots` removes stale unoccupied slots while preserving previously booked appointments.

---

### 3.7 Security & Authorization Architecture (RBAC)

1. **Stateful Session Management**:
   - Sessions are stored in the database (`sessions` collection) with cryptographically hashed tokens (SHA-256).
   - The plain token is transmitted exclusively via an HTTP-only, SameSite signed cookie (`sid`).
   - Sessions have an absolute TTL (7 days) and an inactivity idle timeout (12 hours) managed via MongoDB TTL indexes.
   - Account lockout is enforced after 5 failed login attempts for 15 minutes.
2. **Granular RBAC Matrix**:
   - System permissions are categorized by module and action (e.g., `appointments.create`, `doctors.view`, `users.delete`).
   - Roles aggregate specific permission sets.
   - `requirePermission("permission.name")` middleware verifies permissions at the API route boundary.
   - Super Admins hold an explicit bypass allowing system-wide administration.
3. **Data Scoping & Ownership (`checkRole`)**:
   - Doctors are restricted to accessing their own profile, schedule, slots, and appointments.
   - The centralized `checkRole(user, "Super Admin", "Doctor")` utility enforces multi-role scoping across services.
4. **Structured Audit Logging**:
   - Critical system mutations (user creation, profile changes, appointment completions, role updates) are recorded in an immutable `audit_logs` collection capturing `{ actorId, actorEmail, role, action, module, entity, entityId, timestamp }`.

---

### 3.8 Database & Indexing Strategy

To maintain sub-10ms query execution across growing patient volumes, MediSlot applies targeted indexes:

| Collection | Indexed Fields | Index Type | Purpose |
| :--- | :--- | :--- | :--- |
| **`users`** | `{ email: 1 }` | Unique (Partial: `{ isArchive: false }`) | Uniqueness constraint for active accounts |
| **`users`** | `{ status: 1 }`, `{ roleIds: 1 }` | Standard B-Tree | Fast staff filtering and permission resolution |
| **`slots`** | `{ doctorId: 1, startAt: 1 }` | Compound Unique | Eliminates duplicate time intervals per doctor |
| **`slots`** | `{ doctorId: 1, date: 1, status: 1 }` | Compound | Instant slot availability lookups for calendar views |
| **`appointments`** | `{ appointmentNumber: 1 }` | Unique | Clinical appointment lookup |
| **`appointments`** | `{ doctorId: 1, appointmentDate: 1 }` | Compound | Daily physician schedule retrieval |
| **`appointments`** | `{ patientId: 1 }`, `{ status: 1 }` | Standard B-Tree | Patient medical history and queue status |
| **`patients`** | `{ patientId: 1 }` | Unique | Unique patient identifier lookup |
| **`patients`** | `{ mobile: 1 }`, `{ name: "text" }` | Text & B-Tree | Instant patient search by mobile or name |
| **`sessions`** | `{ tokenHash: 1 }` | Unique | Rapid session cookie validation |
| **`sessions`** | `{ expiresAt: 1 }` | TTL Index (`expireAfterSeconds: 0`) | Automatic background database cleanup |
| **`audit_logs`** | `{ entityId: 1 }`, `{ actorId: 1 }`, `{ createdAt: -1 }` | Compound | Fast audit trail inspection and filtering |

---

## 4. Database Design

MediSlot uses MongoDB via Mongoose with normalized references and targeted indexes:

| Model | Key Fields | Relationships & Indexes |
| :--- | :--- | :--- |
| **`User`** | `name`, `email`, `passwordHash`, `role`, `status`, `failedLoginAttempts` | Unique index on `email` |
| **`Role`** | `name`, `description`, `permissions` | References `Permission` collection |
| **`Permission`** | `name`, `module`, `action`, `description` | Unique index on `name` |
| **`Department`** | `name`, `description`, `isActive` | Unique case-insensitive index on `name` |
| **`Doctor`** | `userId`, `departmentId`, `specialization`, `consultationDuration`, `isActive` | References `User` & `Department` |
| **`DoctorSchedule`** | `doctorId`, `workingDays`, `sessions`, `breaks`, `slotDurationMinutes` | Unique index on `doctorId` |
| **`Patient`** | `patientId`, `name`, `mobile`, `email`, `dateOfBirth`, `gender`, `status` | Unique index on `patientId`, index on `mobile` |
| **`Slot`** | `doctorId`, `date`, `startAt`, `endAt`, `status` (`available`, `booked`) | Compound unique index on `{ doctorId, startAt }` |
| **`Appointment`** | `appointmentNumber`, `patientId`, `doctorId`, `slotId`, `status`, `notes` | References `Patient`, `Doctor`, and `Slot` |
| **`Session`** | `userId`, `tokenHash`, `expiresAt`, `lastActivityAt` | TTL index on `expiresAt` |
| **`AuditLog`** | `userId`, `action`, `entity`, `entityId`, `metadata`, `ipAddress` | Indexed by `entityId`, `userId`, `createdAt` |

---

## 5. API Documentation & Interactive Swagger Explorer

All REST routes are prefixed with `/api/v1` (except `/health` and `/api-docs`).

### 5.1 Interactive Swagger UI & OpenAPI Specification

MediSlot provides comprehensive, interactive Swagger UI documentation generated from dedicated modular Swagger definition files across all core system modules:

- **Interactive Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs) (or [http://localhost:5000/api/docs](http://localhost:5000/api/docs))
- **OpenAPI 3.0 Specification JSON**: [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json)

#### Authenticating in Swagger UI
MediSlot routes are secured with stateful session cookies or JWT tokens. You can authenticate directly within the Swagger UI:
1. **Interactive Session Login (Recommended)**:
   - Navigate to the **Auth** section in Swagger UI.
   - Expand `POST /api/v1/auth/login` and click **Try it out**.
   - Submit the Super Admin credentials (`admin@example.com` / `ChangeMeNow!23`).
   - The browser automatically stores the HTTP-only `sid` session cookie. All subsequent requests in Swagger UI will now be authenticated.
2. **Authorize Modal**:
   - Click the green **Authorize** 🔓 button at the top right of the Swagger UI.
   - Under `bearerAuth`, supply your JWT token (e.g., `eyJhbGciOi...`).
   - Under `cookieAuth`, supply your session ID cookie `sid`.
   - Click **Authorize** and then **Close**.

#### Modular Swagger Architecture
Swagger documentation is cleanly isolated into independent OpenAPI definition files within each respective module directory, aggregated centrally by `backend/src/config/swagger.js` and mounted in `backend/src/app.js`:

| Module | Swagger Definition File | Description |
| :--- | :--- | :--- |
| **Appointment** | `backend/src/modules/appointment/appointment.swagger.js` | Booking, atomic slot reservation, patient check-in, completion notes |
| **Audit** | `backend/src/modules/audit/audit.swagger.js` | System event audit log querying, actor inspection, filtering |
| **Auth** | `backend/src/modules/auth/auth.swagger.js` | Stateful session login, token refresh, logout, password recovery |
| **Dashboard** | `backend/src/modules/dashboard/dashboard.swagger.js` | Aggregated clinical metrics, today's schedule, role perspectives |
| **Department** | `backend/src/modules/department/department.swagger.js` | Clinical departments CRUD, deactivation integrity guards |
| **Doctor** | `backend/src/modules/doctor/doctor.swagger.js` | Physician profiles, specializations, department mappings |
| **DoctorSchedule** | `backend/src/modules/doctorschedule/doctorschedule.swagger.js` | Working days, consultation sessions, and lunch/break time editor |
| **Patient** | `backend/src/modules/patient/patient.swagger.js` | Patient demographics, unique `patientId` generation, search |
| **Slot** | `backend/src/modules/slot/slot.swagger.js` | Dynamic slot generation, regeneration, concurrency locks, queries |
| **Users** | `backend/src/modules/users/user.swagger.js` | Staff management (Doctors & Receptionists), status & role updates |
| **Profile** | `backend/src/modules/profile/profile.swagger.js` | Logged-in user profile view and preferences update |

#### Importing OpenAPI Spec into Postman / Insomnia
You can import the full API schema into your favorite API client:
- **Raw Spec URL**: `http://localhost:5000/api-docs.json`
- In Postman: Click **Import** > Paste `http://localhost:5000/api-docs.json` > Select **OpenAPI 3.0**.

---

### 5.2 Core API Endpoints Reference

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Log in and receive HTTP-only session cookie |
| `POST` | `/api/v1/auth/logout` | Revoke session and clear cookies |
| `GET` | `/api/v1/auth/me` | Fetch active user session, role, and permissions |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset email |
| `POST` | `/api/v1/auth/reset-password` | Reset password using one-time token |

### Patients (`/api/v1/patients`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/patients` | List patients (search by `patientId`, `name`, `mobile`) |
| `POST` | `/api/v1/patients` | Register new patient |
| `GET` | `/api/v1/patients/:id` | Get patient profile and appointment history |
| `PATCH` | `/api/v1/patients/:id` | Update patient records |
| `DELETE` | `/api/v1/patients/:id` | Deactivate patient |

### Doctors & Departments (`/api/v1/doctors`, `/api/v1/departments`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/departments` | List all clinical departments |
| `POST` | `/api/v1/departments` | Create new department |
| `GET` | `/api/v1/doctors` | List doctors with filtering by department |
| `POST` | `/api/v1/doctors` | Register doctor profile with assigned department |
| `PATCH` | `/api/v1/doctors/:id` | Update doctor details or consultation duration |

### Scheduling & Slots (`/api/v1/doctorschedules`, `/api/v1/slots`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/doctorschedules/:doctorId` | View doctor's weekly working schedule |
| `PUT` | `/api/v1/doctorschedules/:doctorId` | Configure sessions, breaks, and slot duration |
| `POST` | `/api/v1/slots/generate` | Auto-generate daily slots from active schedule |
| `GET` | `/api/v1/slots` | Fetch available and booked slots for a doctor & date |

### Appointments (`/api/v1/appointments`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/appointments` | List, filter, and paginate appointments |
| `POST` | `/api/v1/appointments` | Book appointment with atomic slot reservation |
| `GET` | `/api/v1/appointments/:id` | Retrieve appointment details |
| `PATCH` | `/api/v1/appointments/:id` | Reschedule or edit appointment notes |
| `POST` | `/api/v1/appointments/:id/arrive` | Mark patient as arrived |
| `POST` | `/api/v1/appointments/:id/complete`| Complete appointment with consultation notes |
| `DELETE` | `/api/v1/appointments/:id` | Cancel appointment and free the slot |

---

## 6. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | `5000` | Port for Express API server |
| `NODE_ENV` | Yes | `development` | Runtime environment (`development` / `production`) |
| `MONGO_URI` | Yes | `mongodb://127.0.0.1:27017/saas_boilerplate` | MongoDB connection URL |
| `CORS_ORIGIN` | Yes | `http://localhost:3000` | Allowed client origin |
| `APP_URL` | Yes | `http://localhost:3000` | Base URL for password reset links |
| `COOKIE_NAME` | Yes | `sid` | Session cookie identifier |
| `COOKIE_SECRET` | Yes | — | Secret string used to sign session cookies |
| `COOKIE_SECURE` | Yes | `false` | Set to `true` for HTTPS in production |
| `COOKIE_SAMESITE`| Yes | `lax` | Cookie SameSite policy (`lax`, `strict`, `none`) |
| `SMTP_HOST` | No | `127.0.0.1` | SMTP hostname for notifications |
| `SMTP_PORT` | No | `1025` | SMTP port |
| `SUPERADMIN_EMAIL` | Yes | `admin@example.com` | Initial Super Admin email for seed script |
| `SUPERADMIN_PASSWORD` | Yes | `ChangeMeNow!23` | Initial Super Admin password for seed script |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | No | `MediSlot` | Application title displayed in UI |
| `NEXT_PUBLIC_API_URL` | No | `""` (proxied) | External API base URL (empty uses Next.js proxy) |

---

## 7. Installation Instructions

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **MongoDB**: v7.0 or higher (or Docker)

### Step 1: Clone and Configure Environment Files
```bash
# Clone the repository
git clone <repository-url>
cd MediSlot

# Create backend .env
copy backend\.env.example backend\.env

# Create frontend .env.local
copy frontend\.env.example frontend\.env.local
```

### Step 2: Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 3: Seed Database
```bash
# From the backend directory
cd ../backend
npm run seed
```
*Seeds default roles, granular permissions catalog, and initial Super Admin (`admin@example.com` / `ChangeMeNow!23`).*

---

## 8. Running the Project

### Option A: Using Docker for Database & Mail Services (Recommended)
```bash
# Start MongoDB and MailHog from root
docker compose up mongo mailhog -d
```
- MongoDB: `localhost:27017`
- MailHog Web UI: `http://localhost:8025`

### Option B: Starting the Application Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
*API running on `http://localhost:5000` (Health check: `http://localhost:5000/health` | Swagger UI: `http://localhost:5000/api-docs`)*

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
*Web application accessible at `http://localhost:3000`*

### Running Tests
```bash
# Backend unit & integration tests
cd backend
npm test

# Frontend unit & component tests
cd frontend
npm test
```

---

## 9. Assumptions Made

1. **Deployment Architecture**: Frontend and backend share an identical primary domain or utilize a server-side reverse proxy/rewrite to ensure cookies operate first-party without cross-site blocking.
2. **Timezone Handling**: Doctor schedules and slot intervals default to the clinic's local server timezone unless explicitly formatted in UTC ISO strings.
3. **Pre-Generated Slots**: Bookable slots are generated ahead of time via schedule templates rather than calculated dynamically per request, ensuring quick slot availability queries.
4. **Single-Tenant Scope**: System operates on a single clinic or multi-department healthcare facility model with centralized patient and doctor directories.

---

## 10. Known Limitations

1. **Distributed Sockets**: Socket.IO runs on a single in-memory Node process; multi-instance horizontal scaling requires a Redis adapter (`@socket.io/redis-adapter`).
2. **Recurring Slot Generation**: Slot generation is triggered per date/range; automated recurring generation requires an external cron or worker daemon.
3. **Telehealth / Video Consultations**: In-person appointment workflows are currently supported; integrated WebRTC video calling is not included out of the box.
4. **Billing & Payments**: Invoicing and payment gateway integrations (Stripe, Razorpay) are not included in the core flow.

---

## 11. Future Improvements

### 1. Dedicated Model Context Protocol (MCP) Server
- **MediSlot MCP Integration**: Expose a secure, standardized MCP server enabling LLMs and AI desktop tools to interact directly with MediSlot.
- **Tools & Resources Exposed**:
  - `get_doctor_availability(doctorId, date)`: Query live open slots.
  - `book_appointment_tool(patientId, doctorId, slotId, reason)`: Reserve slots directly via AI conversations.
  - `fetch_patient_history(patientId)`: Retrieve sanitized clinical notes.

### 2. Autonomous AI Clinical & Analytics Agent
- **Data Ingestion & Tracking**: Continuous monitoring of appointment show rates, peak clinic hours, cancellations, and doctor utilization rates.
- **Automated Report Generation**: Generation of daily/weekly clinical performance summaries, department workload analyses, and revenue projections.
- **Intelligent Consultation Summarizer**: AI-assisted transcription of doctor consultation notes into structured patient records and discharge instructions.

### 3. Distributed Architecture & Notifications
- **Redis State & Caching**: Redis-backed cache for available slots and Redis pub/sub adapter for clustered Socket.IO instances.
- **Omnichannel Alerts**: Automated SMS and WhatsApp appointment reminders and booking confirmations (Twilio / Meta Graph API).
- **Payment & Telehealth Gateway**: Integration with Stripe for upfront consultation fee deposits and WebRTC for direct virtual appointments.
