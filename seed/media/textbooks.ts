import type { TextbookEntry } from './types';

/**
 * روابط الكتب المدرسية الرسمية — نضع الرابط فقط، ولا نرفع ملفات الكتب.
 * أضف رابطاً لكل مادة وفصل من المصدر الرسمي لوزارة التربية والتعليم، مثال:
 *
 *   { subjectId: 'g5-math', term: 1, title: 'الرياضيات — الصف الخامس — الفصل الأول',
 *     officialUrl: 'https://…', licenseStatus: 'link_only' },
 *
 * licenseStatus: 'link_only' (الافتراضي) أو 'permission_granted' (بعد الحصول على إذن رسمي برفع الملف).
 */
export const TEXTBOOKS: TextbookEntry[] = [];
