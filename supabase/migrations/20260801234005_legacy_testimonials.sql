-- Preserve genuine testimonials collected on Tutiba's original course platform
-- without conflating them with reviews submitted through the current platform.
CREATE TABLE public.legacy_testimonials (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reviewer_name TEXT NOT NULL CHECK (length(btrim(reviewer_name)) BETWEEN 2 AND 120),
  quote TEXT NOT NULL CHECK (length(btrim(quote)) BETWEEN 10 AND 4000),
  source TEXT NOT NULL DEFAULT 'legacy_import' CHECK (source = 'legacy_import'),
  source_platform TEXT NOT NULL DEFAULT 'Tutiba original course platform',
  source_url TEXT NOT NULL DEFAULT 'https://tutiba.vercel.app/',
  display_order SMALLINT NOT NULL UNIQUE CHECK (display_order > 0),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.legacy_testimonials IS
  'Read-only public testimonials collected on Tutiba''s original course platform before the current review workflow existed.';
COMMENT ON COLUMN public.legacy_testimonials.source IS
  'Explicit provenance flag. These rows did not originate in the current course_reviews submission and moderation flow.';

ALTER TABLE public.legacy_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published legacy testimonials are publicly readable"
  ON public.legacy_testimonials
  FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);

REVOKE ALL ON TABLE public.legacy_testimonials FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.legacy_testimonials TO anon, authenticated;

INSERT INTO public.legacy_testimonials (reviewer_name, quote, display_order)
VALUES
  ('Jinan Sakhen', $testimonial$من مبدأ انه  لا يشكر الله من لا يشكر الناس حابة دكتورة اتشكرك على الدورة الأكثر من رائعة ، شرح واضح ومفصل معلومات قيمّة  مستحيل الاقي  دورات عنا بتنعرض بهاد الشكل .
وكمان شكرا على صدقك وطيب معاملتك
وانا سعيدة جدا انه التقيت فيك وتشرفت بمعرفتك   ❤$testimonial$, 1),
  ('Dalia Fadil', $testimonial$د. آيه انا خلصت المحاضره الوقتي
جزاكي الله كل خير ونفع بك من الكورسات اللي استفدت منها جدا جدا وغيرت شغلي كتير بعلم حقيقي ونافع

اتمني اكون مع حضرتك في اي كورس تاني ومحتوي جديد
زادك الله علما ♥️$testimonial$, 2),
  ('Zahraa Hussein Neamah', $testimonial$Honestly! I benefited a lot, the information is valuable, the explanation is clear and understandable, and the method of explanation is very wonderful. I say it honestly, only the lucky ones are those who have such a course.$testimonial$, 3),
  ('Tamarah Abbas Allawi', $testimonial$مشكورة حبيبتي الغاليه دكتورة ايه كنتي رائعه بكل معلوماتك وشرحك وجدا استفاديت منك..اتمنالك كل الموفقيه والرقي والف تحية الك مني من العراق ابعثها بباقات ورد إلى مصر الحبيبه...واكيد اني رح اكون بكل الدبلومات الي حضرتك تقدميها 🥰😘$testimonial$, 4),
  ('Dr. Mahtab Hossain', $testimonial$Nice course with adequate information . Easily explained . lot of slides with good image quality$testimonial$, 5),
  ('Eman Farooq', $testimonial$اهم شئ فالدبلومة هو ترتيب المحتوى بشذل يخليك فاهم
رغم انى لسة مخلصتش نص الدبلومة بس مستمتع و متنور اخيرا الحمد لله 😍♥️
شكرا على المجهود يا دكتورة بارك الله فيكى$testimonial$, 6),
  ('Neven Ahmed', $testimonial$very good I`m starting my cosmetics business and I really like this course you helped me a lot thank you very much$testimonial$, 7),
  ('Kulsum Baig', $testimonial$I really loved it. It is really amazing. I loved how you explain everything and then gives products formulations just amazing. And ofcourse I am gonna connect you through every course of yours for sure!$testimonial$, 8);

NOTIFY pgrst, 'reload schema';
