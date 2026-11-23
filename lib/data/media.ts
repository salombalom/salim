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

export function getLessonVideos(lessonId: string): LessonVideo[] {
  const out = new Map<string, LessonVideo>();
  for (const g of Object.values(useContent.getState().grades)) {
    for (const v of g?.videos ?? []) {
      if (v.lessonId !== lessonId) continue;
      out.set(v.youtubeId, {
        youtubeId: v.youtubeId,
        dbId: v.dbId,
        title: v.title,
        durationSec: v.durationSec,
        thumbnailUrl: v.thumbnailUrl ?? thumbnailFor(v.youtubeId),
        channelName: v.channelName,
        channelUrl: v.channelUrl,
      });
    }
  }
  for (const v of VIDEOS) {
    if (v.status !== 'approved' || v.lessonId !== lessonId || out.has(v.youtubeId)) continue;
    const ch = channelByKey.get(v.channelKey);
    out.set(v.youtubeId, {
      youtubeId: v.youtubeId,
      title: v.title,
      durationSec: v.durationSec,
      thumbnailUrl: v.thumbnailUrl ?? thumbnailFor(v.youtubeId),
      channelName: ch?.name ?? '',
      channelUrl: ch?.url || (ch?.channelId ? `https://www.youtube.com/channel/${ch.channelId}` : ch?.handle ? `https://www.youtube.com/@${ch.handle}` : ''),
    });
  }
  return [...out.values()];
}

export function getTextbook(subjectId: string, term: number): Textbook | null {
  for (const g of Object.values(useContent.getState().grades)) {
    const t = g?.textbooks?.find((x) => x.subjectId === subjectId && x.term === term);
    if (t) return { title: t.title, officialUrl: t.officialUrl, licenseStatus: t.licenseStatus };
  }
  const local = TEXTBOOKS.find((x) => x.subjectId === subjectId && x.term === term);
  return local ? { title: local.title, officialUrl: local.officialUrl, licenseStatus: local.licenseStatus } : null;
}

export function formatDuration(sec: number | null): string {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}
