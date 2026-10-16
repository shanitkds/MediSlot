# Database

MongoDB via Mongoose. Soft delete uses `deletedAt` on User and Role. Token collections use TTL indexes.

## Collections

- User — email unique while not deleted; `roleIds`; status; lockout fields
- Role — unique slug while not deleted; `permissionIds`; `isSystem`; `isSuperAdmin`
- Permission — unique `name` (`module.action`)
- Session — unique `tokenHash`; TTL on `expiresAt`
- Notification — `userId` + read state
- AuditLog — immutable; actor snapshot
- PasswordResetToken / EmailVerificationToken — hashed token + TTL
- Settings — singleton `key=app`

Use references for User↔Role↔Permission. Embed snapshots only on audit/notification payloads.
