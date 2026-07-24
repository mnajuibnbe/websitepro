# TASK AUTH-001 REPORT

## الملفات المعدلة
- `src/contexts/AuthContext.tsx`: تم إزالة نظام المصادقة المحلي بالكامل، والاعتماد بشكل حصري على `supabase.auth` كمصدر وحيد للحقيقة (Single Source of Truth).
- `src/pages/LoginPage.tsx`: تم إزالة استدعاء `supabase.auth.signInWithPassword` المباشر والاعتماد على الدالة `login` المقدمة من `useAuth`.
- `src/pages/RegisterPage.tsx`: تم إزالة الاستدعاء المباشر وتعديل الواجهة لتنبيه المستخدم إذا كانت هناك رسالة تفعيل بريد إلكتروني ضرورية (`requiresEmailConfirmation`).
- `src/pages/MyCourses.tsx`, `src/pages/LessonPlayer.tsx`, `src/pages/Dashboard.tsx`, `src/pages/admin/AdminDashboard.tsx`: تم استبدال القراءة المباشرة من `supabase.auth.getUser` باستخدام الجلسة والمستخدم من `useAuth()`.
- `src/components/dashboard/Sidebar.tsx`, `src/components/dashboard/ContinueLearning.tsx`, `src/components/dashboard/MyCoursesList.tsx`, `src/components/course-detail/EnrollmentCard.tsx`: تم إزالة القراءة المباشرة من Supabase والاعتماد على `useAuth()`.

## التدفق القديم
كان النظام يعمل بآليتين مصادقة متوازيتين: 
1. تسجيل دخول/حساب في Supabase من خلال الصفحات مباشرة.
2. استدعاء دوال وهمية (`apiLogin`, `apiRegister`) لتحديث السياق المحلي (`AuthContext`) وحفظ `auth_token` نصي في الـ `localStorage`.
هذا التدفق أدى إلى أخطاء ومزامنة مفقودة عند انتهاء جلسات Supabase أو تحديث الصفحة.

## التدفق الجديد
- يتم المصادقة عبر `AuthContext` الذي يتواصل حصراً مع `supabase.auth`.
- يتلقى سياق التطبيق تحديثات حالة الجلسة (Login, Logout, Refresh) تلقائياً عبر `supabase.auth.onAuthStateChange`.
- لا يوجد `auth_token` محلي وهمي بعد الآن، بل يتم توفير الـ `access_token` الحقيقي الخاص بـ Supabase ضمن السياق.

## User Mapping
تم إنشاء دالة `mapSupabaseUserToLocalUser` في `AuthContext.tsx` تقوم بتحويل شكل بيانات مستخدم Supabase إلى نفس واجهة `User` المتوقعة من قِبل التطبيق، مع تعبئة الاسم (عن طريق `user_metadata.name`، أو اقتطاعه من البريد الإلكتروني)، والدور (الافتراضي `student` ما لم يكن محدداً بشكل صريح).

## Session Lifecycle & Token Migration
- **تهيئة:** عند البدء، يتم طلب `supabase.auth.getSession()` وتهيئة الجلسة.
- **تحديثات:** يتم مراقبة أي تغيير عبر `onAuthStateChange`.
- **تنظيف:** يتم إزالة `auth_token` القديم مباشرة عند بدء `AuthContext`.
- **استخدامات الـ Token:** تم استبدال الـ Mock token الذي كان يستخرج بواسطة الدوال بـ `session.access_token` الممرر عبر الـ Context. 

## نتائج البحث (بعد التنفيذ)
- لم تعد توجد أي إشارة للدوال `apiLogin` و `apiRegister` في سياق المصادقة (باقية فقط ككود غير مستخدم في `api.ts`).
- جميع استخدامات `auth_token` أو `localStorage` في سياق المصادقة انتهت، باستثناء سطر تنظيف الرمز القديم.
- استدعاءات `supabase.auth.signInWithPassword`، `signUp`، `signOut` و `getSession` محصورة الآن فقط في `AuthContext.tsx` بالإضافة لصفحات استعادة كلمة المرور المسموح بها (`UpdatePassword` و `ForgotPassword`).

## نتائج Lint و Build
- **Lint**: نجح تماماً بدون أي أخطاء (`0 errors`).
- **Build**: تم بناء المشروع بنجاح.

## الاختبارات المنفذة والمتطلبة
- **منفذة برمجياً:**
  - التحقق من تمرير `user` و `session` بشكل صحيح إلى المكونات عبر الـ Context.
  - نجاح البناء (Lint + Build) يضمن سلامة الأنواع وعدم كسر الـ UI.
- **اختبارات تحتاج تنفيذًا يدويًا عبر المتصفح:**
  1. التسجيل مع Email Confirmation مفعّل وغير مفعّل.
  2. تسجيل الخروج بعد التسجيل.
  3. تسجيل الدخول بنفس البريد وكلمة المرور.
  4. استعادة جلسة Dashboard عند الـ Refresh.
  5. الدخول بكلمة مرور خاطئة (للتأكد من معالجة الأخطاء).

## المخاطر المتبقية
- **البيانات الوهمية:** بعض دوال `api.ts` لا تزال تعتمد على بيانات وهمية (`saveProgress` وغيرها). هذه الدوال تقبل الآن الـ Token الصحيح من Supabase، لكنها لم تُربط بعد بجداول قواعد البيانات الفعلية، مما يعني أن التقدم الفعلي لا يحفظ بشكل دائم في السحابة وإنما فقط يتم محاكاته.
- **الصلاحيات (Admin):** التحقق من المسؤول مازال يعتمد على إيميل صلب (hardcoded) في `AdminDashboard.tsx`، وسيتطلب ذلك معالجة في مهمة RBAC لاحقة كما هو مدرج بالـ Backlog.
