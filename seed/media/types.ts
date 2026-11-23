/** أنواع ملفات الوسائط المحلية (الكتب، القنوات، الفيديوهات) */

export type LicenseStatus = 'link_only' | 'permission_granted';

export interface TextbookEntry {
  /** مثل g5-math */
  subjectId: string;
  /** الفصل الدراسي، أو null إذا كان الكتاب للعام كاملاً */
  term: 1 | 2 | null;
  /** رقم الجزء إن وُجد */
  part?: number | null;
  title: string;
  /** رابط المصدر الرسمي (https فقط) — لا نرفع ملفات الكتب */
  officialUrl: string;
  licenseStatus: LicenseStatus;
}

export interface ChannelEntry {
  /** معرّف داخلي ثابت */
  key: string;
  name: string;
  /** واحد على الأقل: معرّف القناة (UC…) أو اسمها المختصر (@handle بدون @) */
  channelId?: string;
  handle?: string;
  url: string;
  active: boolean;
}

export type VideoStatus = 'pending' | 'approved' | 'rejected';

export interface VideoEntry {
  youtubeId: string;
  title: string;
  channelKey: string;
  publishedAt: string | null;
  durationSec: number | null;
  thumbnailUrl: string | null;
  /** اقتراح المطابقة الآلية */
  suggestedLessonId: string | null;
  matchScore: number;
  /** الدرس المعتمد (يُضبط عند الموافقة) */
  lessonId: string | null;
  /** لا يظهر للطلاب إلا approved */
  status: VideoStatus;
}
