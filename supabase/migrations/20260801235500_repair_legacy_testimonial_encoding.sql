-- Repair legacy testimonial text if the seed migration was transmitted through
-- a Windows shell that decoded its UTF-8 content using a legacy code page.
UPDATE public.legacy_testimonials
SET quote = $testimonial$من مبدأ انه  لا يشكر الله من لا يشكر الناس حابة دكتورة اتشكرك على الدورة الأكثر من رائعة ، شرح واضح ومفصل معلومات قيمّة  مستحيل الاقي  دورات عنا بتنعرض بهاد الشكل .
وكمان شكرا على صدقك وطيب معاملتك
وانا سعيدة جدا انه التقيت فيك وتشرفت بمعرفتك   ❤$testimonial$
WHERE display_order = 1;

UPDATE public.legacy_testimonials
SET quote = $testimonial$د. آيه انا خلصت المحاضره الوقتي
جزاكي الله كل خير ونفع بك من الكورسات اللي استفدت منها جدا جدا وغيرت شغلي كتير بعلم حقيقي ونافع

اتمني اكون مع حضرتك في اي كورس تاني ومحتوي جديد
زادك الله علما ♥️$testimonial$
WHERE display_order = 2;

UPDATE public.legacy_testimonials
SET quote = $testimonial$Honestly! I benefited a lot, the information is valuable, the explanation is clear and understandable, and the method of explanation is very wonderful. I say it honestly, only the lucky ones are those who have such a course.$testimonial$
WHERE display_order = 3;

UPDATE public.legacy_testimonials
SET quote = $testimonial$مشكورة حبيبتي الغاليه دكتورة ايه كنتي رائعه بكل معلوماتك وشرحك وجدا استفاديت منك..اتمنالك كل الموفقيه والرقي والف تحية الك مني من العراق ابعثها بباقات ورد إلى مصر الحبيبه...واكيد اني رح اكون بكل الدبلومات الي حضرتك تقدميها 🥰😘$testimonial$
WHERE display_order = 4;

UPDATE public.legacy_testimonials
SET quote = $testimonial$Nice course with adequate information . Easily explained . lot of slides with good image quality$testimonial$
WHERE display_order = 5;

UPDATE public.legacy_testimonials
SET quote = $testimonial$اهم شئ فالدبلومة هو ترتيب المحتوى بشذل يخليك فاهم
رغم انى لسة مخلصتش نص الدبلومة بس مستمتع و متنور اخيرا الحمد لله 😍♥️
شكرا على المجهود يا دكتورة بارك الله فيكى$testimonial$
WHERE display_order = 6;

UPDATE public.legacy_testimonials
SET quote = $testimonial$very good I`m starting my cosmetics business and I really like this course you helped me a lot thank you very much$testimonial$
WHERE display_order = 7;

UPDATE public.legacy_testimonials
SET quote = $testimonial$I really loved it. It is really amazing. I loved how you explain everything and then gives products formulations just amazing. And ofcourse I am gonna connect you through every course of yours for sure!$testimonial$
WHERE display_order = 8;
