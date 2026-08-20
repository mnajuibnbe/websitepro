-- Companion to 20260820203856_course_detail_content_fix_part1.sql -- see that file for
-- full context. Outcomes here are grounded in Part 2's own real curriculum sections
-- (hyperpigmentation, acne, isotretinoin, niacinamide, aging, sunscreens).

UPDATE public.courses SET
  learning_outcomes = to_jsonb(ARRAY[
    'Explain the causes of hyperpigmentation and evaluate brightening ingredients and formulations',
    'Understand the different types of acne and the treatment approach used for each',
    'Explain how isotretinoin works, including its effects, side effects, and required monitoring',
    'Describe the benefits of niacinamide and how concentration affects its results',
    'Evaluate skin-aging and anti-wrinkle products based on their active ingredients',
    'Compare chemical and physical sunscreens and assess SPF and formulation differences',
    'Apply this knowledge to recommend real skincare products for pigmentation, acne, aging, and sun protection'
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
WHERE id = 'f9f04e1a-18fe-4b61-a4c0-d156e3a3bca9' AND status = 'published';
