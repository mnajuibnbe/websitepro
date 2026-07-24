# Toteeba - منصة توتيبا التعليمية

منصة توتيبا هي منصة تعليمية احترافية متخصصة في تقديم دورات متقدمة في مجالات العناية بالبشرة، الشعر، والتركيبات التجميلية. تم تصميم المنصة لتوفير تجربة تعليمية متميزة للمتدربين، بالإضافة إلى لوحة تحكم إدارية متكاملة لإدارة المحتوى والطلاب.

## الميزات التقنية (Tech Stack)

* **الواجهة الأمامية (Frontend):** React (مع TypeScript) و Vite
* **التصميم والتنسيق:** Tailwind CSS مع اعتماد نظام 4px spacing
* **الأيقونات:** Lucide React
* **إدارة الحالة:** React Context API
* **التوجيه (Routing):** Hash Routing لضمان التوافق مع كافة خوادم الاستضافة الثابتة (Static Hosts) دون مشاكل في مسارات URL.

## إعداد المشروع محلياً (Local Setup)

1. **تثبيت الحزم (Install Dependencies):**
   ```bash
   npm install
   ```

2. **ضبط المتغيرات البيئية:**
   قم بنسخ ملف `.env.example` إلى ملف جديد باسم `.env.local` وقم بتعبئة القيم المطلوبة:
   ```bash
   cp .env.example .env.local
   ```

   **المتغيرات المطلوبة (للربط المستقبلي):**
   * `VITE_SUPABASE_URL`: رابط مشروع Supabase الخاص بك.
   * `VITE_SUPABASE_ANON_KEY`: مفتاح الواجهة البرمجية (Anon Key).

3. **تشغيل بيئة التطوير (Run Dev Server):**
   ```bash
   npm run dev
   ```

## دليل النشر (Deployment Guide)

المشروع مبني كـ Single Page Application (SPA) وتم إعداده ليعمل بكفاءة عالية على منصات الاستضافة مثل Vercel و Netlify. وبفضل استخدامنا للـ Hash Routing (الروابط تبدأ بـ `#/`)، لا تحتاج لضبط إعدادات خاصة لإعادة التوجيه (Rewrites) على الخادم.

### النشر على Vercel
1. قم بربط مستودع GitHub الخاص بالمشروع في منصة Vercel.
2. ستتعرف Vercel تلقائياً على أن المشروع يستخدم Vite.
3. **إعدادات البناء (Build Settings):**
   * **Framework Preset:** Vite
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. أضف المتغيرات البيئية (Environment Variables) في إعدادات المشروع على Vercel.
5. اضغط على **Deploy**.

### النشر على Netlify
1. قم بإنشاء موقع جديد (New Site) من Git واربط المستودع.
2. **إعدادات البناء (Build Settings):**
   * **Build command:** `npm run build`
   * **Publish directory:** `dist`
3. أضف المتغيرات البيئية المطلوبة.
4. اضغط على **Deploy Site**.

### ملاحظة حول الروابط (Links & Routing)
تم التأكد من أن كافة الروابط في الموقع تستخدم نظام `Hash` (`#/path`). هذا الأسلوب يضمن أن كافة مسارات الموقع تعمل بسلاسة على بيئات الاستضافة الثابتة دون أخطاء `404 Not Found` عند تحديث الصفحة.

## حقوق الملكية
المشروع مرخص بموجب ترخيص MIT (انظر ملف `LICENSE` لمزيد من التفاصيل).
