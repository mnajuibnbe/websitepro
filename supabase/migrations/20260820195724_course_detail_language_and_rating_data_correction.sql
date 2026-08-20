-- Verified production data corrections for the 3 currently published Tutiba
-- courses (see COURSE_DETAIL_REDESIGN plan / IMPLEMENTATION_LOG for provenance):
--
-- 1) courses.language was 'English' for all 3 - the only value the app's
--    language taxonomy allowed until this change (COURSE_LANGUAGES now includes
--    'Arabic'). These courses are genuinely Arabic-taught; corrected here.
-- 2) Verified external rating data pulled directly from the live Udemy course
--    pages on 2026-08-20 (exact title + instructor match: "Skin and Hair Care
--    Diploma Part N" / Dr.Aya Elbrashy).
--
-- Guarded to the exact verified UUIDs and status='published' so no other/future
-- course is touched.

UPDATE public.courses
SET language = 'Arabic'
WHERE id IN (
  '5d1436b8-229c-4853-ba75-4756ce52ada0', -- Skin and Hair Care Diploma Part 1
  'f9f04e1a-18fe-4b61-a4c0-d156e3a3bca9', -- Skin and Hair Care Diploma Part 2
  '19362ba8-e384-42dd-9ba0-a026af7737a8'  -- Skin and Hair Care Diploma Part 3
)
AND status = 'published';

UPDATE public.courses SET
  display_rating = 4.4,
  display_rating_count = 154,
  display_rating_source = 'Udemy',
  display_rating_source_url = 'https://www.udemy.com/course/skin-and-hair-care-diploma-part-1/',
  display_rating_verified_at = CURRENT_DATE
WHERE id = '5d1436b8-229c-4853-ba75-4756ce52ada0' AND status = 'published';

UPDATE public.courses SET
  display_rating = 4.5,
  display_rating_count = 59,
  display_rating_source = 'Udemy',
  display_rating_source_url = 'https://www.udemy.com/course/skin-and-hair-care-diploma-part-2/',
  display_rating_verified_at = CURRENT_DATE
WHERE id = 'f9f04e1a-18fe-4b61-a4c0-d156e3a3bca9' AND status = 'published';

UPDATE public.courses SET
  display_rating = 4.5,
  display_rating_count = 37,
  display_rating_source = 'Udemy',
  display_rating_source_url = 'https://www.udemy.com/course/skin-and-hair-care-diploma-part-3/',
  display_rating_verified_at = CURRENT_DATE
WHERE id = '19362ba8-e384-42dd-9ba0-a026af7737a8' AND status = 'published';
