/**
 * نص سياسة الخصوصية (عربي / إنجليزي) — يُعرض في التطبيق، ويُولَّد منه store/privacy-policy.html
 * (npm run store:privacy) لنشره على رابط عام تطلبه المتاجر.
 * عند أي تغيير في البيانات التي يجمعها التطبيق: حدّث هذا الملف وتاريخ التحديث، وأعد توليد الصفحة.
 */
export interface Policy {
  title: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
}

export const PRIVACY_UPDATED = '2026-11-23';

export const PRIVACY_POLICY: Record<'ar' | 'en', Policy> = {
  ar: {
    title: 'سياسة الخصوصية لتطبيق دَرْسي',
    updated: 'آخر تحديث: 23 نوفمبر 2026',
    sections: [
      {
        heading: 'مبدؤنا',
        body: [
          '«دَرْسي» تطبيق تعليمي مجاني لطلاب المدارس في سلطنة عُمان من الصف الأول إلى الثاني عشر، ومنهم أطفال.',
          'نجمع أقل قدر ممكن من البيانات، ولا نبيعها، ولا نعرض إعلانات، ولا نستخدم أي أدوات تحليل أو تتبع إعلانية، ولا نشتري أو نبيع أي شيء داخل التطبيق.',
        ],
      },
      {
        heading: 'الاستخدام بدون حساب',
        body: [
          'يمكن استخدام التطبيق كاملاً بدون حساب. في هذه الحالة يُحفظ كل شيء على جهازك فقط: الصف، والصفة (طالب أو ولي أمر)، والاسم المستعار الاختياري، ونتائج الاختبارات، والنقاط، والمحفوظات، ووقت الدراسة. لا يُرسل شيء من ذلك إلينا.',
        ],
      },
      {
        heading: 'البيانات عند إنشاء حساب',
        body: [
          'البريد الإلكتروني أو رقم الهاتف: لتسجيل الدخول برمز مؤقت فقط، ولا نستخدمه للتسويق.',
          'الصف الدراسي، والصفة (طالب أو ولي أمر)، واسم مستعار اختياري (حتى 20 حرفاً).',
          'نتائج الاختبارات والإجابات ووقت الدراسة والنقاط والمحفوظات: لحفظ التقدّم ومزامنته بين أجهزتك.',
          'لا نطلب الاسم الحقيقي، ولا تاريخ الميلاد، ولا الموقع، ولا الصور، ولا جهات الاتصال، ولا نصل إلى الكاميرا أو الميكروفون.',
        ],
      },
      {
        heading: 'ولي الأمر',
        body: [
          'يرى ولي الأمر تقدّم ابنه فقط إذا أنشأ الطالب رمز ربط من تطبيقه وأعطاه لولي أمره. الرمز صالح 24 ساعة ويُستخدم مرة واحدة.',
          'يرى ولي الأمر تقريراً مجمّعاً فقط: وقت الدراسة، ومتوسط الدرجات لكل مادة، والدروس التي تحتاج مراجعة. لا يرى إجابات الطالب.',
          'يمكن لأي من الطرفين إلغاء الربط في أي وقت.',
          'تصدير التقرير أو الملخص بصيغة PDF يتم على الجهاز، ولا يُرسل الملف إلا لمن تختار مشاركته معه.',
        ],
      },
      {
        heading: 'المحتوى والخدمات الخارجية',
        body: [
          'نخزّن بيانات الحسابات في Supabase بشكل آمن، ولا يستطيع أي مستخدم الاطلاع على بيانات غيره.',
          'تُعرض فيديوهات الشرح عبر مشغّل YouTube الرسمي، وقد تجمع Google بعض البيانات وفق سياسة خصوصيتها عند تشغيل الفيديو. لا نرسل إلى YouTube أي بيانات عن الطالب.',
          'تُفتح الكتب المدرسية من روابطها الرسمية في موقع وزارة التعليم بعد سؤال تحقق موجّه لولي الأمر. وكذلك روابط القنوات.',
          'ملخصات الدروس يكتبها نموذج ذكاء اصطناعي (Claude) من محتوى الدرس فقط، ويراجعها مشرف قبل نشرها. لا تُرسل أي بيانات عن الطلاب إلى خدمة الذكاء الاصطناعي.',
        ],
      },
      {
        heading: 'الاحتفاظ بالبيانات وحذفها',
        body: [
          'بدون حساب: امسح بياناتك من «حسابي ← مسح بياناتي من هذا الجهاز»، أو احذف التطبيق.',
          'مع حساب: احذف حسابك وكل بياناتك نهائياً من «حسابي ← حذف الحساب نهائياً». يتم الحذف فوراً ولا يمكن التراجع عنه.',
          'نحتفظ ببيانات الحساب ما دام الحساب موجوداً فقط.',
        ],
      },
      {
        heading: 'الأطفال',
        body: [
          'صُمّم التطبيق للطلاب، ومنهم من هم دون 13 عاماً. لا إعلانات، ولا مشتريات، ولا محادثات بين المستخدمين، ولا مشاركة لأي محتوى يكتبه الطالب مع الآخرين.',
          'الروابط الخارجية محمية بسؤال تحقق موجّه لولي الأمر.',
          'لولي الأمر أن يطلب الاطلاع على بيانات ابنه أو حذفها، وأن يحذف الحساب من داخل التطبيق.',
        ],
      },
      {
        heading: 'التواصل',
        body: ['للاستفسارات أو طلبات البيانات، تواصل معنا عبر وسيلة التواصل المذكورة في صفحة التطبيق في متجر التطبيقات.'],
      },
    ],
  },
  en: {
    title: 'Darsi Privacy Policy',
    updated: 'Last updated: 23 November 2026',
    sections: [
      {
        heading: 'Our principle',
        body: [
          'Darsi is a free educational app for school students in the Sultanate of Oman, grades 1 to 12, including children.',
          'We collect as little data as possible. We never sell it, we show no ads, we use no analytics or advertising trackers, and there are no in-app purchases.',
        ],
      },
      {
        heading: 'Using the app without an account',
        body: [
          'The whole app works without an account. In that case everything stays on your device only: grade, role (student or parent), an optional nickname, quiz results, points, saved items and study time. None of it is sent to us.',
        ],
      },
      {
        heading: 'Data with an account',
        body: [
          'Email address or phone number: only to sign in with a one-time code. We never use it for marketing.',
          'School grade, role (student or parent) and an optional nickname (up to 20 characters).',
          'Quiz results, answers, study time, points and saved items: to save progress and sync it across your devices.',
          'We do not ask for a real name, date of birth, location, photos or contacts, and the app does not use the camera or microphone.',
        ],
      },
      {
        heading: 'Parents',
        body: [
          'A parent can see a student\'s progress only after the student creates a link code in their app and gives it to the parent. The code is valid for 24 hours and works once.',
          'The parent sees an aggregate report only: study time, average score per subject and lessons that need review. Parents do not see the student\'s answers.',
          'Either side can remove the link at any time.',
          'Exporting a report or summary as PDF happens on the device; the file is shared only with whoever you choose.',
        ],
      },
      {
        heading: 'Content and third-party services',
        body: [
          'Account data is stored securely with Supabase; no user can access another user\'s data.',
          'Explanation videos play in the official YouTube player; Google may collect some data under its own privacy policy when a video plays. We send no student data to YouTube.',
          'Textbooks open from their official links on the Ministry of Education website after a parental check, and so do channel links.',
          'Lesson summaries are written by an AI model (Claude) from lesson content only and reviewed by a supervisor before publishing. No student data is ever sent to the AI service.',
        ],
      },
      {
        heading: 'Retention and deletion',
        body: [
          'Without an account: erase your data from "Profile → Erase my data from this device", or uninstall the app.',
          'With an account: delete your account and all its data permanently from "Profile → Delete account". Deletion is immediate and cannot be undone.',
          'We keep account data only while the account exists.',
        ],
      },
      {
        heading: 'Children',
        body: [
          'The app is designed for students, including children under 13. There are no ads, no purchases, no chat between users, and nothing a student writes is shared with others.',
          'External links are protected by a parental check.',
          'A parent may request access to or deletion of their child\'s data, and can delete the account from inside the app.',
        ],
      },
      {
        heading: 'Contact',
        body: ['For questions or data requests, contact us through the contact method listed on the app\'s store page.'],
      },
    ],
  },
};
