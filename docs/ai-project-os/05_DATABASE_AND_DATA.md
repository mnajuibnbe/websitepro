# Database and Data

## Data Source
Supabase (PostgreSQL). Interaction occurs exclusively client-side via the Supabase JS SDK.

## Expected Schema (Inferred from code)
- **`courses`**: Contains `id` (UUID), `title`, `thumbnail`, etc.
- **`enrollments`**: Join table tracking user access. Contains `id`, `user_id` (UUID), `course_id` (UUID), `status` (e.g., 'active', 'pending').
- **`lessons`**: Contains `id`, `course_id`, etc.
- **`user_progress`**: Tracks which lessons are completed by a user. Contains `lesson_id`, `course_id`, `user_id`.

## Noteworthy Data Flows
1. **Enrollment Resolution:** In `MyCourses.tsx`, enrollments are fetched first. The resulting `course_id`s are extracted, and a secondary `.in()` query fetches the course details to prevent foreign-key join failures (like `PGRST200`) in case of missing relations.
2. **Progress Calculation:** Progress is currently derived by counting `lessons` for a course and comparing it to matching `user_progress` entries (as seen in `MyCoursesList.tsx`). However, `MyCourses.tsx` forces `progress = 0`.
