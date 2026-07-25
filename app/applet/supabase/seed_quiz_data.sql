-- Development Seed Data for Single Choice Quiz "اختبار تحديد نوع البشرة"
-- Target Quiz Lesson ID: e3f4a1b2-c3d4-4e5f-8a9b-0c1d2e3f4a1b
-- Target Course ID: a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d

DO $$
BEGIN
  -- 1. Create or update Quiz record for the skin type quiz lesson
  INSERT INTO public.quizzes (
    id,
    lesson_id,
    course_id,
    title,
    description,
    pass_percentage,
    time_limit_minutes,
    max_attempts,
    is_published
  ) VALUES (
    'f4e3d2c1-b0a9-4f7e-8d5c-4b3a2f1e0d9c',
    'e3f4a1b2-c3d4-4e5f-8a9b-0c1d2e3f4a1b',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'اختبار تحديد نوع البشرة',
    'اختبار تقييمي فني لفحص معلوماتك في تحديد خصائص نوع البشرة واختيار الروتين والمكونات المناسبة.',
    70,
    15,
    5,
    true
  )
  ON CONFLICT (lesson_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    pass_percentage = EXCLUDED.pass_percentage,
    time_limit_minutes = EXCLUDED.time_limit_minutes,
    max_attempts = EXCLUDED.max_attempts,
    is_published = EXCLUDED.is_published,
    updated_at = now();

  -- 2. Upsert Questions deterministically
  INSERT INTO public.questions (
    id,
    quiz_id,
    question_text,
    explanation,
    order_index,
    points,
    is_published
  ) VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'f4e3d2c1-b0a9-4f7e-8d5c-4b3a2f1e0d9c',
    'ما هي السمة الرئيسية للبشرة الدهنية مقارنة بالأنواع الأخرى؟',
    'تتميز البشرة الدهنية بإفراز مفرط للزيوت (السي بوم) واتساع المسام الملحوظ خاصة في منطقة T-Zone.',
    0,
    1,
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'f4e3d2c1-b0a9-4f7e-8d5c-4b3a2f1e0d9c',
    'ما الخيار الأنسب للعناية بالبشرة الجافة التي تعاني من ضعف حاجز البشرة؟',
    'البشرة الجافة بحاجة لمرطبات تحتوي على السيراميد والهيالورونيك مع غسول متوازن لحماية الحاجز الطبيعي.',
    1,
    1,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'f4e3d2c1-b0a9-4f7e-8d5c-4b3a2f1e0d9c',
    'كيف يتم تشخيص وتحديد البشرة المختلطة؟',
    'البشرة المختلطة تجمع بين الجفاف في الوجنتين والإفراز الزيتي في منطقة T-Zone (الجبهة والأنف والذقن).',
    2,
    1,
    true
  )
  ON CONFLICT (quiz_id, order_index) DO UPDATE SET
    question_text = EXCLUDED.question_text,
    explanation = EXCLUDED.explanation,
    points = EXCLUDED.points,
    is_published = EXCLUDED.is_published,
    updated_at = now();

  -- 3. Upsert Question Options deterministically (1 correct option per question)
  INSERT INTO public.question_options (id, question_id, option_text, is_correct, order_index) VALUES
  -- Question 1 Options
  ('11111111-1111-4111-8111-111111111101', '11111111-1111-4111-8111-111111111111', 'اتساع المسام ولمعان زيتي مستمر في منطقة T-Zone أو معظم الوجه', true, 0),
  ('11111111-1111-4111-8111-111111111102', '11111111-1111-4111-8111-111111111111', 'جفاف شديد وتقشر مستمر في وجنتي الوجه', false, 1),
  ('11111111-1111-4111-8111-111111111103', '11111111-1111-4111-8111-111111111111', 'احمرار حاد وفوري فور تطبيق أي مستحضر مرطب', false, 2),
  ('11111111-1111-4111-8111-111111111104', '11111111-1111-4111-8111-111111111111', 'عدم وجود أي مسام مرئية في كافة أنحاء الوجه', false, 3),

  -- Question 2 Options
  ('22222222-2222-4222-8222-222222222201', '22222222-2222-4222-8222-222222222222', 'استخدام غسول لطيف متوازن ومرطب يدعم حاجز البشرة بالسيراميد', true, 0),
  ('22222222-2222-4222-8222-222222222202', '22222222-2222-4222-8222-222222222222', 'غسل الوجه بالماء الساخن والصابون القوي عدة مرات يومياً', false, 1),
  ('22222222-2222-4222-8222-222222222203', '22222222-2222-4222-8222-222222222222', 'تجنب المرطبات والزيوت تماماً بدعوى حماية المسام', false, 2),
  ('22222222-2222-4222-8222-222222222204', '22222222-2222-4222-8222-222222222222', 'استخدام مقشرات فيزيائية حادة يومياً لإزالة القشور', false, 3),

  -- Question 3 Options
  ('33333333-3333-4333-8333-333333333301', '33333333-3333-4333-8333-333333333333', 'زيوت زائدة في منطقة T-Zone وجفاف أو اعتدال في منطقة الوجنتين', true, 0),
  ('33333333-3333-4333-8333-333333333302', '33333333-3333-4333-8333-333333333333', 'جفاف متساوٍ ومشدود في كامل الوجه مع غياب تام للزيوت', false, 1),
  ('33333333-3333-4333-8333-333333333303', '33333333-3333-4333-8333-333333333333', 'لمعان زيتي كثيف في كامل أجزاء الوجه بلا استثناء', false, 2),
  ('33333333-3333-4333-8333-333333333304', '33333333-3333-4333-8333-333333333333', 'عدم التأثر نهائياً بأي عوامل جوية أو تغير في المستحضرات', false, 3)
  ON CONFLICT (question_id, order_index) DO UPDATE SET
    option_text = EXCLUDED.option_text,
    is_correct = EXCLUDED.is_correct,
    updated_at = now();

END $$;
