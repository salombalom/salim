/**
 * نص سياسة الخصوصية (عربي / إنجليزي).
 * مسودة أولية — ستُراجع وتُستكمل في المرحلة 7 قبل النشر في المتاجر.
 */
interface Policy {
  title: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
}

export const PRIVACY_POLICY: Record<'ar' | 'en', Policy> = {
  ar: {
    title: 'سياسة الخصوصية لتطبيق دَرْسي',
    updated: 'آخر تحديث: نوفمبر 2026 (مسودة)',
    sections: [
      {
        heading: 'مبدؤنا',
        body: ['«دَرْسي» تطبيق تعليمي مجاني موجّه لطلاب المدارس، ومنهم الأطفال. نجمع أقل قدر ممكن من البيانات، ولا نبيعها، ولا نعرض إعلانات، ولا نستخدم أي أدوات تتبع إعلانية.'],
      },
      {
        heading: 'البيانات التي نجمعها',
        body: [
          'وضع التجربة (بدون حساب): يُحفظ كل شيء على جهازك فقط (الصف، الدور، نتائج الاختبارات، النقاط، المفضلة، وقت الدراسة) ولا يُرسل إلينا.',
          'عند إنشاء حساب: البريد الإلكتروني أو رقم الهاتف لتسجيل الدخول فقط، والصف الدراسي، والدور (طالب أو ولي أمر)، ونتائج الاختبارات ووقت الدراسة لحفظ التقدم.',
          'لا نطلب الاسم الحقيقي للطالب، ولا تاريخ الميلاد، ولا الموقع الجغرافي، ولا الصور، ولا جهات الاتصال.',
        ],
      },
      {
        heading: 'كيف نستخدم البيانات',
        body: ['لحفظ تقدم الطالب وعرضه له، ولعرضه لولي الأمر المرتبط به فقط بعد موافقة الطرفين عبر كود الربط، ولتحسين المحتوى من خلال إحصائيات عامة غير مرتبطة بهوية أي طالب.'],
      },
      {
        heading: 'مشاركة البيانات',
        body: [
          'لا نشارك بيانات الطلاب مع أي جهة لأغراض تسويقية أو إعلانية.',
          'نستخدم خدمة Supabase لتخزين بيانات الحسابات بشكل آمن.',
          'تُعرض فيديوهات الشرح عبر مشغّل YouTube الرسمي، وقد تجمع Google بعض البيانات وفق سياسة خصوصيتها عند تشغيل الفيديو.',
          'تُفتح الكتب المدرسية من روابطها الرسمية في متصفح داخل التطبيق.',
        ],
      },
      {
        heading: 'حقوق الطالب وولي الأمر',
        body: ['يمكن تسجيل الخروج وحذف البيانات المحفوظة على الجهاز في أي وقت من الإعدادات. ويمكن لصاحب الحساب أو ولي الأمر طلب حذف الحساب وكل بياناته نهائياً.'],
      },
      {
        heading: 'التواصل',
        body: ['للاستفسارات أو طلبات حذف البيانات، يُرجى التواصل عبر صفحة التطبيق في متجر التطبيقات.'],
      },
    ],
  },
  en: {
    title: 'Darsi Privacy Policy',
    updated: 'Last updated: November 2026 (draft)',
    sections: [
      {
        heading: 'Our principle',
        body: ['Darsi is a free educational app for school students, including children. We collect as little data as possible, we never sell it, we show no ads, and we use no advertising trackers.'],
      },
      {
        heading: 'Data we collect',
        body: [
          'Guest mode (no account): everything (grade, role, quiz results, points, favourites, study time) is stored only on your device and is never sent to us.',
          'With an account: your email address or phone number (for sign-in only), school grade, role (student or parent), quiz results and study time to save progress.',
          'We do not ask for a student\'s real name, date of birth, location, photos or contacts.',
        ],
      },
      {
        heading: 'How we use data',
        body: ['To save and show the student\'s progress, to show it to a linked parent only after both sides agree using a link code, and to improve content using aggregate statistics that are not tied to any individual student.'],
      },
      {
        heading: 'Sharing',
        body: [
          'We never share student data for marketing or advertising.',
          'We use Supabase to store account data securely.',
          'Explanation videos are shown with the official YouTube player; Google may collect some data under its own privacy policy when a video plays.',
          'Textbooks open from their official links in an in-app browser.',
        ],
      },
      {
        heading: 'Your rights',
        body: ['You can sign out and erase data stored on the device at any time from Settings. The account holder or a parent can request permanent deletion of the account and all its data.'],
      },
      {
        heading: 'Contact',
        body: ['For questions or deletion requests, please contact us through the app\'s store listing page.'],
      },
    ],
  },
};
