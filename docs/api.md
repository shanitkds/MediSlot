# API

Base: `/api/v1`

## Envelope

Success:

```json
{ "success": true, "message": "User created", "data": {} }
```

Lists include `data.items` and `data.pagination`.

Error:

```json
{ "success": false, "message": "Validation failed", "error": { "code": "VALIDATION_ERROR", "fields": {} } }
```

Codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `UNPROCESSABLE`, `RATE_LIMITED`, `MAINTENANCE`, `INTERNAL`.

## Modules

| Prefix | Auth | Notes |
|---|---|---|
| `/auth` | mixed | signup, login, logout, me, verify, reset |
| `/profile` | yes | current user |
| `/users` | permission | CRUD, activate, reset email |
| `/roles` | permission | CRUD + permission assignment |
| `/permissions` | `permissions.view` | catalog, read-only |
| `/notifications` | yes | own rows |
| `/settings` | permission | singleton |
| `/sessions` | yes | own sessions; admin via `/users/:id/sessions` |
| `/audit-logs` | `audit.view` | filters + pagination |

`GET /health` is unversioned and public.
