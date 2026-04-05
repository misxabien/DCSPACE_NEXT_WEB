# Admin Backend Plan

> Latest update
>
> - Frame 405:334 Feedback Overview is complete for the current backend scope.
> - The current confirmed admin backend screen list is fully scaffolded.
> - The next step is dependency wiring and verification inside the real project.

This plan is based on the current repository state and the latest confirmed admin backend scope.

## Current Progress

These backend pieces already exist:

- middleware.ts
- lib/admin/auth/authOptions.ts
- lib/admin/auth/roleGuard.ts
- app/api/admin/auth/register/route.ts
- app/api/admin/auth/login/route.ts
- app/api/admin/auth/google/route.ts
- app/api/admin/dashboard/route.ts
- app/api/admin/notifications/route.ts
- app/api/admin/users/route.ts
- app/api/admin/users/[id]/route.ts
- lib/admin/db/dashboard.ts
- lib/admin/db/notifications.ts
- lib/admin/db/users.ts
- README-ADMIN.md

## Gap Summary

The current scaffold is a partial admin backend. It does not yet match the latest required file tree.

Still missing:

- `app/api/admin/events/route.ts`
- `app/api/admin/events/[id]/route.ts`
- `app/api/admin/certificates/route.ts`
- `app/api/admin/certificates/[id]/route.ts`
- `app/api/admin/feedback/route.ts`
- `lib/admin/db/events.ts`
- `lib/admin/db/certificates.ts`
- `lib/admin/db/feedback.ts`

Still needing revision:

- `app/api/admin/dashboard/route.ts`
- `lib/admin/db/dashboard.ts`
- `app/api/admin/users/route.ts`
- `app/api/admin/users/[id]/route.ts`
- `lib/admin/db/users.ts`

## Recommended Next Step

The next step is to make a baseline commit for the current admin backend foundation before adding new screen-specific endpoints.

Recommended commit scope:

- admin auth foundation
- middleware and role guard
- dashboard scaffold
- notifications scaffold
- users scaffold
- `README-ADMIN.md`

Recommended commit message:

```text
chore(admin-backend): add initial admin backend foundation
```

After that baseline commit, continue screen by screen in the order below.

## Screen-by-Screen Plan

### Frame `8:52` - Login

Status:

- completed for the current backend scope

What exists now:

- `lib/admin/auth/authOptions.ts`
- `lib/admin/auth/roleGuard.ts`

What was completed:

- added POST /api/admin/auth
- added credential authentication helper logic
- added Google SSO metadata response for the login screen
- aligned login handling with JWT and session claim payloads

Files touched:

- `lib/admin/auth/authOptions.ts`

Recommended commit message:

```text
feat(admin-auth): add login API route for frame 8:52
```

### Frame `25:37` — Dashboard / Analytics

Status:

- partially covered, response shape mismatch

What exists now:

- `app/api/admin/dashboard/route.ts`
- `lib/admin/db/dashboard.ts`

What is still needed:

- simplify the dashboard response to match the latest brief
- return:
  - `totalEvents`
  - `totalAttendees`
  - `charts`
- remove or defer certificate queue and upcoming events from this route if they are no longer part of the latest confirmed screen

Files to touch:

- `app/api/admin/dashboard/route.ts`
- `lib/admin/db/dashboard.ts`
- `README-ADMIN.md`

Recommended commit message:

```text
refactor(admin-dashboard): align analytics API with frame 25:37
```

### Frame `264:426` — Event Management List

Status:

- not started

What is needed:

- create `GET /api/admin/events`
- support:
  - `status`
  - `search`
  - `filter`
  - pagination if needed
- return event cards with:
  - title
  - date/time
  - venue
  - representative or organizer
  - pubmat image

Files to create:

- `app/api/admin/events/route.ts`
- `lib/admin/db/events.ts`

Recommended commit message:

```text
feat(admin-events): add event list API for frame 264:426
```

### Frame `268:884` — Event Management Pending Detail

Status:

- not started

What is needed:

- create `GET /api/admin/events/[id]`
- include full pending-event detail payload
- create `PATCH /api/admin/events/[id]` actions for:
  - approve
  - reject
  - request changes
  - post admin comment
- include attachment metadata in the response

Files to touch:

- `app/api/admin/events/[id]/route.ts`
- `lib/admin/db/events.ts`

Recommended commit message:

```text
feat(admin-events): add pending event detail and moderation actions for frame 268:884
```

### Frame `274:569` — Event Management Approved Detail

Status:

- not started, but should reuse the same event detail backend

What is needed:

- make `GET /api/admin/events/[id]` return approved-event detail too
- ensure approved events still expose comments and attachments
- guard `PATCH` so invalid moderation actions are rejected once the event is already approved

Files to touch:

- `app/api/admin/events/[id]/route.ts`
- `lib/admin/db/events.ts`

Recommended commit message:

```text
refactor(admin-events): support approved event detail for frame 274:569
```

### Frame `81:342` — Notifications

Status:

- mostly covered

What exists now:

- `app/api/admin/notifications/route.ts`
- `lib/admin/db/notifications.ts`

What is still needed:

- confirm response keys exactly match latest frontend usage
- make sure event and report records contain fields for the `View` action target
- adjust feed ordering/pagination if needed

Files to touch:

- `app/api/admin/notifications/route.ts`
- `lib/admin/db/notifications.ts`

Recommended commit message:

```text
refactor(admin-notifications): align notification feed with frame 81:342
```

### Frame `101:161` — Users Management Table

Status:

- partially covered

What exists now:

- `app/api/admin/users/route.ts`
- `lib/admin/db/users.ts`

What is still needed:

- add pagination support:
  - `page`
  - `limit`
- return metadata for:
  - total entries
  - current range
  - has previous/next
- align the user table payload with:
  - RFID
  - registration status
  - timestamp

Files to touch:

- `app/api/admin/users/route.ts`
- `lib/admin/db/users.ts`

Recommended commit message:

```text
refactor(admin-users): add paginated table response for frame 101:161
```

### Frame `131:473` — Users Management Actions Dropdown

Status:

- partially covered

What exists now:

- `PATCH /api/admin/users/[id]`
- `DELETE /api/admin/users/[id]`

What is still needed:

- add `assignToEvent()` support
- expose explicit action handling for:
  - edit user
  - reset password
  - assign to event
  - toggle active/inactive
  - delete user

Files to touch:

- `app/api/admin/users/[id]/route.ts`
- `lib/admin/db/users.ts`

Recommended commit message:

```text
feat(admin-users): add assign-to-event action for frame 131:473
```

### Frame `277:714` — E-Certificate & Attendance

Status:

- completed for the current backend scope

What is needed:

- create `GET /api/admin/certificates`
- require `eventId`
- return:
  - event summary
  - attendee list
  - attendance status
  - certificate status
- create `PATCH /api/admin/certificates/[id]` for attendee toggle

Files to create:

- `app/api/admin/certificates/route.ts`
- `app/api/admin/certificates/[id]/route.ts`
- `lib/admin/db/certificates.ts`

Recommended commit message:

```text
feat(admin-certificates): add attendance and certificate APIs for frame 277:714
```

### Frame `405:334` — Feedback Overview

Status:

- completed for the current backend scope

What is needed:

- create `GET /api/admin/feedback`
- return:
  - event rating stats
  - system ease of use stats
  - feedback table list

Files to create:

- `app/api/admin/feedback/route.ts`
- `lib/admin/db/feedback.ts`

Recommended commit message:

```text
feat(admin-feedback): add feedback overview API for frame 405:334
```

## Recommended Commit Order

1. Baseline foundation commit
2. Frame `8:52` login route
3. Frame `25:37` dashboard analytics alignment
4. Frame `264:426` event list
5. Frame `268:884` pending event detail and moderation
6. Frame `274:569` approved event detail refinement
7. Frame `81:342` notifications alignment
8. Frame `101:161` paginated users table
9. Frame `131:473` users dropdown actions completion
10. Frame `277:714` certificates and attendance
11. Frame `405:334` feedback overview

## What Should Be Committed Right Now

If the goal is to commit before moving to the next screen, commit the current state as:

- backend admin foundation
- partial dashboard
- partial notifications
- partial users
- auth/session guard groundwork

Then start the next implementation commit with frame `8:52`.
