# DC Space Next Web

DC Space is a Next.js App Router application for event discovery, RFID-based attendance tracking, certificate handling, user registration/login, and admin management.

The repository is structured as a single deployable Vercel app. User-facing pages, admin pages, and API route handlers all live in the root Next.js project.

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript for the main app and API utilities
- JavaScript for the merged admin UI components
- MongoDB for users, events, attendance, bookmarks, certificates, and admin data
- NextAuth for admin auth routes
- Custom JWT helpers for user auth APIs
- `pdf-lib` for certificate/PDF work
- CSS modules/global CSS files under `styles/` and route-specific CSS imports

## Quick Start

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
copy .env.example .env.local
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The root route redirects to `/login`.

## Environment Variables

See [.env.example](./.env.example).

Required variables:

```text
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=dcspace
JWT_SECRET=change-this-super-secret-key
JWT_EXPIRES_IN=7d
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-this-nextauth-secret
```

For Vercel, set these in Project Settings > Environment Variables. Use a hosted MongoDB provider such as MongoDB Atlas for production.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Notes:

- `npm run build` is the production build used by Vercel.
- `next.config.ts` currently sets `eslint.ignoreDuringBuilds = true` because existing style lint issues would block deployment even when TypeScript and the production build pass.
- `npm run lint` still runs linting separately.

## Main Routes

Public/account routes:

- `/login` - user login
- `/register` - user registration
- `/forgot-password` - password recovery UI

User app routes, grouped under `app/(main)`:

- `/home` - main home/dashboard landing content
- `/dashboard` - user dashboard
- `/dashboard/events-joined` - joined events
- `/dashboard/events-joined/details` - joined event details
- `/dashboard/organized-event` - organized event detail route
- `/dashboard/registered-event` - registered event route
- `/events` - event browsing
- `/events/details` - event details and registration flow
- `/events-organized` - organized events overview
- `/events-organized/create` - event creation form
- `/attendance` - attendance list
- `/attendance/details` - RFID attendance details and tap view
- `/certificates` - user certificates
- `/my-profile` - user profile
- `/notifications` - user notifications
- `/organize` - event organization entry page
- `/submit-feedback` - feedback form
- `/hover` - UI/demo route

Admin routes:

- `/admin` - admin dashboard
- `/admin/events` - admin events view
- `/admin/users` - user management
- `/admin/ecert` - e-certificate management
- `/admin/feedback` - feedback management
- `/admin/tap` - admin RFID tap attendance view

Utility route:

- `/rfid-mockup` - local RFID mockup page wrapper

## API Routes

User/auth APIs:

- `POST /api/auth/register` - create user account
- `POST /api/auth/login` - user login, returns JWT and profile
- `GET /api/profile` - current user profile from bearer token

Event APIs:

- `GET /api/events` - list events
- `POST /api/events` - submit event for approval
- `GET /api/events/[id]` - fetch event details
- `GET /api/events/bookmarks` - list bookmarked events
- `POST /api/events/bookmarks/[eventId]` - bookmark event
- `DELETE /api/events/bookmarks/[eventId]` - remove bookmark

Attendance/RFID APIs:

- `GET /api/attendance` - attendance logs for current user
- `POST /api/attendance` - record a signed-in user's RFID tap
- `GET /api/attendance/status` - attendance summary for current user
- `POST /api/rfid/tap` - kiosk/admin-style RFID tap by RFID number

Certificate APIs:

- `GET /api/certificates` - user certificates
- `GET /api/certificates/[id]/download` - certificate download metadata

Admin APIs:

- `/api/admin/auth/*` - admin auth/login/register/google routes
- `/api/admin/dashboard` - dashboard data
- `/api/admin/events` and `/api/admin/events/[id]` - admin event management
- `/api/admin/users` and `/api/admin/users/[id]` - admin user management
- `/api/admin/certificates/*` - admin certificate management and generation
- `/api/admin/feedback` - feedback overview
- `/api/admin/notifications` - admin notifications
- `/api/admin/ai/analytics` - Gemini-backed analytics route

Health check:

- `GET /api/health`

## Repository Structure

Top-level files:

- `app/` - Next.js App Router pages, layouts, loading/error boundaries, and API routes
- `components/` - user-facing React components and admin UI components
- `contexts/` - React context providers used by the admin shell
- `lib/` - server/client utilities, database helpers, auth helpers, storage helpers, and admin database modules
- `public/` - static assets, logos, SVG icons, certificate template image, and RFID mockup HTML
- `scripts/` - utility scripts
- `styles/` - global CSS, admin CSS, shell CSS, and page-specific CSS
- `middleware.ts` - route protection for admin routes and protected admin APIs
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `package.json` and `package-lock.json` - npm package metadata and lockfile
- `.env.example` - required environment variable template

### `app/`

Important files:

- `app/layout.tsx` - root HTML layout, fonts, metadata, favicon links
- `app/page.tsx` - redirects `/` to `/login`
- `app/globals.css` - global theme variables and base styles
- `app/error.tsx` and `app/global-error.tsx` - route/global error boundaries
- `app/not-found.tsx` - custom 404 page
- `app/loading.tsx` - root loading UI

Route groups:

- `app/(main)/` - authenticated user-facing app layout and pages
- `app/admin/` - admin UI routes
- `app/api/` - route handlers
- `app/login/`, `app/register/`, `app/forgot-password/` - account pages

### `components/`

User-facing components:

- `AppShell.tsx` - main application shell
- `Sidebar.tsx` - user navigation shell
- `LoginForm.tsx` - login form and user session bootstrapping
- `RegisterAccountContent.tsx` - account registration flow
- `DashboardPageContent.tsx` - dashboard page
- `EventsPageContent.tsx` - event browser
- `EventDetailsPageContent.tsx` - event detail and registration UI
- `OrganizeForm.tsx` - event creation form
- `AttendancePageContent.tsx` - attendance list and backend sync
- `AttendanceDetailsPageContent.tsx` - RFID attendance detail view
- `CertificatesPageContent.tsx` - certificate list
- `MyProfileContent.tsx` - profile UI
- `NotificationsPageContent.tsx` - notifications UI
- `SubmitFeedbackContent.tsx` - feedback form
- `EmptyState.tsx`, `SearchWithClear.tsx`, `LoadingScreen.tsx` - shared UI pieces

Admin components:

- `components/admin/AdminShell.js` - admin layout shell/topbar/sidebar behavior
- `components/admin/AdminSidebar.js` - admin navigation
- `components/admin/views/*.js` - dashboard, events, users, e-certificate, feedback, and tap attendance views

### `lib/`

Core helpers:

- `db.ts` - lazy MongoDB connection and index setup
- `auth-helpers.ts` - school email validation, registration validation, user serialization
- `password.ts` - password hashing and verification
- `token.ts` - custom JWT sign/verify helpers for user auth
- `route-auth.ts` - bearer-token route protection helper
- `user-api.ts` - browser API wrapper for same-origin `/api/*` calls
- `attendance.ts` - attendance storage, RFID tap handling, certificate status helpers
- `event-helpers.ts` - event validation/serialization for APIs
- `dc-events.ts` - local event storage and event organization helpers
- `dc-storage.ts` - storage utilities
- `notifications.ts` - notification helpers
- `nav.ts` - navigation metadata

Admin helpers:

- `lib/admin/auth/*` - NextAuth/admin auth helpers
- `lib/admin/db/*` - MongoDB admin data access modules
- `lib/admin/certificates/generate.ts` - certificate PDF generation
- `lib/admin/ai/gemini.ts` - Gemini integration for admin analytics
- `lib/admin/ecertRows.js`, `lib/admin/usersData.js` - admin UI seed/static data

### `styles/`

Global/admin styles:

- `styles/admin.css` - primary admin UI stylesheet
- `styles/admin-components-modern.css` - admin component styling
- `styles/admin-shell-template.css` - admin shell styling
- `styles/admin-tap.css` - admin tap attendance styling
- `styles/glass.css` - shared glass-style tokens/utilities
- `styles/sidebar.css` - main user shell/topbar/sidebar styles

Page styles:

- `styles/pages/*.css` - route-specific styles for attendance, dashboard, events, certificates, profile, notifications, organize, feedback, etc.

### `public/`

Important asset groups:

- `public/assets/` - shared UI icons and login/logo assets
- `public/dcspace-logos/` - DC Space brand logos and favicon files
- `public/certificates/default-template.png` - certificate template image
- `public/svg icons .../` - page-specific SVG icon folders
- `public/rfid-mockup.html` - standalone RFID mockup HTML

## Authentication and Authorization

There are two auth surfaces:

1. User auth:
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - custom JWT stored by the frontend through `lib/user-api.ts`
   - protected user API routes use bearer tokens through `lib/route-auth.ts`

2. Admin auth:
   - NextAuth-backed admin routes live under `/api/admin/auth/*`
   - `middleware.ts` protects `/admin/:path*` and `/api/admin/((?!auth/).+)`
   - route handlers still need their own authorization checks where sensitive data is accessed

## Data Model Overview

MongoDB collections used by the app include:

- `users` - registered users, admin users, password hashes, RFID numbers
- `events` - event records, status, organizer metadata, attendance requirements
- `attendance_logs` - current attendance records per user/event
- `attendance_tap_history` - append-only RFID tap history
- `bookmarks` - user bookmarked events
- `certificates` - issued certificate records
- `feedback` - feedback records
- `reports` - admin notification/report data

`lib/db.ts` creates indexes for users and bookmarks during lazy database initialization.

## Attendance and RFID Flow

- Users register with a school email and optional RFID number.
- Login stores the auth session and compatibility profile values for existing UI helpers.
- Event registration writes local compatibility records and can sync with backend events.
- Attendance pages read local records and sync backend logs through `/api/attendance`.
- RFID taps can be recorded through:
  - `/api/attendance` for signed-in users
  - `/api/rfid/tap` for kiosk/admin-style scans
- Attendance records track tap pairs, tap-in/tap-out values, status, and certificate eligibility.

## Certificates

User certificate routes expose certificate list/download metadata. Admin certificate routes support template/generation workflows. PDF generation support lives in:

```text
lib/admin/certificates/generate.ts
sample-certificate.pdf
public/certificates/default-template.png
```

## Deployment on Vercel

This repo is intended to deploy as one Vercel Next.js project.

Recommended Vercel settings:

- Framework Preset: Next.js
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: default
- Environment Variables: copy the required values from `.env.example`

Do not deploy a separate backend app from this repository. The backend is implemented through root `app/api/**` route handlers.

## Verification

Run these before merging/deploying:

```bash
npx tsc --noEmit
npm run build
```

The build currently skips ESLint during production builds. Run lint separately when working on style cleanup:

```bash
npm run lint
```

## Current Notes and Caveats

- `next@15.1.0` is currently installed. npm reports this version has known security advisories; upgrading Next.js should be prioritized before production launch.
- Some UI state still uses `localStorage` for compatibility with earlier frontend flows. Backend APIs are now present for user auth, events, attendance, RFID taps, bookmarks, and certificates.
- Admin UI files are JavaScript while the main app is TypeScript. `allowJs` is enabled in `tsconfig.json`.
- `styles/admin.css.bak` is retained from the admin UI merge as a backup stylesheet.
- The repository has existing ESLint quote-style debt, so `next.config.ts` ignores lint during production builds.

## Useful Development Paths

- Main user shell: `app/(main)/layout.tsx`, `components/AppShell.tsx`, `components/Sidebar.tsx`
- Login/register: `app/login/page.tsx`, `components/LoginForm.tsx`, `app/register/page.tsx`, `components/RegisterAccountContent.tsx`
- User APIs: `app/api/auth/*`, `app/api/profile`, `app/api/events`, `app/api/attendance`, `app/api/rfid/tap`
- Admin UI: `app/admin/*`, `components/admin/*`, `styles/admin.css`
- Admin APIs: `app/api/admin/*`, `lib/admin/*`
- Database connection: `lib/db.ts`
- Deployment config: `next.config.ts`, `.env.example`, `middleware.ts`
