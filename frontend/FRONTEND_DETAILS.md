# MediSlot Frontend — Master Architecture, Reusable Components & Execution Log

> **MANDATORY AGENT & DEVELOPER INSTRUCTION**
>
> ⚠️ **CRITICAL: READ BEFORE ANY MODIFICATION**
> 1. **Always read this file first** before adding pages, building components, creating hooks, modifying styles, or changing routes in `frontend/`.
> 2. **Check for existing reusable primitives first**: Never create duplicate buttons, inputs, modals, tables, or hooks. Consult [Section 7 (Reusable Custom Hooks)](#7-reusable-custom-hooks-catalog) and [Section 8 (Master Component Catalog)](#8-master-component-catalog--reusability-guide) before writing UI code.
> 3. **Never call `fetch` directly in UI components**: Always define or extend a service in `frontend/services/` that delegates through `lib/api/apiClient.js`.
> 4. **Document every change**: Whenever you plan, execute, or complete any frontend task or modification (no matter how small), immediately record the update in the [Live Work Log & Change Tracker](#11-live-work-log--change-tracker) section below.
> 5. Keep this document synchronized with actual code and route structures.

---

## 1. Project Overview

| Attribute | Details |
| :--- | :--- |
| **Project Name** | MediSlot Frontend |
| **Architecture** | Next.js 15 App Router (`app/` directory) |
| **Language** | JavaScript (ESModules, React 19) |
| **Styling** | Tailwind CSS 3.4.17 with CSS Custom Variables (Design Tokens) |
| **Theme Support** | Light & Dark Mode via `class` strategy (`.dark`) |
| **Typography** | Inter (`--font-sans`) and Sora (`--font-display`) via `next/font/google` |
| **Default Port** | `3000` |
| **API Base URL** | Dev rewrite proxy: `/api/:path*` &rarr; `http://localhost:5000/api/:path*` (or env `NEXT_PUBLIC_API_URL`) |
| **Authentication** | Stateful Session Cookie (`sid`) sent via `credentials: "include"` |
| **Authorization** | Granular RBAC permissions with `<Can>`, `<PermissionGate>`, and `can()` |
| **Charting Library**| Recharts 2.15.1 |
| **Testing** | Jest 29.7, React Testing Library 16.2, Playwright 1.50.1 |

---

## 2. Directory & Architecture Map

```
frontend/
├── .env.example             # Example environment variables
├── .eslintrc.json           # ESLint configuration (next/core-web-vitals)
├── jsconfig.json            # Path alias configuration (@/* -> ./*)
├── jest.config.js           # Jest unit test configuration
├── jest.setup.js            # Testing library custom matchers setup
├── playwright.config.js     # Playwright E2E configuration
├── postcss.config.js        # PostCSS configuration for Tailwind
├── tailwind.config.js       # Design tokens, color palette, custom shadows & fonts
├── package.json             # NPM dependencies & scripts
├── middleware.js            # Edge route protection & cookie redirection
├── FRONTEND_DETAILS.md      # [THIS FILE] Master reference & live change log
├── app/                     # Next.js 15 App Router directory
│   ├── globals.css          # Tailwind directives, CSS variables (light/dark colors)
│   ├── layout.js            # Root layout (Google Fonts, ToastProvider, AuthProvider)
│   ├── loading.js           # Global loading spinner
│   ├── error.js             # Global client error boundary
│   ├── not-found.js         # Global 404 page
│   ├── (public)/            # Unauthenticated public landing pages
│   │   └── page.js          # Marketing landing page (Hero, Features, Pricing, etc.)
│   ├── (auth)/              # Authentication flow pages
│   │   ├── layout.js        # Auth shell layout (centered card, logo, branding)
│   │   ├── login/page.js    # Login form with email/password & redirection
│   │   ├── signup/page.js   # User registration form
│   │   ├── forgot-password/page.js # Password reset request page
│   │   ├── reset-password/page.js  # Password reset form with token
│   │   └── verify-email/page.js    # Email verification confirmation page
│   └── (app)/               # Authenticated application & administration pages
│       ├── layout.js        # Auth gate + AppShell (Sidebar, Header, Drawer)
│       ├── loading.js       # App layout loading placeholder
│       ├── dashboard/page.js# Analytics, metrics, charts & recent activity
│       ├── users/           # User administration
│       │   ├── page.js      # Users table, search, filters & pagination
│       │   ├── new/page.js  # Create user form
│       │   └── [id]/        # User detail & edit
│       │       ├── page.js  # User profile & active sessions list
│       │       └── edit/page.js # Edit user metadata & role
│       ├── roles/           # Role & permissions administration
│       │   ├── page.js      # Roles listing
│       │   ├── new/page.js  # Create new custom role
│       │   └── [id]/page.js # Role editor with PermissionMatrix
│       ├── notifications/page.js # Notifications list & mark-all-read
│       ├── audit-logs/page.js    # System audit trails viewer
│       ├── forbidden/page.js     # 403 Forbidden fallback screen
│       └── settings/        # System & user settings
│           ├── layout.js    # Settings tab layout
│           ├── profile/page.js    # User profile settings
│           ├── security/page.js   # Change password & session revoke
│           ├── application/page.js# Tenant/System settings
│           └── permissions/page.js# System permissions list
├── components/              # Reusable React components
│   ├── ui/                  # 26 Design System UI primitives (Buttons, Inputs, Modals, Tables, etc.)
│   ├── layout/              # Layout shell, Navigation, Sidebar, Header, Breadcrumbs, Gates
│   ├── dashboard/           # Dashboard home cards and charts
│   ├── users/               # Users table, User form, User detail views
│   ├── roles/               # Role form, Permission matrix checklist
│   ├── notifications/       # Notification item list
├── contexts/                # React Context Providers
│   ├── AuthProvider.js      # Session resolution, user state, permission checker (`can()`)
│   └── ToastProvider.js     # Global toast notification stack (`toast.success()`, `toast.error()`)
├── hooks/                   # Custom React hooks
│   ├── useAuth.js           # Convenience export of `useAuth()`
│   ├── usePermission.js     # Boolean permission checking hook
│   ├── useDebouncedSearch.js# Search input debounce state hook
│   └── usePagination.js     # Page and limit state hook
├── services/                # API Client services (Pure functions calling apiClient)
│   ├── authService.js       # Auth, login, logout, verification, password resets
│   ├── userService.js       # User CRUD, activate, deactivate, password resets
│   ├── roleService.js       # Role CRUD & permission assignments
│   ├── permissionService.js # Permission catalogue listing
│   ├── profileService.js    # Current user profile retrieval & update
│   ├── sessionService.js    # Active session listing & revocation
│   ├── settingsService.js   # System settings get & update
│   ├── notificationService.js# Notifications list & read state
│   ├── auditService.js      # Audit log querying
│   └── dashboardService.js  # Dashboard metrics, today's and upcoming appointments
├── lib/                     # Utilities & foundation libraries
│   ├── api/
│   │   ├── apiClient.js     # Centralized fetch wrapper with 401 redirect & 500 retry
│   │   └── errors.js        # ApiClientError class & error mapping
│   ├── auth/
│   │   └── session.js       # Client cookie detection (`hasSessionCookie()`)
│   ├── permissions/
│   │   └── can.js           # Permission check pure functions
│   └── utils.js             # clsx `cn()`, `formatDate()`, `initials()`
├── config/                  # Static application configurations
│   ├── env.js               # Runtime environment variables (`apiUrl`, `appName`)
│   └── nav.js               # Sidebar navigation items & settings tabs with permissions
└── constants/               # System enums & routes
    ├── permissions.js       # Permission string constants
    └── routes.js            # Route path constants & path lists
```

---

## 3. Environment Variables Reference

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Optional | `""` (Empty) | External backend URL. In local development, leave empty to use Next.js `/api` rewrite proxy to `http://localhost:5000`. |
| `NEXT_PUBLIC_APP_NAME`| Optional | `"MediSlot"` | Application brand name displayed in header, sidebar, and page titles. |

Configuration is accessed exclusively through [config/env.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/config/env.js):
```javascript
import { apiUrl, appName } from "@/config/env";
```

---

## 4. Routing & Middleware Architecture

### 4.1 Route Groups Overview

The App Router is partitioned into 3 logical route groups:

1. **`(public)`**: Marketing and static content (e.g., `/` landing page). Does not require authentication.
2. **`(auth)`**: Sign-in and recovery flows (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`). Wraps pages in a unified card layout with branding.
3. **`(app)`**: Protected application dashboard and administration (`/dashboard`, `/users`, `/roles`, etc.). Wraps pages in `AppShell` with sidebar, top navbar, and user state checks.

### 4.2 Application Route Map & Access Control

| Route Path | Route Group | Description | Required Permission / Condition |
| :--- | :--- | :--- | :--- |
| `/` | `(public)` | Landing page & feature showcase | Public |
| `/login` | `(auth)` | User login | Unauthenticated (Redirects to `/dashboard` if logged in) |
| `/signup` | `(auth)` | User registration | Unauthenticated |
| `/forgot-password`| `(auth)` | Password reset request | Unauthenticated |
| `/reset-password` | `(auth)` | Password reset form | Unauthenticated (`?token=...`) |
| `/verify-email` | `(auth)` | Verify email address | Public / Unauthenticated (`?token=...`) |
| `/dashboard` | `(app)` | Main analytics & metrics dashboard | Authenticated |
| `/users` | `(app)` | User management list | `users.view` |
| `/users/new` | `(app)` | Create new user account | `users.create` |
| `/users/[id]` | `(app)` | User details & active sessions | `users.view` |
| `/users/[id]/edit` | `(app)` | Edit user profile & role | `users.update` |
| `/roles` | `(app)` | Role list & permissions | `roles.view` |
| `/roles/new` | `(app)` | Create new custom role | `roles.create` |
| `/roles/[id]` | `(app)` | Edit role & permission matrix | `roles.update` |
| `/notifications` | `(app)` | User notifications list | Authenticated |
| `/audit-logs` | `(app)` | Audit trail table | `audit.view` |
| `/settings/profile` | `(app)` | User profile settings | Authenticated |
| `/settings/security`| `(app)` | Password change & session revoke| Authenticated |
| `/settings/application` | `(app)`| Tenant settings | `settings.view` |
| `/settings/permissions` | `(app)`| System permissions list | `permissions.view` |
| `/forbidden` | `(app)` | 403 Access Denied fallback | Authenticated |

### 4.3 Edge Middleware (`middleware.js`)

Located at [frontend/middleware.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/middleware.js):
- **Guest Protection**: If an authenticated session (`sid` cookie) exists and user accesses `/login`, `/signup`, `/forgot-password`, or `/reset-password`, automatically redirects to `/dashboard`.
- **Auth Protection**: If no `sid` cookie is present and user accesses any route starting with `APP_PREFIXES` (`/dashboard`, `/users`, `/roles`, etc.), redirects to `/login?next=<currentPath>`.

---

## 5. Authentication, State & Permissions System

### 5.1 Auth Context (`AuthProvider.js`)

Located at [frontend/contexts/AuthProvider.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/contexts/AuthProvider.js).

Wraps the entire application in `app/layout.js`. Provides the following reactive context:

```javascript
import { useAuth } from "@/contexts/AuthProvider"; // or from "@/hooks/useAuth"

const {
  user,        // Current user object { id, name, email, status, role, permissions: [] }
  loading,     // Boolean: true while fetching initial session via GET /auth/me
  permissions, // Array of permission strings granted to current user
  refresh,     // Async function: re-fetches current user profile from /auth/me
  setUser,     // Function: directly update user state in context
  can,         // Function: (permissionString) => boolean
  logout,      // Async function: calls authService.logout() and redirects to /login
} = useAuth();
```

### 5.2 Permission Checking Patterns

There are 3 standard ways to enforce permissions on the frontend:

#### Pattern 1: Page-Level Gate (`<PermissionGate>`)
Wraps entire pages. If permission is missing, renders 403 Forbidden screen.
```javascript
import { PermissionGate } from "@/components/layout/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";

export default function UsersPage() {
  return (
    <PermissionGate permission={PERMISSIONS.USERS_VIEW}>
      <UsersTable />
    </PermissionGate>
  );
}
```

#### Pattern 2: Conditional Inline UI (`<Can>`)
Hides or shows specific buttons/sections based on permissions.
```javascript
import { Can } from "@/components/ui/Can";
import { PERMISSIONS } from "@/constants/permissions";

<Can permission={PERMISSIONS.USERS_CREATE}>
  <Button onClick={() => setModalOpen(true)}>Create User</Button>
</Can>
```

#### Pattern 3: Hook-Based Conditional Logic (`usePermission` or `can()`)
```javascript
import { usePermission } from "@/hooks/usePermission";
import { PERMISSIONS } from "@/constants/permissions";

const canEdit = usePermission(PERMISSIONS.USERS_UPDATE);
```

---

## 6. API Client & Services Layer

### 6.1 Unified Fetch Client (`apiClient.js`)

Located at [frontend/lib/api/apiClient.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/lib/api/apiClient.js):
- Automatically prefixes endpoints with `/api/v1`.
- Sets `credentials: "include"` (sends HTTP-only `sid` session cookie).
- Sets `Content-Type: application/json` and `X-Requested-With: XMLHttpRequest`.
- Automatically redirects to `/login?next=...` on HTTP `401 Unauthorized`.
- Automatically retries idempotent `GET` requests once on HTTP `500+` server errors.
- Throws structured `ApiClientError` on non-2xx responses.

### 6.2 Service Catalog Reference

> **RULE**: Never call `apiClient` or `fetch` directly inside React components or pages. Always call methods from `services/`.

| Service File | Methods Available | Description |
| :--- | :--- | :--- |
| **`authService`** | `signup(body)`<br>`login(body)`<br>`refresh()`<br>`logout()`<br>`me()`<br>`resendVerification(data)`<br>`forgotPassword(data)`<br>`resetPassword(body)`<br>`changePassword(body)` | Authentication, registration, token refresh, password recovery, verification. |
| **`userService`** | `createDoctor(body)`<br>`createReceptionist(body)`<br>`list(params)`<br>`get(id)`<br>`update(id, body)`<br>`updateStatus(id, data)`<br>`remove(id)` | User management, doctor/receptionist creation, status update, deletion. |
| **`departmentService`** | `create(body)`<br>`list(params)`<br>`get(id)`<br>`update(id, body)`<br>`remove(id)` | Department CRUD operations. |
| **`doctorService`** | `create(body)`<br>`list(params)`<br>`get(id)`<br>`update(id, body)`<br>`updateSpecialization(id, body)`<br>`updateDepartment(id, body)`<br>`remove(id)` | Doctor profile, specialization, department linking, deactivation. |
| **`doctorScheduleService`** | `create(body)`<br>`list(params)`<br>`getByDoctor(doctorId)`<br>`update(body)`<br>`updateByDoctor(doctorId, body)` | Doctor working days, sessions, slot timing configuration. |
| **`patientService`** | `create(body)`<br>`list(params)`<br>`get(id)`<br>`update(id, body)`<br>`remove(id)` | Patient record CRUD operations. |
| **`profileService`** | `get()`<br>`update(body)` | Current logged-in user profile view/edit. |
| **`slotService`** | `generate(body)`<br>`regenerate(body)`<br>`list(params)`<br>`get(id)`<br>`update(id, body)` | Slot generation, regeneration, lookup, and status update. |
| **`auditService`** | `list(params)` | System audit trails query. |

---

## 7. Reusable Custom Hooks Catalog

### 7.1 `useAuth`
- **Location**: [frontend/hooks/useAuth.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/hooks/useAuth.js)
- **Usage**: Accesses the global authentication session.
```javascript
import { useAuth } from "@/hooks/useAuth";
const { user, can, logout } = useAuth();
```

### 7.2 `usePermission`
- **Location**: [frontend/hooks/usePermission.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/hooks/usePermission.js)
- **Signature**: `usePermission(permissionString: string) => boolean`
```javascript
import { usePermission } from "@/hooks/usePermission";
const canDelete = usePermission("users.delete");
```

### 7.3 `useDebouncedSearch`
- **Location**: [frontend/hooks/useDebouncedSearch.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/hooks/useDebouncedSearch.js)
- **Signature**: `useDebouncedSearch(initial = "", delay = 300) => { value, setValue, debounced }`
- **Usage**: Binds immediately to text input while debouncing API calls.
```javascript
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

const { value, setValue, debounced } = useDebouncedSearch("", 350);

useEffect(() => {
  userService.list({ search: debounced });
}, [debounced]);

<Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search..." />
```

### 7.4 `usePagination`
- **Location**: [frontend/hooks/usePagination.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/hooks/usePagination.js)
- **Signature**: `usePagination(initial = { page: 1, limit: 20 }) => { page, setPage, limit, setLimit }`
```javascript
import { usePagination } from "@/hooks/usePagination";

const { page, setPage, limit, setLimit } = usePagination({ page: 1, limit: 10 });
```

### 7.5 `useToast`
- **Location**: [frontend/contexts/ToastProvider.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/contexts/ToastProvider.js)
- **Signature**: `useToast() => { toast, success, error }`
```javascript
import { useToast } from "@/contexts/ToastProvider";

const toast = useToast();
toast.success("User created successfully");
toast.error("Failed to delete record");
```

---

## 8. Master Component Catalog & Reusability Guide

All primitives in `components/ui/` are built with accessible HTML, Tailwind CSS tokens, and support dark mode.

### 8.1 UI Primitives (`components/ui/`)

#### 1. `Button`
- **Path**: [components/ui/Button.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Button.js)
- **Props**: `variant` (`"primary" | "secondary" | "outline" | "ghost" | "danger"`), `size` (`"sm" | "md" | "lg"`), `loading` (`boolean`), `disabled`, `type`.
```javascript
import { Button } from "@/components/ui/Button";

<Button variant="primary" size="md" loading={isSubmitting} onClick={handleSubmit}>
  Save Changes
</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="danger" size="md">Delete</Button>
```

#### 2. `Input`
- **Path**: [components/ui/Input.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Input.js)
- **Props**: `label`, `error` (error message string), `id`, standard input props (`type`, `value`, `onChange`, `placeholder`).
```javascript
import { Input } from "@/components/ui/Input";

<Input
  label="Email Address"
  type="email"
  value={email}
  error={errors.email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="user@example.com"
/>
```

#### 3. `Select`
- **Path**: [components/ui/Select.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Select.js)
- **Props**: `label`, `error`, `children` (`<option>` tags), standard select props.
```javascript
import { Select } from "@/components/ui/Select";

<Select label="Role" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
  <option value="">Select a role</option>
  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
</Select>
```

#### 4. `Textarea`
- **Path**: [components/ui/Textarea.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Textarea.js)
- **Props**: `label`, `error`, standard textarea props.

#### 5. `Checkbox` & `Radio`
- **Path**: [components/ui/Checkbox.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Checkbox.js) & [components/ui/Radio.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Radio.js)
- **Props**: `label`, `checked`, `onChange`, `disabled`.

#### 6. `Table`
- **Path**: [components/ui/Table.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Table.js)
- **Props**:
  - `columns`: Array of `{ key, label, render?: (row) => JSX }`
  - `rows`: Array of data objects (each must have an `.id`)
  - `empty`: JSX or string when rows array is empty.
```javascript
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

<Table
  columns={[
    { key: "name", label: "Full Name" },
    { key: "email", label: "Email" },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge variant={row.status === "active" ? "success" : "warning"}>{row.status}</Badge>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => <Button size="sm" onClick={() => edit(row.id)}>Edit</Button>,
    },
  ]}
  rows={users}
  empty="No users found"
/>
```

#### 7. `Pagination`
- **Path**: [components/ui/Pagination.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Pagination.js)
- **Props**: `page`, `totalPages`, `onPageChange: (newPage) => void`.
```javascript
import { Pagination } from "@/components/ui/Pagination";

<Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
```

#### 8. `Modal` & `ConfirmationDialog`
- **Paths**: [components/ui/Modal.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Modal.js) & [components/ui/ConfirmationDialog.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/ConfirmationDialog.js)
- **ConfirmationDialog Props**: `open`, `title`, `description`, `confirmLabel`, `onConfirm`, `onClose`, `loading`.
```javascript
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

<ConfirmationDialog
  open={Boolean(pendingDeleteId)}
  title="Delete User"
  description="Are you sure you want to permanently delete this user?"
  confirmLabel="Delete"
  loading={isDeleting}
  onConfirm={handleDelete}
  onClose={() => setPendingDeleteId(null)}
/>
```

#### 9. `Card`
- **Path**: [components/ui/Card.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Card.js)
- **Props**: `children`, `className`. Renders surface background, border, and rounded corners.

#### 10. `Badge`
- **Path**: [components/ui/Badge.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Badge.js)
- **Props**: `variant` (`"default" | "success" | "warning" | "danger"`), `children`.
```javascript
import { Badge } from "@/components/ui/Badge";

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Disabled</Badge>
```

#### 11. `Alert`
- **Path**: [components/ui/Alert.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Alert.js)
- **Props**: `variant` (`"info" | "danger" | "warning" | "success"`), `children`, `className`.

#### 12. `EmptyState`
- **Path**: [components/ui/EmptyState.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/EmptyState.js)
- **Props**: `title`, `description`, `action` (optional JSX button).

#### 13. `Dropdown` & `DropdownItem`
- **Path**: [components/ui/Dropdown.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Dropdown.js)
```javascript
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";

<Dropdown trigger={<Button variant="outline">Options</Button>}>
  <DropdownItem onClick={handleEdit}>Edit</DropdownItem>
  <DropdownItem onClick={handleDelete}>Delete</DropdownItem>
</Dropdown>
```

#### 14. `Drawer`
- **Path**: [components/ui/Drawer.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Drawer.js)
- **Props**: `open`, `onClose`, `children`. Slide-over panel for mobile navigation or side drawers.

#### 15. `Tabs`
- **Path**: [components/ui/Tabs.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Tabs.js)
- **Props**: `tabs` (Array of `{ label, value }`), `value`, `onChange: (value) => void`.

#### 16. `Accordion`
- **Path**: [components/ui/Accordion.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Accordion.js)
- **Props**: `items` (Array of `{ q: string, a: string }`).

#### 17. `Avatar` & `Tooltip`
- **Paths**: [components/ui/Avatar.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Avatar.js) & [components/ui/Tooltip.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Tooltip.js)

#### 18. `Spinner` & `Skeleton`
- **Paths**: [components/ui/Spinner.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Spinner.js) & [components/ui/Skeleton.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Skeleton.js)

#### 19. `Chart`
- **Path**: [components/ui/Chart.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Chart.js)
- **Props**: `data` (Array of objects), `xKey` (default `"name"`), `yKey` (default `"value"`). Responsive BarChart powered by Recharts.

#### 20. `Can`
- **Path**: [components/ui/Can.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/ui/Can.js)
- **Props**: `permission`, `children`, `fallback` (optional).

---

### 8.2 Layout Components (`components/layout/`)

| Component | File Path | Description |
| :--- | :--- | :--- |
| **`AppShell`** | [components/layout/AppShell.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/layout/AppShell.js) | Full layout container with desktop `Sidebar`, mobile `Drawer`, top `Header`, and main content. |
| **`Sidebar` / `SidebarNav`** | [components/layout/Sidebar.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/layout/Sidebar.js) | Desktop sidebar navigation that filters nav items dynamically via `can(item.permission)`. |
| **`Header`** | [components/layout/Header.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/layout/Header.js) | Top bar with mobile hamburger trigger, breadcrumbs, `ThemeToggle`, and user profile dropdown. |
| **`Breadcrumbs`** | [components/layout/Breadcrumbs.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/layout/Breadcrumbs.js) | Dynamic breadcrumb path display based on active pathname. |
| **`ThemeToggle`** | [components/layout/ThemeToggle.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/layout/ThemeToggle.js) | Dark/Light mode toggle button storing preference in `localStorage`. |
| **`PermissionGate`** | [components/layout/PermissionGate.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/layout/PermissionGate.js) | Page-level authorization wrapper displaying 403 Forbidden on missing permission. |
| **`DashboardSkeleton`** | [components/layout/DashboardSkeleton.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/layout/DashboardSkeleton.js) | Skeleton loading placeholder while initial session resolves. |
| **`Navbar` & `Footer`** | [components/layout/Navbar.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/components/layout/Navbar.js) | Public marketing navigation header and footer. |

---

## 9. Design System, Theming & Styling Tokens

Tailwind CSS is configured in [tailwind.config.js](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/tailwind.config.js) with dynamic CSS variables defined in [app/globals.css](file:///c:/Users/hp/Desktop/online%20tasck/MediSlot/frontend/app/globals.css):

### 9.1 Color Tokens

| Semantic Token | Tailwind Class | Light Theme | Dark Theme (`.dark`) |
| :--- | :--- | :--- | :--- |
| Background | `bg-bg` | `#f8fafc` (slate-50) | `#0f172a` (slate-900) |
| Surface / Card | `bg-surface` | `#ffffff` (white) | `#1e293b` (slate-800) |
| Border | `border-border` | `#e2e8f0` (slate-200) | `#334155` (slate-700) |
| Primary Text | `text-text` | `#0f172a` (slate-900) | `#f1f5f9` (slate-100) |
| Muted Text | `text-muted` | `#64748b` (slate-500) | `#94a3b8` (slate-400) |
| Primary Brand | `bg-primary`, `text-primary` | `#4f46e5` (indigo-600) | `#818cf8` (indigo-400) |
| Danger | `bg-danger`, `text-danger` | `#dc2626` (red-600) | `#f87171` (red-400) |
| Warning | `bg-warning`, `text-warning` | `#d97706` (amber-600) | `#fbbf24` (amber-400) |
| Success | `bg-success`, `text-success` | `#059669` (emerald-600) | `#34d153` (emerald-400) |

### 9.2 Utility Functions (`lib/utils.js`)

```javascript
import { cn, formatDate, initials } from "@/lib/utils";

// 1. Combine conditional classnames
className={cn("px-4 py-2", isActive && "bg-primary text-white")}

// 2. Format ISO timestamps cleanly
formatDate(user.createdAt) // "10/15/2026, 3:10:00 PM" or "—"

// 3. Extract two-letter uppercase avatar initials
initials(user.name) // "John Doe" -> "JD"
```

---

## 10. Developer Guide: How to Implement New Features

When building a new module or page (e.g., Appointments, Doctors, Departments):

### Step 1: Define API Service
In `frontend/services/<module>Service.js`:
```javascript
import { apiClient } from "@/lib/api/apiClient";

export const doctorService = {
  list: (params) => apiClient(`/doctors${qs(params)}`),
  get: (id) => apiClient(`/doctors/${id}`),
  create: (body) => apiClient("/doctors", { method: "POST", body }),
  update: (id, body) => apiClient(`/doctors/${id}`, { method: "PATCH", body }),
  remove: (id) => apiClient(`/doctors/${id}`, { method: "DELETE" }),
};
```

### Step 2: Register Constants & Navigation
1. Add route constants in `frontend/constants/routes.js`:
   ```javascript
   export const ROUTES = {
     // ...
     doctors: "/doctors",
   };
   ```
2. Add permissions in `frontend/constants/permissions.js`:
   ```javascript
   export const PERMISSIONS = {
     // ...
     DOCTORS_VIEW: "doctors.view",
   };
   ```
3. Add navigation item in `frontend/config/nav.js`:
   ```javascript
   { href: ROUTES.doctors, label: "Doctors", permission: PERMISSIONS.DOCTORS_VIEW }
   ```

### Step 3: Build the UI with Existing Primitives
In `frontend/app/(app)/doctors/page.js`:
- Wrap the page with `<PermissionGate permission={PERMISSIONS.DOCTORS_VIEW}>`.
- Use `useDebouncedSearch` for filtering.
- Use `usePagination` for pagination.
- Use `useToast` for user feedback.
- Render results inside `<Card>`, `<Table>`, `<Badge>`, and `<Pagination>`.
- Use `<ConfirmationDialog>` for deletion.

### Step 4: Record in the Work Log
Immediately add an entry in [Section 11 (Live Work Log & Change Tracker)](#11-live-work-log--change-tracker) below!

---

## 11. Live Work Log & Change Tracker

Every modification to `frontend/` must be recorded here immediately upon planning, modifying, or completing tasks.

| Timestamp (UTC/IST) | Task / Change Description | Files Touched / Created | Author / Agent | Status |
| :--- | :--- | :--- | :--- | :--- |
| 2026-10-15 15:15 IST | Created `FRONTEND_DETAILS.md` master architecture reference, component catalog, reusable hooks guide, and work log tracker. | `frontend/FRONTEND_DETAILS.md`, `AGENTS.md` | Antigravity AI | Completed |
| 2026-10-15 19:52 IST | Removed boilerplate marketing components (`Benefits`, `CTA`, `FAQ`, `Features`, `Hero`, `HowItWorks`, `Overview`, `Pricing`, `Testimonials`). | `frontend/components/marketing/` | Antigravity AI | Completed |
| 2026-10-15 19:56 IST | Removed the entire `components/` directory as requested, replacing imports in `loading.js`, `error.js`, `not-found.js`, and `ToastProvider.js` with native elements. | `frontend/components/`, `app/loading.js`, `app/error.js`, `app/not-found.js`, `contexts/ToastProvider.js` | Antigravity AI | Completed |
| 2026-10-15 20:13 IST | Reset `frontend/app` route structure: removed `(app)` & `(public)` route groups, created clean placeholder routes across `(auth)` (7 routes including `change-password`) and `(dashboard)` (31 files across `users`, `departments`, `doctors`, `patients`, `schedules`, `slots`, `profile`, `settings/security`, `audit-logs`, and `forbidden`). | `frontend/app/(auth)/*`, `frontend/app/(dashboard)/*`, `frontend/app/(app)` (deleted), `frontend/app/(public)` (deleted) | Antigravity AI | Completed |
| 2026-10-15 21:35 IST | Created comprehensive suite of common composite components (`DataTable`, `SearchInput`, `SearchFilter`, `Pagination`, `SortButton`, `DatePicker`, `DateRangePicker`, `FormField`, `FormError`, `PageHeader`, `PageContainer`, `StatusBadge`, `ConfirmDialog`, `LoadingState`, `ErrorState`, `index.js`). | `frontend/components/common/*` | Antigravity AI | Completed |
| 2026-10-15 21:44 IST | Replaced legacy services with 8 core module services (Auth, User, Department, Doctor, Doctor Schedule, Patient, Profile, Slot, Audit Logs), integrated `@tanstack/react-query` with `QueryProvider`, and created complete queries/mutations hook suite in `frontend/hooks/queries/*`. | `frontend/services/*`, `frontend/providers/QueryProvider.js`, `frontend/hooks/queries/*`, `frontend/app/layout.js`, `frontend/package.json` | Antigravity AI | Completed |
| 2026-10-15 21:52 IST | Created layout components (`AppShell`, `Sidebar`, `Navbar`, `Header`, `Breadcrumbs`, `MobileSidebar`, `UserMenu`, `NotificationBell`, `PermissionGate`) and role-tailored dashboard suite (`SuperAdminDashboard`, `ReceptionistDashboard`, `DoctorDashboard`, `StatCard`, `DashboardChart`, `RecentActivity`) using `react-icons`, API queries, and toast notifications. Integrated into `(dashboard)/layout.js` and `(dashboard)/dashboard/page.js`. | `frontend/components/layout/*`, `frontend/components/dashboard/*`, `frontend/app/(dashboard)/layout.js`, `frontend/app/(dashboard)/dashboard/page.js` | Antigravity AI | Completed |
| 2026-10-15 22:01 IST | Created complete suite of 14 clinical medical domain components (`PatientSearch`, `PatientSelect`, `DoctorSelect`, `DepartmentSelect`, `DoctorCard`, `PatientCard`, `DoctorScheduleCalendar`, `SlotCalendar`, `SlotSelector`, `AppointmentStatusBadge`, `AppointmentSummary`, `WorkingDaysSelector`, `SessionTimePicker`, `BreakTimeEditor`, `index.js`) integrated with React Query hooks, `react-icons`, and toast alerts. | `frontend/components/medical/*` | Antigravity AI | Completed |
| 2026-10-15 22:08 IST | Created authentication forms (`LoginForm`, `SignupForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `ChangePasswordForm`, `index.js`) and authorization components (`PermissionGate`, `AccessDenied`, `index.js`). Wired all auth forms into `app/(auth)/*` pages and `AccessDenied` into `app/(dashboard)/forbidden/page.js`. | `frontend/components/auth/*`, `frontend/components/permissions/*`, `frontend/app/(auth)/*`, `frontend/app/(dashboard)/forbidden/page.js` | Antigravity AI | Completed |
| 2026-10-15 22:21 IST | Connected complete authentication flow (login, logout, and deduplicated token refresh with request retry on 401 Unauthorized in `apiClient.js` and `AuthProvider.js`). Integrated role-based dashboard views (`SuperAdminDashboard`, `ReceptionistDashboard`, `DoctorDashboard`) with authenticated role detection in `(dashboard)/dashboard/page.js` and expanded edge middleware protection across all hospital routes. | `frontend/lib/api/apiClient.js`, `frontend/contexts/AuthProvider.js`, `frontend/constants/routes.js`, `frontend/middleware.js`, `frontend/app/(dashboard)/dashboard/page.js`, `frontend/components/dashboard/*` | Antigravity AI | Completed |
| 2026-10-15 22:32 IST | Replaced all raw SVG elements across the entire created components tree (18 files across `components/ui/*` and `components/common/*`) with standard `react-icons` (`react-icons/fi`). Verified 0 raw SVGs remain with 100% clean linter (`npm run lint`) and passing tests (`npm test`). | `frontend/components/ui/*`, `frontend/components/common/*` | Antigravity AI | Completed |
| 2026-10-15 22:38 IST | Configured root URL (`http://localhost:3000/`) to serve the MediSlot `LoginForm` directly via `frontend/app/page.js` with `Suspense` wrapper and updated `middleware.js` to redirect logged-in users visiting `/` to `/dashboard`. | `frontend/app/page.js`, `frontend/app/(auth)/login/page.js`, `frontend/middleware.js` | Antigravity AI | Completed |
| 2026-10-15 22:52 IST | Added `dashboardService` connecting to backend `/api/v1/dashboard` endpoints (`/summary`, `/appointments/today`, `/appointments/upcoming`), exported from `frontend/services/index.js`, and created `useDashboardQuery` TanStack Query hook suite in `frontend/hooks/queries/*`. | `frontend/services/dashboardService.js`, `frontend/services/index.js`, `frontend/hooks/queries/useDashboardQuery.js`, `frontend/hooks/queries/index.js` | Antigravity AI | Completed |
| 2026-10-15 23:04 IST | Implemented dashboard route protection and role-based redirection: added `ROUTE_ACCESS_RULES`, `ROLE_DEFAULT_ROUTES`, `canAccessRoute`, and `normalizeRole` in `constants/routes.js`; updated `constants/permissions.js` with full clinical system permissions; enhanced `AuthProvider.js` to normalize roles, protect dashboard routes with redirect to `/forbidden`, and auto-redirect authenticated users to role-specific default routes; guarded `AppShell.js` with auth resolution loading and in-place `AccessDenied` rendering; updated `LoginForm.js` to redirect users based on their role and validate target route access; enhanced `ForbiddenPage` to parse blocked routes; and applied `PermissionGate` wrappers on `users`, `audit-logs`, and `doctors` pages. | `frontend/constants/routes.js`, `frontend/constants/permissions.js`, `frontend/contexts/AuthProvider.js`, `frontend/components/layout/AppShell.js`, `frontend/components/auth/LoginForm.js`, `frontend/app/(dashboard)/forbidden/page.js`, `frontend/app/(dashboard)/users/page.js`, `frontend/app/(dashboard)/audit-logs/page.js`, `frontend/app/(dashboard)/doctors/page.js`, `frontend/components/layout/Sidebar.js`, `frontend/components/layout/MobileSidebar.js`, `frontend/components/layout/UserMenu.js`, `frontend/app/(dashboard)/dashboard/page.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-15 23:25 IST | Created comprehensive UI components suite for `audit-logs` (`AuditStats`, `AuditLogDetailModal`, `AuditLogFilters`, `AuditLogsTable`, `index.js`) and `departments` (`DepartmentStats`, `DepartmentForm`, `DepartmentFormModal`, `DepartmentDeleteDialog`, `DepartmentFilters`, `DepartmentTable`, `DepartmentDetailView`, `index.js`). Wired full TanStack Query API integrations (`useAuditLogs`, `useDepartments`, `useDepartment`, `useCreateDepartment`, `useUpdateDepartment`, `useDeleteDepartment`, `useDoctors`) across `app/(dashboard)/audit-logs/page.js` and `app/(dashboard)/departments/*` (`page.js`, `new/page.js`, `[id]/page.js`, `[id]/edit/page.js`). Fixed `DepartmentSelect.js` fallback for paginated response items. | `frontend/components/audit/*`, `frontend/components/departments/*`, `frontend/app/(dashboard)/audit-logs/page.js`, `frontend/app/(dashboard)/departments/page.js`, `frontend/app/(dashboard)/departments/new/page.js`, `frontend/app/(dashboard)/departments/[id]/page.js`, `frontend/app/(dashboard)/departments/[id]/edit/page.js`, `frontend/components/medical/DepartmentSelect.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-15 23:42 IST | Decoupled and componentized all department and audit-log page files: extracted page views into dedicated components (`EditDepartmentView`, `CreateDepartmentView`, `DepartmentsView`, `DepartmentDetailView`, `AuditLogsView`) inside `frontend/components/departments/` and `frontend/components/audit/`. Updated all route `page.js` files (`departments/page.js`, `departments/new/page.js`, `departments/[id]/page.js`, `departments/[id]/edit/page.js`, `audit-logs/page.js`) to cleanly delegate directly to their respective components without inline logic. Verified 100% clean linter (`npm run lint`) and passing unit tests (`npm test`). | `frontend/components/departments/*`, `frontend/components/audit/*`, `frontend/app/(dashboard)/departments/*`, `frontend/app/(dashboard)/audit-logs/page.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-15 23:55 IST | Componentized and integrated real backend APIs into all remaining clinical and admin sections across 7 domains (`doctors`, `patients`, `profile`, `schedules`, `settings`, `slots`, `users`): created complete component suites (`DoctorsView`, `DoctorDetailView`, `CreateDoctorView`, `EditDoctorView`, `DoctorScheduleSubView`, `PatientsView`, `PatientDetailView`, `CreatePatientView`, `EditPatientView`, `ProfileView`, `SchedulesView`, `ConfigureScheduleView`, `SecuritySettingsView`, `SlotsView`, `GenerateSlotsView`, `SlotDetailView`, `UsersView`, `UserDetailView`, `CreateDoctorUserView`, `CreateReceptionistUserView`, `EditUserView`); cleanly wired all 18 route `page.js` files (`doctors/*`, `patients/*`, `profile/*`, `schedules/*`, `settings/security/*`, `slots/*`, `users/*`) to delegate directly to their respective components; integrated TanStack Query hooks (`useDoctors`, `useDoctor`, `usePatients`, `usePatient`, `useProfile`, `useDoctorSchedule`, `useDoctorSchedules`, `useSlots`, `useSlot`, `useUsers`, `useUser`); verified 100% clean linter (`npm run lint`) and 16/16 passing unit test suites (`npm test`). | `frontend/components/doctors/*`, `frontend/components/patients/*`, `frontend/components/profile/*`, `frontend/components/schedules/*`, `frontend/components/settings/*`, `frontend/components/slots/*`, `frontend/components/users/*`, `frontend/app/(dashboard)/*`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 00:06 IST | Added `suppressHydrationWarning` to `<html>` and `<body>` tags in `app/layout.js` to silence Next.js/React hydration mismatch errors caused by browser extensions (e.g., Scribe recorder injecting `data-scribe-recorder-ready`). | `frontend/app/layout.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 00:12 IST | Fixed root and unauthenticated login redirection: updated `frontend/app/page.js` to redirect directly to `/login`, updated `middleware.js` to redirect `/` to `/login` without looping on stale auth cookies, and added client-side redirect fallback in `AppShell.js`. | `frontend/app/page.js`, `frontend/middleware.js`, `frontend/components/layout/AppShell.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 08:20 IST | Implemented responsive New Doctor page at `/users/new-doctor`: strictly aligned form fields with backend `createDoctorSchema` (`name`, `email`, `password`, `departmentId`, `specialization`, `consultationDuration`), integrated API via `POST /api/v1/doctors` with `useCreateDoctorProfile`, loaded departments using reusable `DepartmentSelect`, implemented client/server validation, loading state, show/hide password toggle, toast & alert notifications, and restricted access exclusively to Super Admin via `<PermissionGate roles={["super_admin"]}>` and `AccessDenied`. | `frontend/components/users/CreateDoctorUserView.js`, `frontend/app/(dashboard)/users/new-doctor/page.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 08:25 IST | Reused identical New Doctor component across `/doctors/new`: refactored `CreateDoctorView` to wrap `CreateDoctorUserView` with contextual redirection (`redirectPath="/doctors"`, `backLabel="Back to Doctors"`), added SEO metadata to `app/(dashboard)/doctors/new/page.js`, ensuring identical validation, loading state, and Super Admin authorization at both routes. | `frontend/components/doctors/CreateDoctorView.js`, `frontend/app/(dashboard)/doctors/new/page.js`, `frontend/components/users/CreateDoctorUserView.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 08:35 IST | Implemented clean, responsive Appointment Booking page at `/appointments/new`: built `BookAppointmentView` component and wired to `app/(dashboard)/appointments/new/page.js`; supported patient search by name, ID, and mobile number (`GET /api/v1/patients`); supported inline new patient registration with instant selection (`POST /api/v1/patients`); department and physician selection with auto-linking (`GET /api/v1/doctors`); date picker with quick presets; real-time available time slots grid grouped by Morning/Afternoon/Evening with booked slot disabled guards (`GET /api/v1/slots`); appointment purpose with quick chips and clinical notes; live booking overview with validation checklist; atomic slot booking integration (`POST /api/v1/appointments`); printable booking confirmation slip; role-based gating with `appointments.create` permission (`super_admin`, `admin`, `receptionist`); added `/appointments` to `ROUTES`, `APP_PREFIXES`, `ROUTE_ACCESS_RULES` and sidebar navigation; verified 100% clean linter (`npm run lint`) and passing unit tests (`npm test`). | `frontend/components/appointments/BookAppointmentView.js`, `frontend/components/appointments/index.js`, `frontend/app/(dashboard)/appointments/new/page.js`, `frontend/constants/routes.js`, `frontend/components/layout/Sidebar.js`, `frontend/components/medical/PatientSearch.js`, `frontend/components/medical/PatientSelect.js`, `frontend/components/medical/DoctorSelect.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 08:40 IST | Configured desktop sidebar as static and pinned without moving during scrolling: updated `Sidebar.js` with `sticky top-0 h-screen shrink-0 z-20`, and updated `AppShell.js` with `h-screen overflow-hidden` so page content scrolls within the main viewport while the sidebar remains fixed in place without moving. Verified clean linter (`npm run lint`) and passing unit tests (`npm test`). | `frontend/components/layout/Sidebar.js`, `frontend/components/layout/AppShell.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 09:05 IST | Eliminated all mock and fallback data across all user role dashboards (`SuperAdminDashboard`, `ReceptionistDashboard`, `DoctorDashboard`, `DashboardChart`, `RecentActivity`): removed hardcoded fallback counts (18, 12, 6, 142, 64, 8, 24); purged `sampleQueue` and `sampleFallbackAppointments` dummy patient records; removed fake weekly chart dataset (`defaultSampleData`); wired real API queries (`useDashboardSummary`, `useTodayAppointments`, `useUpcomingAppointments`, `useAuditLogs`); added live tabbed views ("Today's Queue" and "Upcoming Appointments") for Receptionist and Doctor dashboards; supported doctor selection when Super Admin inspects Doctor station; added clean, elegant zero-data and empty states; verified 0 lint warnings (`npm run lint`) and 100% passing unit tests (`npm test`). | `frontend/components/dashboard/SuperAdminDashboard.js`, `frontend/components/dashboard/ReceptionistDashboard.js`, `frontend/components/dashboard/DoctorDashboard.js`, `frontend/components/dashboard/DashboardChart.js`, `frontend/components/dashboard/RecentActivity.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 09:12 IST | Fixed React console error "A component is changing an uncontrolled input to be controlled": aligned `ConfigureScheduleView.js` initial state from `{ start, end }` to clinical schema `{ startTime, endTime }`; added defensive string fallbacks (`sess.startTime ?? sess.start ?? ""` and `sess.endTime ?? sess.end ?? ""`) in `SessionTimePicker.js` and `BreakTimeEditor.js` ensuring input values are never `undefined`; normalized existing schedule sessions/breaks mapping in `useEffect`; added safe fallback to `slotDurationMinutes`; verified 0 ESLint warnings (`npm run lint`) and 16/16 passing unit tests (`npm test`). | `frontend/components/medical/SessionTimePicker.js`, `frontend/components/medical/BreakTimeEditor.js`, `frontend/components/schedules/ConfigureScheduleView.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 09:30 IST | Resolved `400 Bad Request` on `/api/v1/doctorschedule`: hardened `doctorScheduleService.update` to automatically append `/:doctorId` in URL when present; guarded `getByDoctor` against invalid/undefined/falsy IDs; added robust client-side validation in `ConfigureScheduleView` verifying `startTime < endTime` on all sessions and breaks, preventing overlapping sessions and overlapping breaks, ensuring HH:mm time formatting, stripping UI-only keys, and seamlessly falling back from `createMutation` to `updateMutation` when existing schedule triggers a 409 Conflict. Verified 0 lint errors (`npm run lint`) and 100% passing unit tests (`npm test`). | `frontend/services/doctorScheduleService.js`, `frontend/hooks/queries/useDoctorScheduleQuery.js`, `frontend/components/schedules/ConfigureScheduleView.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 09:48 IST | Fixed doctor list, detail, and schedule sub-view pages: resolved doctor practitioner name (`userId.name`) and email (`userId.email`) display in `DoctorsView.js`, `DoctorDetailView.js`, and `DoctorScheduleSubView.js`; added inline Reactivate action for disabled doctors in table; enhanced `ConfirmDialog` to support permanent delete (`?permanent=true`) when doctor has zero appointments; added status toggle, reactivate, and permanent delete controls to `DoctorDetailView.js`; added day name formatter (`Mon, Tue...`) for schedule working days; updated `doctorScheduleService.getByDoctor` and `DoctorScheduleSubView.js` to gracefully handle unconfigured schedules with informative banner and direct configuration link rather than crashing on 404; fixed contextual redirection in `ConfigureScheduleView.js`. | `frontend/components/doctors/DoctorsView.js`, `frontend/components/doctors/DoctorDetailView.js`, `frontend/components/doctors/DoctorScheduleSubView.js`, `frontend/components/ui/ConfirmDialog.js`, `frontend/services/doctorService.js`, `frontend/services/doctorScheduleService.js`, `frontend/hooks/queries/useDoctorQuery.js`, `frontend/components/schedules/ConfigureScheduleView.js`, `frontend/components/users/CreateDoctorUserView.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 10:42 IST | Aligned slot generation and display strictly with doctor working sessions and breaks: revamped `GenerateSlotsView.js` to inspect doctor schedule, show clinical sessions and break deduction rules, detect and disable generation on doctor off-days with quick-jump to next working day, and preview generated slots with avoided breaks; fixed timezone rendering bug by standardizing UTC slot time formatting (`timeZone: "UTC"`) and UTC hour period grouping (`getUTCHours()`) across `SlotSelector.js`, `BookAppointmentView.js`, `SlotsView.js`, `AppointmentSummary.js`, and `formatDate` in `utils.js` ensuring 09:00 AM sessions display precisely at 09:00 AM; added `Generate Slots` action to `DoctorScheduleSubView.js`; wrapped `slots/generate/page.js` in `<Suspense>`. Verified 100% passing tests (`npm test`). | `frontend/components/slots/GenerateSlotsView.js`, `frontend/app/(dashboard)/slots/generate/page.js`, `frontend/components/medical/SlotSelector.js`, `frontend/components/appointments/BookAppointmentView.js`, `frontend/components/slots/SlotsView.js`, `frontend/components/medical/AppointmentSummary.js`, `frontend/components/doctors/DoctorScheduleSubView.js`, `frontend/lib/utils.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 11:15 IST | Implemented Appointment Listing and Details section: created `AppointmentsView.js` (`/appointments`) featuring responsive `DataTable` with patient info, MRN, doctor, department, formatted UTC slot times, purpose, status badges, role-tailored filters (search, status tabs, date picker, doctor select, sorting), inline quick actions (Arrive, Complete with notes, Cancel with confirmation); created `AppointmentDetailView.js` (`/appointments/[id]`) with breadcrumbs, patient chart card, schedule info, visual clinical status stepper (`Booked` -> `Arrived` -> `Completed` / `Cancelled`), doctor consultation notes editor with direct `PATCH` saving, and status transitions (`POST /:id/arrive`, `POST /:id/complete` with notes, `DELETE /:id` with confirmation); added `/appointments` to `Sidebar.js` navigation and `config/nav.js`; updated `StatusBadge.js` to map `arrived: "primary"`; updated `PatientDetailView.js` to link directly to `/appointments/[id]`. | `frontend/components/appointments/AppointmentsView.js`, `frontend/components/appointments/AppointmentDetailView.js`, `frontend/components/appointments/index.js`, `frontend/app/(dashboard)/appointments/page.js`, `frontend/app/(dashboard)/appointments/[id]/page.js`, `frontend/components/common/StatusBadge.js`, `frontend/components/layout/Sidebar.js`, `frontend/config/nav.js`, `frontend/components/patients/PatientDetailView.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 11:28 IST | Removed redundant "Book Appointment" item from desktop and mobile sidebar navigation (`Sidebar.js`), keeping the primary navigation focused on `/appointments` (where appointment booking is launched directly via header action). | `frontend/components/layout/Sidebar.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 11:32 IST | Configured `/appointments` to default to today's date: initialized `selectedDate` with `getTodayDateString()` so the date input shows today's date and displays today's appointments by default on entry; added "Today" and "All Dates" quick filter pills alongside an inline "View All" toggle button to easily view all appointments without restriction; enhanced `DataTable` empty states with direct "View All Dates" and "Book New Appointment" actions. | `frontend/components/appointments/AppointmentsView.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 11:58 IST | Implemented reusable Socket.IO connection and real-time appointment updates: created `frontend/lib/socket.js` singleton client manager with automatic credentials/handshake auth, auto-reconnection, and cleanup on logout; created `frontend/hooks/useAppointmentSocket.js` hook listening for 5 lifecycle events (`appointment:created`, `appointment:updated`, `appointment:cancelled`, `appointment:arrived`, `appointment:completed`) with automatic TanStack Query cache invalidation (`appointmentKeys.all`, `dashboardKeys.all`, `slotKeys.all`) and strict listener deduplication; wired hook into `AppointmentsView.js` (`/appointments`) and `DashboardPage` (`/dashboard`); added unit tests in `frontend/lib/socket.test.js` passing 100%. | `frontend/lib/socket.js`, `frontend/hooks/useAppointmentSocket.js`, `frontend/contexts/AuthProvider.js`, `frontend/components/appointments/AppointmentsView.js`, `frontend/app/(dashboard)/dashboard/page.js`, `frontend/lib/socket.test.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 12:25 IST | Filtered strictly future slots based on current time and enabled real-time rebooking of cancelled slots: updated `BookAppointmentView.js` (`/appointments/new`) to request `onlyFuture: true` from backend, locally filter slots so that only slots where `new Date(slot.startAt) > new Date()` are displayed in morning/afternoon/evening sessions; added friendly empty state with quick-jump to tomorrow if today's earlier slots have all passed; wired `useAppointmentSocket()` into `BookAppointmentView.js` and `SlotsView.js` so that when any appointment is cancelled, the slot is immediately released and re-rendered in real-time as "Open" without requiring page refreshes; updated `SlotSelector.js` to detect past slots (`new Date(slot.startAt) <= new Date()`), label them as "Past", and disable interaction. Verified 0 lint errors (`npm run lint`) and 100% passing frontend tests (`npm test`). | `frontend/components/appointments/BookAppointmentView.js`, `frontend/components/slots/SlotsView.js`, `frontend/components/medical/SlotSelector.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |
| 2026-10-16 12:26 IST | Added visible "Cancel" action button positioned before "Complete" consultation button across `/appointments` table (`AppointmentsView.js`) and `/appointments/[id]` detail view (`AppointmentDetailView.js`): rendered for appointments before complete status is set (`status === 'scheduled' || status === 'arrived'`); displays clear text label with `<FiXCircle>` icon; opens confirmation dialog with instant appointment status update to `cancelled` and slot release; supports Super Admins, Receptionists, and Doctors for their assigned appointments; verified 0 ESLint warnings (`npm run lint`) and 100% passing unit tests (`npm test`). | `frontend/components/appointments/AppointmentsView.js`, `frontend/components/appointments/AppointmentDetailView.js`, `frontend/FRONTEND_DETAILS.md` | Antigravity AI | Completed |












