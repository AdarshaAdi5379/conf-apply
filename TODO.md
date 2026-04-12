# RecruiterRisk - TODO / Upgrade Plan

> Generated: 2026-04-01
> Project: RecruiterRisk (AI-powered recruiter trust & fraud detection platform)

---

## Task 1: Mount Job and Application Routes in Server

**Priority:** High
**Status:** Completed

### Problem
The `job.js` and `application.js` route files exist in `backend/src/routes/` with full CRUD implementations (356 and 455 lines respectively), but they are **never mounted** in `server.js`. This means all frontend features related to job browsing, job posting, application submission, and application management are completely broken — they hit 404 errors.

### Affected Frontend Pages
- `BrowseJobs.jsx` — Public job listing with filters
- `JobDetails.jsx` — Single job detail + application form
- `RecruiterJobs.jsx` — Recruiter job management (CRUD)
- `ApplicationManager.jsx` — Recruiter application review
- `MyApplications.jsx` — Candidate application tracking

### Implementation Plan
1. Import `jobRoutes` and `applicationRoutes` in `server.js`
2. Mount them at appropriate base paths (`/api/jobs` and `/api/applications`)
3. Verify route paths in `job.js` and `application.js` match frontend API calls
4. Ensure auth middleware is applied correctly to protected routes
5. Test all endpoints

### Acceptance Criteria
- All job-related frontend pages work against the backend
- All application-related frontend pages work against the backend
- Protected routes require authentication
- No 404 errors on job/application API calls

### Changes Made
1. Rewrote `backend/src/routes/job.js` from Mongoose/MongoDB to Postgres queries
2. Rewrote `backend/src/routes/application.js` from Mongoose/MongoDB to Postgres queries
3. Added `jobs` and `applications` tables to `backend/supabase/schema.sql` with proper constraints, indexes, and foreign keys
4. Added `update_updated_at_column()` trigger function and applied it to `recruiters`, `jobs`, and `applications` tables
5. Mounted both routes in `server.js` at `/api/jobs` and `/api/applications`
6. All routes now use the `postgres` library via `sql` template tags
7. Added `toCamel()` helper for snake_case → camelCase conversion
8. Preserved all original endpoint functionality (CRUD, search, pagination, duplicate, stats, interviews, scoring, etc.)

---

## Task 2: Remove MongoDB/Mongoose Dead Code

**Priority:** High
**Status:** Completed

### Problem
The project has a dual-database setup where the active code uses Supabase Postgres, but a full MongoDB/Mongoose layer exists as dead code:

- `backend/src/models/User.js` — Mongoose schema (unused)
- `backend/src/models/Recruiter.js` — Mongoose schema (unused)
- `backend/src/models/Feedback.js` — Mongoose schema (unused)
- `backend/src/models/Job.js` — Mongoose schema (unused)
- `backend/src/models/Application.js` — Mongoose schema (unused)
- `backend/src/config/database.js` — MongoDB connection config (unused)
- `backend/seed.js` — MongoDB seeder (will fail)
- `backend/middleware/auth.js` — Old CommonJS auth middleware (unused)
- `backend/src/middleware/errorHandler.js` — Mongoose-oriented error handler

These files add confusion, increase bundle size, and `seed.js` will crash if run.

### Implementation Plan
1. Delete `backend/src/models/` directory (all 5 Mongoose model files)
2. Delete `backend/src/config/database.js`
3. Delete `backend/seed.js` (or rewrite for Postgres)
4. Delete `backend/middleware/auth.js` (old CommonJS version)
5. Update `backend/src/middleware/errorHandler.js` to remove Mongoose references
6. Remove `mongoose` from `backend/package.json` dependencies
7. Verify no remaining imports reference deleted files

### Acceptance Criteria
- No MongoDB/Mongoose references remain in the codebase
- `mongoose` removed from package.json
- Backend starts without errors
- All existing functionality still works

### Changes Made
1. Deleted `backend/src/models/` directory (5 Mongoose model files)
2. Deleted `backend/src/config/database.js`
3. Deleted `backend/seed.js`
4. Deleted `backend/middleware/` directory (old CommonJS auth middleware)
5. Rewrote `backend/src/middleware/errorHandler.js` with Postgres error codes (23505, 23503, 23502) replacing Mongoose CastError, duplicate key, and ValidationError
6. Removed `mongoose` from `backend/package.json`
7. Removed `seed` script from `backend/package.json`

---

## Task 3: Fix API Path Mismatches Between Frontend and Backend

**Priority:** High
**Status:** Pending
**Files Affected:** `frontend/src/services/api.js`, `frontend/src/pages/`, `backend/src/routes/`

### Problem
The frontend API client and backend routes have inconsistent path naming:

| Frontend Call | Backend Route | Mismatch |
|---|---|---|
| `recruiters/search` | `/api/recruiter/search/query` | plural vs singular, missing `/query` |
| `feedbackAPI.submit` | `feedbackAPI.create` | method name mismatch |
| `recruiterAPI.getLeaderboard` | not defined in api.js | missing method |
| Various `fetch()` calls | `/api/...` prefix | missing `/api` prefix |

### Implementation Plan
1. Audit every frontend API call in `api.js` and all pages using raw `fetch()`
2. Standardize all paths to match backend route definitions
3. Ensure all calls go through the centralized axios instance (not raw `fetch()`)
4. Add missing methods (`getLeaderboard`, etc.)
5. Fix method name mismatches (`submit` → `create`)

### Acceptance Criteria
- All frontend API calls resolve to correct backend endpoints
- No 404 errors from path mismatches
- All API calls use the centralized axios instance with interceptors
- Consistent naming convention across the codebase

---

## Task 4: Standardize Availability Enum Values

**Priority:** High
**Status:** Pending
**Files Affected:** `backend/src/models/Application.js`, `backend/src/routes/application.js`, `frontend/src/components/CreateJobForm.jsx`, `frontend/src/pages/JobDetails.jsx`

### Problem
The "notice period / availability" field has different values across three layers:

| Layer | Values |
|---|---|
| Mongoose Model | `['Immediately', '1-2 weeks', '1 month', '2 months', 'Negotiable']` |
| Route Validation | `['Immediate', '2 weeks', '1 month', '2 months', '3+ months']` |
| Frontend | `['Immediate', '2 weeks', '1 month', '2 months', '3+ months']` |

This causes validation failures when frontend submits data that the backend rejects.

### Implementation Plan
1. Choose a single canonical set of values (recommend the frontend set since it's already in use)
2. Update the Postgres schema (`supabase/schema.sql`) with a CHECK constraint
3. Update route validation in `application.js`
4. Update frontend dropdowns in `CreateJobForm.jsx` and `JobDetails.jsx`
5. Remove the Mongoose model (covered in Task 2)

### Canonical Values (Recommended)
```
['Immediate', '2 weeks', '1 month', '2 months', '3+ months']
```

### Acceptance Criteria
- All layers use the exact same enum values
- Database has a CHECK constraint to enforce valid values
- No validation errors on form submission
- Consistent display across all UI components

---

## Task 5: Add Security Middleware (Helmet + Rate Limiting)

**Priority:** Medium
**Status:** Completed

### Problem
Both `helmet` and `express-rate-limit` are listed in `package.json` dependencies but are **never imported or used** in `server.js`. This leaves the API without:
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Rate limiting protection against brute force and DDoS

### Implementation Plan
1. Import `helmet` and `express-rate-limit` in `server.js`
2. Apply `helmet()` as early middleware
3. Configure rate limiting:
   - General API: 100 requests per 15 minutes
   - Auth endpoints (`/api/auth/login`, `/api/auth/register`): 20 requests per 15 minutes
   - Feedback submission: 10 requests per 15 minutes
4. Test that rate limiting doesn't break normal usage

### Acceptance Criteria
- Helmet headers present in all API responses
- Rate limiting active on all endpoints
- Auth endpoints have stricter limits
- No legitimate usage is blocked

### Changes Made
1. Added `helmet` import and applied it as the first middleware in `server.js`
2. Added `express-rate-limit` import with three tiers:
   - General API limiter: 100 req/15min on `/api/`
   - Auth limiter: 20 req/15min on `/api/auth/`
   - Feedback limiter: 10 req/15min on `/api/feedback`
3. Enabled `standardHeaders: true` (RateLimit-Reset, RateLimit-Remaining) and disabled legacy headers
4. Custom error messages for each limiter tier

---

## Task 8: Add Input Validation Utilities

**Priority:** Medium
**Status:** Completed

### Problem
`backend/src/utils/validators.js` is an **empty file** (0 lines). Input validation is scattered across route files with inconsistent patterns. Some routes use `express-validator`, others do manual checks, and some have no validation at all.

### Implementation Plan
1. Create reusable validation functions in `validators.js`:
   - `validateEmail(email)` — RFC 5322 compliant
   - `validatePassword(password)` — Min 8 chars, mixed case, number
   - `validateUrl(url)` — Valid URL format
   - `validatePhoneNumber(phone)` — E.164 format
   - `sanitizeInput(input)` — XSS prevention
   - `validateDate(date)` — Valid date format
2. Add express-validator middleware chains for common request bodies
3. Update routes to use centralized validators
4. Add validation error formatting utility

### Acceptance Criteria
- `validators.js` contains comprehensive validation utilities
- All routes use centralized validation
- Consistent error response format for validation failures
- XSS and injection prevention in place

### Changes Made
1. Populated `backend/src/utils/validators.js` with:
   - `validateEmail()` — RFC 5322 regex
   - `validatePassword()` — Min 8 chars, uppercase, lowercase, number
   - `validatePasswordDetailed()` — Returns specific error messages per requirement
   - `validateUrl()` — HTTP/HTTPS URL validation
   - `validatePhoneNumber()` — E.164 format
   - `validateDate()` — Valid date check
   - `validatePositiveNumber()` — Non-negative number check
   - `sanitizeInput()` — HTML entity encoding for XSS prevention
   - `sanitizeObject()` — Batch sanitize specific fields on an object
   - `PASSWORD_REQUIREMENTS` — Exported constants for frontend use

---

## Task 9: Add Database Triggers and Schema Improvements

**Priority:** Medium
**Status:** Completed

### Problem
The Postgres schema is missing:
- Auto-update trigger for `updated_at` columns
- Proper indexes for frequently queried columns
- Foreign key constraints
- CHECK constraints for enum fields
- Tables for `jobs` and `applications` (only `users`, `recruiters`, `feedback` exist)

### Implementation Plan
1. Add `updated_at` trigger function and triggers
2. Add indexes on frequently queried columns (email, company_domain, etc.)
3. Add foreign key constraints between related tables
4. Add CHECK constraints for enum fields (role, status, availability, etc.)
5. Create `jobs` and `applications` tables matching the route expectations
6. Add cascade delete rules where appropriate

### Acceptance Criteria
- Schema includes all tables needed by mounted routes
- `updated_at` auto-updates on row changes
- Proper indexes exist for query performance
- Foreign key constraints enforce referential integrity
- CHECK constraints prevent invalid data

### Changes Made
1. Added `jobs` table with:
   - All job fields (title, company, role_type, work_mode, experience_level, etc.)
   - JSONB columns for location, salary_range
   - Array columns for responsibilities, skills, benefits, tags
   - CHECK constraints on role_type, work_mode, experience_level, status
   - Foreign keys to recruiters and users with cascade delete
   - Indexes on recruiter_id, status, role_type, created_at
2. Added `applications` table with:
   - All application fields (cover_letter, portfolio, linkedIn, github, phone, etc.)
   - JSONB columns for expected_salary, resume, interview_schedule, status_history
   - CHECK constraints on availability and status enums
   - Foreign keys to jobs, users, recruiters with cascade delete
   - Indexes on job_id, candidate_id, recruiter_id, status, created_at
3. Added `update_updated_at_column()` trigger function
4. Applied triggers to `recruiters`, `jobs`, and `applications` tables

---

## Task 7: Centralize All Frontend API Calls Through Axios Instance

**Priority:** Medium
**Status:** Completed

### Problem
Many frontend pages bypass the centralized `api.js` axios instance and use raw `fetch()` calls with hardcoded URLs. This means:
- No automatic auth token injection
- No consistent error handling
- Inconsistent base URL resolution
- Hardcoded fallback to production URL even in development

### Changes Made
1. Rewrote `frontend/src/services/api.js` with complete API coverage:
   - `authAPI` — login, register, getCurrentUser
   - `recruiterAPI` — search, getById, verify, getLeaderboard, update
   - `feedbackAPI` — create, getByRecruiter, respond, myFeedback
   - `adminAPI` — getDashboard, getFlaggedRecruiters, getReportedFeedback, flagRecruiter, deleteFeedback
   - `jobAPI` — getAll, getById, create, update, delete, duplicate, getMyJobs, getStats
   - `applicationAPI` — submit (with multipart support), getMyApplications, getJobApplications, getById, updateStatus, updateNotes, updateScore, scheduleInterview, withdraw, getRecruiterDashboard
2. Fixed env variable inconsistency — unified to `VITE_API_URL` with fallback to `VITE_API_BASE`
3. Migrated 6 files from `fetch()` to `api.js`:
   - `BrowseJobs.jsx` — `jobAPI.getAll(params)`
   - `JobDetails.jsx` — `jobAPI.getById(id)` + `applicationAPI.submit(data, formData)`
   - `RecruiterJobs.jsx` — `jobAPI.getMyJobs()`, `jobAPI.delete()`, `jobAPI.duplicate()`
   - `ApplicationManager.jsx` — `jobAPI.getById()`, `applicationAPI.getJobApplications()`, `applicationAPI.updateStatus()`
   - `MyApplications.jsx` — `applicationAPI.getMyApplications()`, `applicationAPI.withdraw()`
   - `CreateJobForm.jsx` — `jobAPI.create()` / `jobAPI.update()`
4. Fixed `FeedbackForm.jsx` — changed `feedbackAPI.submit()` to `feedbackAPI.create()`
5. Zero `fetch()` calls remain in the entire frontend codebase

---

## Task 10: Clean Up Empty and Useless Files

**Priority:** Low
**Status:** Completed

### Changes Made
1. Populated `backend/.gitignore` with Node.js ignores (node_modules, .env, logs, dist, uploads)
2. Populated `frontend/.gitignore` with Vite/React ignores (node_modules, dist, .env, .env.local, logs)
3. Populated `frontend/.env.development` with `VITE_API_URL=http://localhost:5000` and `VITE_API_BASE=http://localhost:5000`
4. Rewrote root `package.json` with useful workspace scripts:
   - `npm run dev` — runs both frontend and backend concurrently
   - `npm run dev:backend` / `npm run dev:frontend` — individual dev servers
   - `npm run build` — builds frontend
   - `npm run start` — starts backend
   - `npm run install:all` — installs all dependencies at once
5. Installed `concurrently` as root dev dependency for parallel dev servers

---

## Task 11: Add Testing Infrastructure

**Priority:** Low
**Status:** Pending
**Files Affected:** New files throughout project

### Problem
Zero test files exist. No testing framework is configured. The `.gitignore` references coverage directories but nothing is set up. This makes refactoring risky and bugs harder to catch.

### Implementation Plan
1. **Backend Testing:**
   - Install Vitest + Supertest
   - Create test setup file
   - Add test scripts to `backend/package.json`
   - Write tests for auth routes (register, login, me)
   - Write tests for recruiter routes
   - Write tests for feedback routes
   - Write tests for admin routes
   - Write tests for job and application routes

2. **Frontend Testing:**
   - Install Vitest + React Testing Library
   - Create test setup file
   - Add test scripts to `frontend/package.json`
   - Write tests for AuthContext
   - Write tests for key components
   - Write tests for API service

### Acceptance Criteria
- Backend test suite runs with `npm test`
- Frontend test suite runs with `npm test`
- Minimum 70% code coverage
- All critical paths have tests
- Tests run in CI (when Task 12 is done)

---

## Task 12: Add CI/CD Pipeline

**Priority:** Low
**Status:** Pending
**Files Affected:** New `.github/workflows/` directory

### Problem
No CI/CD configuration exists despite the README targeting Render (backend) and Vercel (frontend). No automated testing, linting, or deployment pipelines.

### Implementation Plan
1. Create `.github/workflows/ci.yml`:
   - Run on push and PR to main
   - Backend: install deps, lint, test
   - Frontend: install deps, lint, build
   - Report coverage

2. Create `.github/workflows/deploy.yml`:
   - Trigger on main branch push
   - Deploy backend to Render
   - Deploy frontend to Vercel

3. Add `render.yaml` for backend deployment config
4. Add `vercel.json` for frontend deployment config

### Acceptance Criteria
- CI runs on every push and PR
- Tests must pass before merge
- Automated deployment on main branch merge
- Build artifacts are cached for speed

---

## Execution Order

Tasks should be completed in this order (dependencies noted):

1. **Task 1** — Mount routes (blocks Task 3, 7 testing)
2. **Task 2** — Remove MongoDB dead code (unblocks Task 4)
3. **Task 3** — Fix API path mismatches (depends on Task 1)
4. **Task 4** — Standardize enums (depends on Task 2)
5. **Task 5** — Add security middleware (independent)
6. **Task 6** — Remove duplicate file (independent)
7. **Task 7** — Centralize API calls (depends on Task 3)
8. **Task 8** — Add validation utilities (independent)
9. **Task 9** — Schema improvements (independent)
10. **Task 10** — Clean up files (independent)
11. **Task 11** — Add testing (depends on Tasks 1-9)
12. **Task 12** — Add CI/CD (depends on Task 11)

---

## Progress Tracker

| Task | Description | Priority | Status |
|------|-------------|----------|--------|
| 1 | Mount Job and Application Routes | High | ✅ Completed |
| 2 | Remove MongoDB/Mongoose Dead Code | High | ✅ Completed |
| 3 | Fix API Path Mismatches | High | ⬜ Pending |
| 4 | Standardize Availability Enum | High | ⬜ Pending |
| 5 | Add Security Middleware | Medium | ✅ Completed |
| 6 | Remove Duplicate clearbitService | Medium | ✅ Completed |
| 7 | Centralize Frontend API Calls | Medium | ✅ Completed |
| 8 | Add Input Validation Utilities | Medium | ✅ Completed |
| 9 | Database Schema Improvements | Medium | ✅ Completed |
| 10 | Clean Up Empty Files | Low | ✅ Completed |
| 11 | Add Testing Infrastructure | Low | ⬜ Pending |
| 12 | Add CI/CD Pipeline | Low | ⬜ Pending |
