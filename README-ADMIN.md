# DC Space Admin Backend

> Update 2026-04-05
>
> - Added app/api/admin/events/[id]/route.ts for frame 268:884 Event Management Pending Detail.
> - Pending events now support GET detail and PATCH moderation actions: approve, reject, requestChanges, and comment.
> - The next unimplemented screen is frame 274:569 Event Management Approved Detail.

This workspace contains the admin-side backend scaffold for the DC Space Web UI.

The implementation is based on the provided Figma-backed JSON brief and covers only the admin backend layer. No frontend pages, UI components, or styling are included here.

## Scope

The backend currently supports the admin flows tied to these screens:

- Login
- Dashboard
- Notifications
- Users Management

The scaffold was built with these rules:

- Every admin API route calls `requireAdmin()` before running business logic
- API routes stay thin
- Database logic lives under `lib/admin/db/`
- Exported functions in the DB/auth layer include JSDoc
- Backend only, no UI

## Tech Assumptions

The requested stack was followed conceptually:

- Next.js App Router
- TypeScript
- NextAuth.js
- Prisma

Because this workspace started empty, the code is a scaffold and not a fully runnable app by itself yet. There is no full Next.js project config, no Prisma schema, and no installed dependencies in this folder.

## File Structure

```text
middleware.ts
app/api/admin/dashboard/route.ts
app/api/admin/notifications/route.ts
app/api/admin/users/route.ts
app/api/admin/users/[id]/route.ts
lib/admin/auth/authOptions.ts
lib/admin/auth/roleGuard.ts
lib/admin/db/dashboard.ts
lib/admin/db/notifications.ts
lib/admin/db/users.ts
```

## File Responsibilities

### `middleware.ts`

Protects `/admin/*` routes.

- Redirects unauthenticated users to `/login`
- Returns `403` when the authenticated user is not an admin

### `lib/admin/auth/authOptions.ts`

Contains the NextAuth configuration scaffold.

- Supports email/password login
- Supports Google login
- Restricts Google sign-in to the allowed school domain
- Attaches `role`, `organization`, and `isActive` to JWT/session

Notes:

- Default Google domain is `sdca.edu.ph`
- This can be changed with `ALLOWED_GOOGLE_DOMAIN`

### `lib/admin/auth/roleGuard.ts`

Exports `requireAdmin()`.

- Resolves the current server session
- Throws when no session exists
- Throws when the user role is not `admin`

All admin API routes must call this first.

### `lib/admin/db/dashboard.ts`

Contains dashboard data queries:

- `getDashboardStats()`
- `getCertificateQueue()`
- `getUpcomingEvents()`

These functions map database results into the response shape expected by the Dashboard screen:

- total events done
- pending approvals
- total attendees
- certificates issued
- certificate queue
- upcoming events

### `lib/admin/db/notifications.ts`

Contains notification feed logic:

- `getNotifications()`

This merges event-related and report-related items into one admin feed.

### `lib/admin/db/users.ts`

Contains users management logic:

- `getUsers()`
- `createUser()`
- `updateUser()`
- `deleteUser()`
- `toggleUserStatus()`
- `resetUserPassword()`

This file supports the Users Management screen actions:

- search
- role/status/organization filters
- add user
- edit user
- toggle active/inactive
- reset password
- delete user

## API Endpoints

### `GET /api/admin/dashboard`

Returns:

- stat cards
- certificate generation queue
- upcoming events

Response shape:

```json
{
  "totalEventsDone": 34,
  "totalEventsDoneNote": "+5 this week",
  "pendingApprovals": 10,
  "pendingApprovalsNote": "2 events from CCSC",
  "totalAttendees": 1456,
  "totalAttendeesNote": "Across 24 Events",
  "certificatesIssued": 967,
  "certificateQueue": [
    {
      "name": "Misxa Bien Germino",
      "event": "IT TALK",
      "attendancePercent": 89.67,
      "status": "Ready"
    }
  ],
  "upcomingEvents": [
    {
      "title": "Career Talk",
      "date": "April 13, 2026",
      "time": "9:00 AM - 5:00 PM",
      "school": "SCMCS",
      "participants": "BSIT",
      "venue": "DRA Hall"
    }
  ]
}
```

### `GET /api/admin/notifications`

Returns a merged notification feed:

```json
{
  "feed": [
    {
      "type": "event",
      "title": "Career Talk",
      "organizer": "Misxa Bien Germino",
      "organization": "Domini Xode",
      "school": "School of Communication Multimedia and Computer Studies"
    },
    {
      "type": "report",
      "reportType": "Attendance Error",
      "event": "IT Talk",
      "reporter": "Amira Rachel Marqueses",
      "organizer": "Misxa Bien Germino"
    }
  ]
}
```

### `GET /api/admin/users`

Supports query params:

- `search`
- `role`
- `status`
- `organization`

Used for listing/filtering users.

### `POST /api/admin/users`

Creates a user.

Expected body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "faculty",
  "organization": "CCSC",
  "studentId": "2026-0001",
  "isActive": true,
  "password": "ChangeMe123!"
}
```

### `PATCH /api/admin/users/[id]`

Supports three admin actions through the request body:

```json
{ "action": "edit" }
```

```json
{ "action": "toggle", "isActive": false }
```

```json
{ "action": "resetPassword" }
```

For `edit`, include any editable fields such as:

- `name`
- `email`
- `role`
- `organization`
- `studentId`
- `isActive`

### `DELETE /api/admin/users/[id]`

Deletes a user by id.

## Status Codes

The routes are designed to use these statuses:

- `200` success
- `201` created
- `400` bad request / validation issue
- `403` forbidden
- `404` not found
- `500` internal server error

## Important Implementation Notes

### 1. This is a scaffold, not a finished production backend

The workspace did not include:

- a Prisma schema
- a generated Prisma client setup beyond imports
- Next.js app config files
- environment configuration
- installed packages

Because of that, the logic is intentionally written as a strong starting point rather than a final deployed backend.

### 2. Prisma model access is schema-flexible

The DB modules try several common model names such as:

- `user`
- `users`
- `event`
- `events`
- `certificate`
- `certificates`

This was done so the scaffold can be adapted once the real Prisma schema is available.

When the real schema is added, teammates should replace the dynamic model lookup with direct Prisma model usage.

### 3. Password handling is scaffold-level

Password reset and credential login use Node `crypto` helpers.

Before production use, the team should decide whether to keep this approach or replace it with the project’s preferred authentication/password strategy.

### 4. Import paths are relative on purpose

The routes use relative imports instead of `@/` path aliases so they remain readable even before a project-level TypeScript path config exists.

## What Teammates Need To Do Next

To turn this into a working backend inside the real project, the next developer should:

1. Place these files into the real Next.js codebase if this folder is only a handoff workspace.
2. Add the real `package.json`, `tsconfig.json`, and Next.js config if they do not already exist.
3. Add the actual Prisma schema and generate the Prisma client.
4. Replace dynamic Prisma model lookup with the real model names.
5. Wire `authOptions` into the project’s actual NextAuth route setup.
6. Add real environment variables for Google auth and NextAuth secrets.
7. Verify the response shapes against the final frontend consumption.
8. Add validation, tests, and production-grade error handling.

## Suggested Environment Variables

These are likely needed once the real project is wired up:

- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ALLOWED_GOOGLE_DOMAIN`
- database connection variables used by Prisma

## Quick Summary

This backend scaffold gives the team:

- admin route protection
- session-based admin role guard
- dashboard data endpoints
- notifications endpoint
- users management endpoints
- separated DB-layer modules for future Prisma integration

It is ready to be integrated into the actual project structure and connected to the final Prisma schema.
