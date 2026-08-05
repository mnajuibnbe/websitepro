-- Verified: all 4 rows match current enrollments by id/user_id/course_id/enrolled_at.
-- UUID migration confirmed complete and correct; this backup is no longer needed.
DROP TABLE IF EXISTS public.enrollments_backup_before_uuid_20260725;
