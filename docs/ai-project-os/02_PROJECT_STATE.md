# Project State (Tutiba)

## Current Objective
Complete a functional MVP within 2 days, maintaining stability. Current focus: Security & Authorization (SECURITY-001-PHASE-B completed).

## Implemented Features (MVP)
- Landing page with course search and filtering.
- Public course catalog and course details.
- User authentication via Supabase Auth (Email/Password & JWT Session handling).
- Dashboard and Profile management for users.
- Course enrollment logic with simulated success.
- Lesson Player and Quiz System.
- Basic Admin Dashboard (now secured with RBAC).
- Unified single-page routing without hard reloads.

## Completed Refactoring & Cleanups
- Legacy `auth_token` mock logic entirely removed.
- Route navigation fully unified to `react-router-dom` (`<Link>`, `useNavigate`).
- `CourseGrid` and `LessonInfo` accurately consume JWT access tokens from `AuthContext`.
- All `fix_*.cjs` temporary cleanup scripts removed from source control.
- Centralized RBAC implemented (SECURITY-001-PHASE-B) replacing hardcoded `m.najuib.nbe@gmail.com` checks with `app_metadata.role` driven permissions.

## Pending Features (Next Steps)
- Course Ownership functionality and Instructor dashboards.
- Dynamic DB fetching for Course and Progress data (currently mocked in `api.ts`).
- Secure Supabase RLS implementations for all tables to respect new `role` metadata.

## Open Issues
- `instructorId` is missing from `Course` model, blocking instructor ownership features.
- Testing structure (Unit/E2E) is not configured.
