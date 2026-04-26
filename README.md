# DC Space Web UI

DC Space is an AI-assisted, RFID-based event tracking and e-certificate issuance system built for a school organization. The platform enables student organizations to propose events, track attendance through RFID scans, and issue digital certificates automatically.

This repository contains the full-stack Next.js application, split into two layers: a **user-facing frontend** for students and organizers, and an **admin backend API** for system administrators.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Admin API Reference](#admin-api-reference)
- [Authentication and Authorization](#authentication-and-authorization)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Scripts](#scripts)

---

## Architecture

The application follows a two-layer design. The **user side** handles event browsing, attendance views, certificate access, and event organization submissions. The **admin side** provides a protected API layer for dashboard analytics, user management, event moderation, attendance and certificate oversight, and feedback review.

Both layers share a single MongoDB database accessed through a singleton client to avoid connection pool exhaustion in serverless environments.

```
app/
  (main)/           User-facing pages (dashboard, events, attendance, etc.)
  login/             Shared login page
  api/
    auth/            NextAuth session handlers
    admin/           Protected admin API routes (16 endpoints)

lib/
  admin/
    ai/              Gemini AI integration for dashboard recommendations
    auth/            Session resolution, role guards, NextAuth configuration
    db/              MongoDB data access layer (users, events, feedback, etc.)
    errors.ts        Shared error response handler

middleware.ts        Route protection for admin pages and API endpoints
```

---

## Tech Stack

| Layer         | Technology                                      |
|---------------|--------------------------------------------------|
| Framework     | Next.js 15 with App Router and Turbopack         |
| Language      | TypeScript in strict mode                        |
| Database      | MongoDB Atlas via the official Node.js driver     |
| Authentication| NextAuth v4 with JWT strategy                    |
| Auth Providers| Email/password credentials and Google OAuth       |
| AI            | Google Gemini 2.0 Flash for dashboard insights    |
| Runtime       | Node.js 18+                                      |

---

## Project Structure

### User-Facing Pages

| Route              | Description                                    |
|--------------------|------------------------------------------------|
| `/dashboard`       | Student dashboard with saved events            |
| `/events`          | Browse and bookmark upcoming events            |
| `/attendance`      | View personal attendance records               |
| `/certificates`    | Access issued digital certificates             |
| `/organize`        | Submit event proposals to the organization     |
| `/my-profile`      | View and manage personal profile               |
| `/login`           | Shared login page for all roles                |

### Admin API Routes

All routes under `/api/admin/` are protected by middleware. Unauthenticated requests receive a `401` JSON response. Authenticated non-admin users receive `403`.

Auth routes (`/api/admin/auth/*`) are excluded from middleware protection to allow login and registration.

| Route                                     | Methods          | Purpose                                        |
|-------------------------------------------|------------------|-------------------------------------------------|
| `/api/admin/auth/login`                   | POST             | Email/password admin login                      |
| `/api/admin/auth/register`                | POST             | New user registration                           |
| `/api/admin/auth/google`                  | POST             | Google SSO pre-check and session setup           |
| `/api/admin/dashboard`                    | GET              | Analytics stats, charts, and AI recommendations |
| `/api/admin/users`                        | GET, POST        | List users with filters, create new user         |
| `/api/admin/users/[id]`                   | PATCH, DELETE     | Edit, toggle status, reset password, delete user |
| `/api/admin/events`                       | GET              | List events with status and search filters       |
| `/api/admin/events/[id]`                  | GET, PATCH        | Event detail, approve/reject/comment             |
| `/api/admin/certificates`                 | GET              | Attendance table for an event (query param)      |
| `/api/admin/certificates/[id]`            | PATCH            | Toggle attendee active status                    |
| `/api/admin/cert-attendance/[eventId]`    | GET              | Per-student attendance and certificate records   |
| `/api/admin/feedback`                     | GET              | Feedback summary stats and list                  |
| `/api/admin/feedback/[id]`                | GET, PATCH, POST  | Feedback detail, update status, trigger email    |
| `/api/admin/notifications`                | GET              | Event and report notification feed               |
| `/api/admin/ai/analytics`                 | POST             | Generate Gemini analytics from attendance data   |

### Library Modules

| File                          | Purpose                                                          |
|-------------------------------|------------------------------------------------------------------|
| `lib/admin/db/mongo.ts`      | Singleton MongoDB client shared across all database modules       |
| `lib/admin/db/users.ts`      | User CRUD, login, registration, password hashing, event assignment|
| `lib/admin/db/events.ts`     | Event listing, detail, status updates, admin comments             |
| `lib/admin/db/dashboard.ts`  | Analytics aggregation: stats, growth, course insights, facilities |
| `lib/admin/db/certificates.ts`| Attendance records, certificate status, attendee management      |
| `lib/admin/db/feedback.ts`   | Feedback listing, detail, status updates, email trigger           |
| `lib/admin/db/notifications.ts`| Merged event and report notification feed                       |
| `lib/admin/ai/gemini.ts`     | Gemini API integration with local heuristic fallback              |
| `lib/admin/auth/authOptions.ts`| NextAuth configuration, Google SSO, JWT callbacks               |
| `lib/admin/auth/roleGuard.ts`| `requireAdmin()` session guard for route handlers                 |
| `lib/admin/errors.ts`        | Shared error-to-JSON response mapping for all admin routes        |

---

## Authentication and Authorization

The system uses a two-layer authentication model.

**NextAuth JWT Sessions** handle login state. Users authenticate via email/password or Google OAuth. The JWT token carries the user's role, organization, and active status.

**Middleware** (`middleware.ts`) intercepts requests before they reach route handlers:

- Admin page routes (`/admin/*`) redirect unauthenticated users to `/login`.
- Admin API routes (`/api/admin/*`) return `401 Unauthorized` as JSON.
- Non-admin authenticated users receive `403 Forbidden`.
- Auth routes (`/api/admin/auth/*`) are excluded so login and registration work without a session.

**Route-level guards** provide defense in depth. Every admin route handler calls `requireAdmin()` from `roleGuard.ts`, which resolves the server session and verifies the admin role independently of the middleware.

### Google SSO Flow

1. Client calls `POST /api/admin/auth/google` with the user's email.
2. The route checks if the email belongs to the allowed domain.
3. If the user exists, is active, and has the admin role, a session payload is returned.
4. If the user is not registered, a redirect to `/register` is returned.
5. NextAuth's `signIn` callback performs the same check during the actual OAuth handshake.

---

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
MONGODB_URI=              # MongoDB Atlas connection string
MONGODB_DB_NAME=          # Database name (default: dcspace)
NEXTAUTH_URL=             # Application URL (http://localhost:3000 for local dev)
NEXTAUTH_SECRET=          # Random secret for JWT signing
GOOGLE_CLIENT_ID=         # Google OAuth client ID
GOOGLE_CLIENT_SECRET=     # Google OAuth client secret
ALLOWED_GOOGLE_DOMAIN=    # Allowed email domain for Google SSO (e.g. gmail.com)
GEMINI_API_KEY=           # Google Gemini API key (optional, enables AI recommendations)
```

The `GEMINI_API_KEY` is optional. When omitted, the dashboard AI recommendations fall back to local heuristic analysis derived from the attendance data.

A `.env.example` file is included in the repository as a reference template.

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A MongoDB Atlas cluster (or local MongoDB instance)
- A Google Cloud project with OAuth credentials (for Google SSO)

### Installation

```bash
git clone https://github.com/misxabien/DCSPACE_NEXT_WEB.git
cd DCSPACE_NEXT_WEB
npm install
```

### Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Ensure your MongoDB Atlas cluster has your current IP address in the Network Access allowlist.

### Development

```bash
npm run dev
```

The application starts at `http://localhost:3000` with Turbopack enabled for fast refresh.

### Production Build

```bash
npm run build
npm start
```

---

## Scripts

| Command         | Description                              |
|-----------------|------------------------------------------|
| `npm run dev`   | Start development server with Turbopack  |
| `npm run build` | Create optimized production build        |
| `npm start`     | Start production server                  |
| `npm run lint`  | Run ESLint across the codebase           |

---

## Error Response Format

All admin API errors follow a consistent shape:

```json
{
  "error": "Human-readable error message",
  "code": 400
}
```

| HTTP Status | Code             | Meaning                                      |
|-------------|------------------|----------------------------------------------|
| 400         | INVALID_BODY     | Missing required fields or invalid values     |
| 401         | UNAUTHORIZED     | No valid session                              |
| 403         | FORBIDDEN        | Session exists but user is not an admin        |
| 404         | NOT_FOUND        | Requested resource does not exist              |
| 409         | CONFLICT         | Action already applied                        |
| 500         | INTERNAL_ERROR   | Unhandled server error                         |
