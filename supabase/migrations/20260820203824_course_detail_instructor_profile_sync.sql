-- The public course-detail instructor section was showing "Instructor bio coming soon"
-- because instructor_public_profiles.bio/credentials for Dr. Aya Elbrashy (user_id
-- 85aaea12-19c4-4add-8340-a72e94f5324b) still contained the literal admin-form
-- placeholder guidance text ("Add at least one expertise area, an 80-character
-- biography, and 20 characters of credentials.") that was submitted verbatim through
-- the instructor-application flow and never replaced.
--
-- Real, already-published, admin-authored content for this same instructor exists in
-- homepage_instructor_settings (id=1: heading_highlight, bio, experience_badge_*,
-- credential_pills). This syncs that verified content into the public course
-- instructor profile instead of inventing anything new. expertise[] was already real
-- and is left untouched.
UPDATE public.instructor_public_profiles
SET
  professional_name = 'Dr. Aya Elbrashy',
  bio = 'Learn skin, hair, and beauty-nutrition science from an educator who has spent more than a decade turning research into decisions professionals use every day.',
  credentials = 'Skin & Beauty Nutrition Specialist with 10+ years of experience, teaching an evidence-based curriculum.',
  updated_at = now()
WHERE user_id = '85aaea12-19c4-4add-8340-a72e94f5324b';
