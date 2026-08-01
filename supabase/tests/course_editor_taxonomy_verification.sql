SELECT id, name, slug, display_order, is_active
FROM public.course_categories
ORDER BY display_order, id;

SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public' AND event_object_table = 'courses'
  AND trigger_name = 'trg_courses_validate_category';

-- Inventory legacy values that need an explicit mapping before editors change them.
SELECT category, count(*)
FROM public.courses
WHERE category IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.course_categories cc WHERE cc.name = courses.category)
GROUP BY category ORDER BY count(*) DESC;
