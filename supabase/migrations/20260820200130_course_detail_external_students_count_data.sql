-- Verified external student counts (Udemy course pages, confirmed live 2026-08-20)
-- for the same 3 published courses corrected in
-- 20260820195724_course_detail_language_and_rating_data_correction.sql.

UPDATE public.courses SET display_students_count = 1058
WHERE id = '5d1436b8-229c-4853-ba75-4756ce52ada0' AND status = 'published';

UPDATE public.courses SET display_students_count = 752
WHERE id = 'f9f04e1a-18fe-4b61-a4c0-d156e3a3bca9' AND status = 'published';

UPDATE public.courses SET display_students_count = 673
WHERE id = '19362ba8-e384-42dd-9ba0-a026af7737a8' AND status = 'published';
