/**
 * إدارة فيديوهات الشرح في الوضع المحلي (بدون Supabase).
 * الملف: seed/media/videos.json — لا يظهر للطلاب إلا ما حالته approved.
 *
 *   npm run videos -- fetch [--pages 20]      جلب الجديد من القنوات المفعّلة واقتراح الدروس (يحتاج YOUTUBE_API_KEY)
 *   npm run videos -- list [pending|approved|rejected]
 *   npm run videos -- approve <youtubeId> [lessonId]   (بدون lessonId يُعتمد الدرس المقترح)
 *   npm run videos -- approve-suggested [--min 0.8]    اعتماد كل اقتراح درجته ≥ الحد
 *   npm run videos -- reject <youtubeId>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { CHANNELS } from '../seed/media/channels';
import type { VideoEntry } from '../seed/media/types';
import { seedDatabase } from '../seed';
import { matchVideo, type LessonRef } from '../supabase/functions/_shared/videoMatch';
import { collectNewVideos, createYouTube, resolveChannel } from '../supabase/functions/_shared/youtube';

const FILE = join(__dirname, '..', 'seed', 'media', 'videos.json');
const load = (): VideoEntry[] => JSON.parse(readFileSync(FILE, 'utf8'));
const save = (v: VideoEntry[]) => writeFileSync(FILE, JSON.stringify(v, null, 2) + '\n');

const lessons: LessonRef[] = seedDatabase.subjects.flatMap((s) =>
  s.units.flatMap((u) =>
    u.lessons.map((l) => ({ id: l.id, title: l.title, unitTitle: u.title, unitOrder: u.order, term: u.term, grade: s.grade, subject: s.key })),
  ),
);
const lessonIds = new Set(lessons.map((l) => l.id));
const lessonTitle = (id: string | null) => (id ? (lessons.find((l) => l.id === id)?.title ?? '?') : '—');

function arg(name: string, fallback: string) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
}

async function fetchCmd() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('ضع YOUTUBE_API_KEY في ملف .env أو في متغير البيئة.');
  const active = CHANNELS.filter((c) => c.active && (c.channelId || c.handle));
  if (!active.length) throw new Error('لا توجد قناة مفعّلة. عدّل seed/media/channels.ts (channelId أو handle و active: true).');
  const yt = createYouTube(key);
  const videos = load();
  const known = new Set(videos.map((v) => v.youtubeId));
  let added = 0;
  for (const ch of active) {
    const r = await resolveChannel(yt, { channelId: ch.channelId, handle: ch.handle });
    console.log(`القناة: ${r.title} (${r.channelId})`);
    const fresh = await collectNewVideos(yt, r.uploadsPlaylistId, async (ids) => new Set(ids.filter((id) => known.has(id))), Number(arg('--pages', '4')));
    for (const v of fresh) {
      const m = matchVideo({ title: v.title, description: v.description }, lessons);
      videos.push({
        youtubeId: v.youtubeId,
        title: v.title,
        channelKey: ch.key,
        publishedAt: v.publishedAt,
        durationSec: v.durationSec,
        thumbnailUrl: v.thumbnailUrl,
        suggestedLessonId: m.lessonId,
        matchScore: m.score,
        lessonId: null,
        status: 'pending',
      });
      known.add(v.youtubeId);
      added++;
    }
  }
  save(videos);
  const suggested = videos.filter((v) => v.status === 'pending' && v.suggestedLessonId).length;
  console.log(`أُضيف ${added} فيديو جديد بانتظار الموافقة (${suggested} لها درس مقترح). استهلاك الحصة: ${yt.quota} وحدة.`);
}

function listCmd(status = 'pending') {
  const rows = load().filter((v) => v.status === status);
  for (const v of rows) {
    console.log(`${v.youtubeId}  [${v.matchScore.toFixed(2)}]  ${v.title}\n   → ${v.lessonId ?? v.suggestedLessonId ?? '—'}  ${lessonTitle(v.lessonId ?? v.suggestedLessonId)}`);
  }
  console.log(`\n${rows.length} فيديو (${status})`);
}

function setStatus(id: string, status: 'approved' | 'rejected', lessonId?: string) {
  const videos = load();
  const v = videos.find((x) => x.youtubeId === id);
  if (!v) throw new Error(`لا يوجد فيديو بالمعرّف ${id}`);
  if (status === 'approved') {
    const target = lessonId ?? v.lessonId ?? v.suggestedLessonId;
    if (!target || !lessonIds.has(target)) throw new Error('حدد درساً صحيحاً: npm run videos -- approve <youtubeId> <lessonId>');
    v.lessonId = target;
  }
  v.status = status;
  save(videos);
  console.log(`${status === 'approved' ? 'اعتُمد' : 'رُفض'}: ${v.title}${status === 'approved' ? ` → ${lessonTitle(v.lessonId)}` : ''}`);
}

function approveSuggested(min: number) {
  const videos = load();
  let n = 0;
  for (const v of videos) {
    if (v.status === 'pending' && v.suggestedLessonId && v.matchScore >= min) {
      v.status = 'approved';
      v.lessonId = v.suggestedLessonId;
      n++;
    }
  }
  save(videos);
  console.log(`اعتُمد ${n} فيديو (درجة المطابقة ≥ ${min}).`);
}

async function main() {
  const [cmd, a, b] = process.argv.slice(2).filter((x, i, all) => !x.startsWith('--') && !(i > 0 && all[i - 1].startsWith('--')));
  switch (cmd) {
    case 'fetch':
      return fetchCmd();
    case 'list':
      return listCmd(a);
    case 'approve':
      return setStatus(a, 'approved', b);
    case 'reject':
      return setStatus(a, 'rejected');
    case 'approve-suggested':
      return approveSuggested(Number(arg('--min', '0.8')));
    default:
      console.log(readFileSync(__filename, 'utf8').split('*/')[0]);
  }
}

main().catch((e) => {
  console.error(`خطأ: ${e.message}`);
  process.exit(1);
});
