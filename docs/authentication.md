# Authentication

Selected design: **HTTP-only cookie + MongoDB session documents**.

Rejected: JWT in `localStorage`, stateless JWT-only (cannot revoke).

## Cookie

- Name: `sid` (configurable)
- Flags: `httpOnly`, `path=/`, `secure` in production, `sameSite=lax` when first-party
- Value: opaque random token. Only the SHA-256 hash is stored.

## Flows

- Signup creates `pending_verification` and emails a hashed token (24h).
- Verify sets `active`, creates a session, sets the cookie.
- Login checks lockout, password, and status, then creates a session.
- Logout deletes the current session and clears the cookie.
- Password change and reset delete all sessions for that user.
- Idle timeout uses `lastSeenAt` (`IDLE_TTL_HOURS`).

## CSRF

Mutating requests require:

- `X-Requested-With: XMLHttpRequest`
- `Origin` or `Referer` on the CORS allowlist

The frontend API client always sends the custom header and `credentials: "include"`.
