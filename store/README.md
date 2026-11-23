# نشر «دَرْسي» في المتاجر

كل ما يلزم لنشر التطبيق في App Store و Google Play: نصوص صفحة المتجر، وإجابات استبيانات الخصوصية والأطفال، والخطوات.

> الوضع الحالي `LOCAL_ONLY = true`: لا حسابات ولا خادم، وكل البيانات على الجهاز. هذا يجعل إجابات الخصوصية أبسط ما يمكن (**لا تُجمع أي بيانات**). إذا فعّلت Supabase قبل النشر، استخدم الإجابات في عمود «مع الحسابات».

---

## 1) ما تحتاجه منك (لا أستطيع فعله نيابةً عنك)
| المطلوب | أين |
|---|---|
| حساب Apple Developer (99 دولاراً سنوياً) | developer.apple.com |
| حساب Google Play Console (25 دولاراً مرة واحدة) | play.google.com/console |
| بريد تواصل للدعم يظهر في صفحة المتجر (تطلبه المتاجر إلزامياً) | صفحة التطبيق في كل متجر |
| رابط عام لسياسة الخصوصية | ارفع `store/privacy-policy.html` على أي استضافة ثابتة (مثل GitHub Pages أو Netlify) |
| تجربة التطبيق على جهاز حقيقي (آيفون وأندرويد) | Expo Go أو نسخة preview |

## 2) بناء النسخة ورفعها
```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview      # APK للتجربة على أندرويد
npx eas-cli build --platform all --profile production        # النسخ النهائية للمتاجر
npx eas-cli submit --platform ios --latest                   # رفع إلى App Store Connect
npx eas-cli submit --platform android --latest               # رفع إلى Google Play
```
- المعرّف: `om.darsi.app` (iOS و Android). رقم الإصدار يزيد تلقائياً مع كل بناء `production`.
- التحديثات الصغيرة (نصوص، أسئلة، ملخصات) تصل دون مراجعة جديدة عبر `npm run publish:preview` بعد تحويل القناة إلى `production`.
- الأيقونة وشاشة البداية: `assets/images/` (تُولَّد من `npm run icons`).

## 3) نصوص صفحة المتجر

### العربية
- **الاسم:** دَرْسي
- **العنوان الفرعي (30 حرفاً):** دروسك واختباراتك مجاناً
- **الكلمات المفتاحية:** تعليم,عمان,مناهج,اختبارات,واجبات,رياضيات,علوم,عربي,إنجليزي,مراجعة,طلاب,مدرسة
- **الوصف المختصر (Google Play، 80 حرفاً):** مراجعة مجانية لمناهج سلطنة عُمان من الصف الأول إلى الثاني عشر، بلا إعلانات.
- **الوصف:**

> «دَرْسي» رفيقك المجاني لمراجعة دروس المدرسة في سلطنة عُمان، من الصف الأول إلى الثاني عشر، في كل المواد.
>
> **لكل درس:**
> • أهداف واضحة وملخص يجمع أهم الأفكار والمصطلحات، مع تصديره PDF
> • اختبار قصير متنوع: اختيار من متعدد، وصح أو خطأ، وأكمل الفراغ، وترتيب الكلمات
> • أسئلة رياضيات متجددة في كل مرة
> • مقاطع شرح مختارة من قنوات تعليمية موثوقة
> • رابط الكتاب المدرسي الرسمي من موقع الوزارة
>
> **تعلّم بذكاء:**
> • راجع أخطاءك في مكان واحد حتى تتقنها
> • نقاط ونجوم وسلسلة أيام تحفّزك على الاستمرار
> • تقرير لولي الأمر: وقت الدراسة والدرجات في كل مادة والدروس التي تحتاج مراجعة
>
> **مجاني بالكامل وآمن للأطفال:**
> لا إعلانات، ولا اشتراكات، ولا مشتريات داخل التطبيق، ولا أدوات تتبع. يعمل بدون حساب، ويُحفظ تقدّمك على جهازك.
>
> المحتوى أصلي للمراجعة والتدريب، ولا يغني عن الكتاب المدرسي ولا ينسخ منه.

### English
- **Name:** Darsi – دَرْسي
- **Subtitle:** Free lessons & quizzes for Oman
- **Short description:** Free revision for Oman's school curriculum, grades 1–12. No ads.
- **Description:**

> Darsi is a free study companion for school students in the Sultanate of Oman, grades 1 to 12, across all subjects.
>
> Every lesson has clear objectives, a summary of key ideas and terms (exportable as PDF), a short quiz (multiple choice, true/false, fill in the blank, word order), fresh maths questions every time, explanation videos from trusted educational channels, and a link to the official textbook.
>
> Review your mistakes until you master them, earn points and stars, keep your daily streak, and share a progress report with your parents.
>
> Completely free and safe for children: no ads, no subscriptions, no in-app purchases and no trackers. Works without an account; progress stays on your device.

- **الفئة:** Education (التعليم). **السعر:** مجاني.

## 4) لقطات الشاشة
في `store/screenshots/` لقطات جاهزة بمقاس 1290×2796 (iPhone 6.7") للشاشات الرئيسية، أعد توليدها بعد أي تغيير في التصميم:
```bash
EXPO_OFFLINE=1 npx expo export --platform web && node tools/store-screenshots.js
```
Google Play يقبل نفس اللقطات (بين 320 و3840 بكسل). يُفضّل أيضاً لقطات من جهاز حقيقي.

## 5) استبيانات الخصوصية

### App Store — App Privacy
| السؤال | الوضع المحلي (الحالي) | مع الحسابات (Supabase) |
|---|---|---|
| Data collection | **Data Not Collected** | Contact Info: Email/Phone (App Functionality, Linked, لا تتبع) · Usage Data: Product Interaction (App Functionality, Linked) · User Content: Other (نتائج الاختبارات) |
| Tracking | لا | لا |
| Privacy manifest | موجود في `app.json` (`ios.privacyManifests`) | نفسه |

### Google Play — Data safety
| السؤال | الوضع المحلي | مع الحسابات |
|---|---|---|
| Does your app collect or share user data? | No | Yes: Email/Phone + App activity، لا مشاركة مع أطراف ثالثة |
| Is data encrypted in transit? | — | Yes (HTTPS) |
| Can users request deletion? | — | Yes: داخل التطبيق (حذف الحساب) |
| Ads | No ads | No ads |

### الأطفال
- **Google Play → Target audience:** اختر الفئات من 6 إلى 18 (أو «13+» إن أردت تجنّب برنامج Families). التطبيق مهيأ لبرنامج **Designed for Families**: لا إعلانات، ولا معرّف إعلاني (`AD_ID` محظور)، والروابط الخارجية خلف بوابة لولي الأمر.
- **App Store → Kids Category (اختياري):** الفئة «6–8» أو «9–11». الشروط محققة: لا إعلانات، ولا تحليلات من أطراف ثالثة، والروابط الخارجية خلف بوابة لولي الأمر (`components/ParentalGate.tsx`).
- **Age rating:** كل الإجابات «لا» (لا عنف، لا محتوى للبالغين، لا متصفح مفتوح، لا محادثة) ← 4+ (Apple) و Everyone / 3+ (Google).
- **Content rights:** المحتوى أصلي؛ الكتب روابط إلى موقع الوزارة فقط؛ الفيديوهات تُعرض بالمشغّل الرسمي ليوتيوب.

## 6) قائمة فحص قبل الإرسال
- [ ] تجربة كاملة على آيفون وأندرويد: الاختبار، الملخص وتصديره PDF، الفيديو، فتح الكتاب، تقرير ولي الأمر.
- [ ] مراجعة الأسئلة (`npm run questions -- export`) والملخصات (`npm run summaries -- stats`). عند تفعيل Supabase لا يظهر للطلاب إلا المعتمد.
- [ ] نشر `store/privacy-policy.html` على رابط عام ووضعه في المتجرين.
- [ ] إضافة بريد الدعم في المتجرين.
- [ ] رفع لقطات الشاشة والأيقونة (1024×1024 من `assets/images/icon.png`).
- [ ] في App Store Connect: Export Compliance = No (مضبوط في `app.json`).
- [ ] إطفاء خيار «عرض الأسئلة غير المراجَعة» افتراضياً إذا فعّلت Supabase (يحدث تلقائياً في نسخة المتجر).
