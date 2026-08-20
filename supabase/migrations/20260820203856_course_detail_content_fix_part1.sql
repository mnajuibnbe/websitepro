-- Real learning_outcomes were lesson-topic fragments copy-pasted identically across all
-- 3 published courses (confirmed against each course's actual published curriculum
-- sections). Rewritten per-course as genuine learner outcomes grounded in this course's
-- real section titles -- no invented capabilities. target_audience/requirements carried
-- the same real meaning but as dense paragraphs; rewritten as concise bullets, no
-- content added or removed. This content is genuinely identical across the 3 courses
-- (same diploma track / same prerequisites), so it is intentionally repeated in the
-- companion Part 2 / Part 3 migrations.

UPDATE public.courses SET
  learning_outcomes = to_jsonb(ARRAY[
    'Explain the scientific foundations of cosmeceutics and how active ingredients interact with the skin',
    'Identify different skin types and conditions and match them to an appropriate care routine',
    'Compare hyaluronic acid and collagen formulations and evaluate their real-world efficacy',
    'Apply a step-by-step skincare routine, from cleansing through exfoliation and hydration',
    'Evaluate vitamin A (retinoid) products and laser or enzymatic exfoliation options for different skin concerns',
    'Assess moisturizers for oily, combination, and dry skin, including budget-friendly alternatives',
    'Read and interpret ingredient lists to recommend suitable skincare products'
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
WHERE id = '5d1436b8-229c-4853-ba75-4756ce52ada0' AND status = 'published';
