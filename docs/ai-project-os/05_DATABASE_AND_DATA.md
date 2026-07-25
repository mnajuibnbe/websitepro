# Database and Data

## Data Source
Supabase (PostgreSQL). Interaction occurs exclusively client-side via the Supabase JS SDK.

## Verified Database Schema
- **`courses`**: Contains `id` (UUID), `title`, `description`, `price`, `thumbnail`, `created_at`.
- **`enrollments`**: Join table tracking user access. Contains `id`, `user_id` (UUID), `course_id` (UUID), `status` ('active', 'pending', etc.), `enrolled_at`.
- **`course_sections`**: Sections within courses. Contains `id` (UUID), `course_id` (UUID), `title`, `description`, `order_index`, `is_published`, `created_at`, `updated_at`. Unique constraint on `(course_id, order_index)`.
- **`lessons`**: Lessons within sections/courses. Contains `id` (UUID), `course_id` (UUID), `section_id` (UUID, FK to `course_sections`), `title`, `description`, `content`, `video_url`, `type` ('video' or 'text'), `duration`, `order_index`, `is_published`, `is_preview`, `created_at`, `updated_at`.
- **`lesson_progress`**: Tracks completed lessons per user. Contains `id` (UUID), `user_id` (UUID), `course_id` (UUID), `lesson_id` (UUID), `is_completed`, `last_accessed_at`, `completed_at`, `created_at`, `updated_at`. Unique constraint on `(user_id, lesson_id)`.

## Access Control & Helper Functions
1. **`public.has_active_enrollment(target_course_id UUID)`**: Database security function checking `auth.uid()` active enrollment for a given course.
2. **`trg_sync_lesson_progress_course_id`**: Trigger ensuring `lesson_progress.course_id` always matches `lessons.course_id`.
3. **Row Level Security (RLS)**: Enforced on `course_sections`, `lessons`, and `lesson_progress` using `has_active_enrollment` for student access and `app_metadata.role = 'admin'` for administrative management.

## Progress Calculation
Progress is derived by counting published lessons for an actively enrolled course and comparing it to matching `lesson_progress` entries (`is_completed = true`). Obsolete `user_progress` table references have been fully removed.
