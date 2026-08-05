-- Resolve the 2 unmapped legacy "Learn More" category values per admin decision.
UPDATE public.courses
SET category = 'Skin & Hair'
WHERE id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

UPDATE public.courses
SET category = 'Cosmetic science'
WHERE id = 'b2c3d4e5-f6a1-5b2c-9d8e-1f2a3b4c5d6e';

DELETE FROM public.course_category_migration_issues
WHERE course_id IN ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'b2c3d4e5-f6a1-5b2c-9d8e-1f2a3b4c5d6e');
