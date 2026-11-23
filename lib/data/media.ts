/**
 * فيديوهات الشرح وروابط الكتب.
 * المصدر: الملفات المحلية في seed/media (الوضع المحلي)، والخادم عند تفعيل Supabase.
 * لا يظهر للطلاب إلا الفيديو المعتمد (approved).
 */
import { CHANNELS, TEXTBOOKS, VIDEOS } from '@/seed/media';

import { useContent } from './contentStore';

export interface LessonVideo {
  youtubeId: string;
  /** معرّف الخادم (إن وُجد) لمزامنة التقييم */
  dbId?: string;
  title: string;
  durationSec: number | null;
  thumbnailUrl: string;
  channelName: string;
  channelUrl: string;
}

export interface Textbook {
  title: string;
  officialUrl: string;
  licenseStatus: 'link_only' | 'permission_granted';
}

const channelByKey = new Map(CHANNELS.map((c) => [c.key, c]));

export const thumbnailFor = (youtubeId: string) => `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`;

function channelUrlOf(key: string) {
  const ch = channelByKey.get(key);
  return ch?.url || (ch?.channelId ? `https://www.youtube.com/channel/${ch.channelId}` : ch?.handle ? `https://www.youtube.com/@${ch.handle}` : '');
}

/** كل الفيديوهات المعتمدة (الخادم أولاً ثم الملفات المحلية) مع درسها ومادتها */
function approvedVideos(): (LessonVideo & { lessonId: string | null; subjectId: string | null })[] {
  const out = new Map<string, LessonVideo & { lessonId: string | null; subjectId: string | null }>();
  for (const g of Object.values(useContent.getState().grades)) {
    for (const v of g?.videos ?? []) {
      out.set(v.youtubeId, {
        youtubeId: v.youtubeId,
        dbId: v.dbId,
        title: v.title,
        durationSec: v.durationSec,
        thumbnailUrl: v.thumbnailUrl ?? thumbnailFor(v.youtubeId),
        channelName: v.channelName,
        channelUrl: v.channelUrl,
        lessonId: v.lessonId,
        subjectId: v.subjectId ?? v.lessonId?.replace(/-u\d+-l\d+$/, '') ?? null,
      });
    }
  }
  for (const v of VIDEOS) {
    if (v.status !== 'approved' || out.has(v.youtubeId)) continue;
    out.set(v.youtubeId, {
      youtubeId: v.youtubeId,
      title: v.title,
      durationSec: v.durationSec,
      thumbnailUrl: v.thumbnailUrl ?? thumbnailFor(v.youtubeId),
      channelName: channelByKey.get(v.channelKey)?.name ?? '',
      channelUrl: channelUrlOf(v.channelKey),
      lessonId: v.lessonId,
      subjectId: v.subjectId ?? v.lessonId?.replace(/-u\d+-l\d+$/, '') ?? null,
    });
  }
  return [...out.values()];
}

const strip = ({ lessonId: _l, subjectId: _s, ...v }: LessonVideo & { lessonId: string | null; subjectId: string | null }): LessonVideo => v;

/** فيديوهات مربوطة بهذا الدرس تحديداً */
export function getLessonVideos(lessonId: string): LessonVideo[] {
  return approvedVideos().filter((v) => v.lessonId === lessonId).map(strip);
}

/** فيديوهات المادة في صفها غير المربوطة بدرس محدد (تظهر في كل دروس المادة) */
export function getSubjectVideos(subjectId: string): LessonVideo[] {
  return approvedVideos().filter((v) => !v.lessonId && v.subjectId === subjectId).map(strip);
}

/** كتب المادة للفصل المحدد (والكتب السنوية التي بلا فصل). الخادم أولاً، ثم الملفات المحلية. */
export function getTextbooks(subjectId: string, term: number): Textbook[] {
  const matches = (x: { subjectId: string; term: number | null }) => x.subjectId === subjectId && (x.term === term || x.term === null);
  for (const g of Object.values(useContent.getState().grades)) {
    const remote = g?.textbooks?.filter(matches) ?? [];
    if (remote.length) return remote.map((t) => ({ title: t.title, officialUrl: t.officialUrl, licenseStatus: t.licenseStatus }));
  }
  return TEXTBOOKS.filter(matches).map((t) => ({ title: t.title, officialUrl: t.officialUrl, licenseStatus: t.licenseStatus }));
}

export function formatDuration(sec: number | null): string {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}
