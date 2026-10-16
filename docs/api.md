# MediSlot REST API & Swagger Documentation

Base API Path: `/api/v1`

---

## Interactive Swagger & OpenAPI Documentation

MediSlot features complete interactive OpenAPI 3.0 documentation generated dynamically from modular Swagger definitions:

- **Swagger UI**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs) (Alias: [http://localhost:5000/api/docs](http://localhost:5000/api/docs))
- **OpenAPI 3.0 Spec JSON**: [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json)

### Authenticating in Swagger UI
All protected endpoints support two authentication schemes:
1. **Cookie Session (`cookieAuth`)**: Execute `POST /api/v1/auth/login` directly in Swagger UI with your credentials. The browser automatically retains the `sid` session cookie.
2. **Bearer Token (`bearerAuth`)**: Click the green **Authorize** button in Swagger UI and provide `Bearer <token>` to authenticate requests.

---

## Response Envelope Conventions

### Success Envelope
```json
{
  "success": true,
  "message": "User created",
  "data": {}
}
```
*Paginated list endpoints include `data.items` and `data.pagination` (`page`, `limit`, `total`, `totalPages`, `hasNext`, `hasPrev`).*

### Error Envelope
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {}
  }
}
```

Standard Error Codes:
- `VALIDATION_ERROR`: Joi schema validation failure (HTTP 400).
- `UNAUTHORIZED`: Missing or invalid session/token (HTTP 401).
- `FORBIDDEN`: Insufficient role or permission (HTTP 403).
- `NOT_FOUND`: Resource does not exist (HTTP 404).
- `CONFLICT`: Unique constraint or state conflict (HTTP 409).
- `UNPROCESSABLE`: Business rule violation (HTTP 422).
- `RATE_LIMITED`: Rate limit bucket exhausted (HTTP 429).
- `MAINTENANCE`: System maintenance mode enabled (HTTP 503).
- `INTERNAL`: Uncaught internal server exception (HTTP 500).

---

## System Modules & Swagger Definition Files

| Module Prefix | Auth / Permission | Swagger Definition File | Description |
|---|---|---|---|
| `/auth` | Public / Mixed | `backend/src/modules/auth/auth.swagger.js` | Login, logout, session verification, password recovery |
| `/users` | `users.*` | `backend/src/modules/users/user.swagger.js` | Staff & doctor user creation, status and role updates |
| `/profile` | Authenticated | `backend/src/modules/profile/profile.swagger.js` | Current logged-in user profile view & edit |
| `/doctors` | Mixed / `doctors.*` | `backend/src/modules/doctor/doctor.swagger.js` | Physician directory, department mappings, specializations |
| `/departments` | Public / `departments.*` | `backend/src/modules/department/department.swagger.js` | Clinical departments CRUD and active doctor safeguards |
| `/doctorschedules` | Authenticated / Doctor | `backend/src/modules/doctorschedule/doctorschedule.swagger.js` | Weekly working days, session intervals, break configurations |
| `/slots` | Authenticated / Doctor | `backend/src/modules/slot/slot.swagger.js` | Atomic slot generation, availability queries |
| `/appointments` | Authenticated / Role | `backend/src/modules/appointment/appointment.swagger.js` | Concurrency-safe booking, check-in, completion, cancellation |
| `/patients` | `patients.*` | `backend/src/modules/patient/patient.swagger.js` | Patient demographics, registration, medical history, search |
| `/dashboard` | Authenticated / Role | `backend/src/modules/dashboard/dashboard.swagger.js` | Role-tailored operational KPIs and today's schedule metrics |
| `/audit-logs` | `audit.view` | `backend/src/modules/audit/audit.swagger.js` | System event audit log querying with actor filtering |
| `/roles` | `roles.*` | — | System roles and permission assignments |
| `/permissions` | `permissions.view` | — | System permission catalog listing |
| `/settings` | `settings.*` | — | Singleton clinic operational configuration |
| `/sessions` | Authenticated | — | Active session inspection and remote termination |

### Public & Unversioned Endpoints
- `GET /health`: Public system health check with uptime and MongoDB status.
- `GET /api-docs`: Interactive Swagger UI.
- `GET /api-docs.json`: Raw OpenAPI 3.0 JSON specification.
