-- Companion to 20260820203856_course_detail_content_fix_part1.sql -- see that file for
-- full context. Outcomes here are grounded in Part 3's own real curriculum sections
-- (hair composition, shampoos/conditioners, hair dyes, straightening, dandruff, hair
-- loss diagnosis and treatment).

UPDATE public.courses SET
  learning_outcomes = to_jsonb(ARRAY[
    'Explain hair composition, structure, and the hair growth cycle',
    'Identify different shampoo and conditioner formulations and how they affect hair',
    'Understand the science behind hair dyes and hair-straightening treatments',
    'Recognize different types of dandruff and the active ingredients used to treat them',
    'Identify the types and causes of hair loss and the tests used to diagnose them',
    'Evaluate hair-loss treatment products and supplements, including affordable options',
    'Apply this knowledge to recommend appropriate hair-care products and routines'
  ]::text[]),
  target_audience = to_jsonb(ARRAY[
    'Pharmacists, doctors, dentists, nurses, and veterinarians',
    'Anyone who recommends, prescribes, or sells cosmetic products professionally',
    'Anyone who wants to better understand the cosmetic products they use'
  ]::text[]),
  requirements = to_jsonb(ARRAY[
    'No prior cosmetic science knowledge required -- the course builds up from the basics',
    'A scientific, pharmaceutical, or medical background is helpful but not required'
  ]::text[])
WHERE id = '19362ba8-e384-42dd-9ba0-a026af7737a8' AND status = 'published';
