/**
 * إدارة فيديوهات الشرح في الوضع المحلي (بدون Supabase).
 * الملف: seed/media/videos.json — لا يظهر للطلاب إلا ما حالته approved.
 *
 *   npm run videos -- fetch [--pages 20]      جلب الجديد من القنوات المفعّلة واقتراح الدروس (يحتاج YOUTUBE_API_KEY)
 *   npm run videos -- fetch --feed            بدون مفتاح: آخر 15 فيديو من الخلاصة العامة لكل قناة
 *   npm run videos -- list [pending|approved|rejected]
 *   npm run videos -- approve <youtubeId> [lessonId]   (بدون lessonId: الدرس المقترح، وإلا المادة المقترحة)
 *   npm run videos -- approve-suggested [--min 0.8]    اعتماد كل اقتراح درجته ≥ الحد
 *   npm run videos -- reject <youtubeId>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { CHANNELS } from '../seed/media/channels';
import type { VideoEntry } from '../seed/media/types';
import { seedDatabase } from '../seed';
import { matchVideo, type LessonRef } from '../supabase/functions/_shared/videoMatch';
import { channelFeedUrl, collectNewVideos, createYouTube, parseChannelFeed, resolveChannel, type FetchedVideo } from '../supabase/functions/_shared/youtube';

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
  const useFeed = process.argv.includes('--feed');
  const key = process.env.YOUTUBE_API_KEY;
  if (!useFeed && !key) throw new Error('ضع YOUTUBE_API_KEY في ملف .env، أو استخدم --feed (آخر 15 فيديو بدون مفتاح).');
  const active = CHANNELS.filter((c) => c.active && (c.channelId || c.handle));
  if (!active.length) throw new Error('لا توجد قناة مفعّلة. عدّل seed/media/channels.ts (channelId أو handle و active: true).');
  const yt = key ? createYouTube(key) : null;
  const videos = load();
  const known = new Set(videos.map((v) => v.youtubeId));
  let added = 0;
  for (const ch of active) {
    let fresh: FetchedVideo[];
    if (useFeed) {
      if (!ch.channelId) throw new Error(`الخلاصة تحتاج channelId للقناة ${ch.name}`);
      const res = await fetch(channelFeedUrl(ch.channelId));
      if (!res.ok) throw new Error(`تعذّر قراءة خلاصة ${ch.name}: ${res.status}`);
      fresh = parseChannelFeed(await res.text()).filter((v) => !known.has(v.youtubeId));
      console.log(`القناة: ${ch.name} (الخلاصة العامة)`);
    } else {
      const r = await resolveChannel(yt!, { channelId: ch.channelId, handle: ch.handle });
      console.log(`القناة: ${r.title} (${r.channelId})`);
      fresh = await collectNewVideos(yt!, r.uploadsPlaylistId, async (ids) => new Set(ids.filter((id) => known.has(id))), Number(arg('--pages', '4')));
    }
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
        subjectId: m.subjectId,
        matchScore: m.score,
        lessonId: null,
        status: 'pending',
      });
      known.add(v.youtubeId);
      added++;
    }
  }
  save(videos);
  const pending = videos.filter((v) => v.status === 'pending');
  console.log(
    `أُضيف ${added} فيديو بانتظار الموافقة: ${pending.filter((v) => v.suggestedLessonId).length} لها درس مقترح، و${pending.filter((v) => !v.suggestedLessonId && v.subjectId).length} لها مادة مقترحة.` +
      (yt ? ` استهلاك الحصة: ${yt.quota} وحدة.` : ''),
  );
}

function listCmd(status = 'pending') {
  const rows = load().filter((v) => v.status === status);
  for (const v of rows) {
    const target = v.lessonId ?? v.suggestedLessonId;
    console.log(`${v.youtubeId}  [${v.matchScore.toFixed(2)}]  ${v.title}\n   → ${target ? `درس ${target}: ${lessonTitle(target)}` : v.subjectId ? `مادة ${v.subjectId}` : '—'}`);
  }
  console.log(`\n${rows.length} فيديو (${status})`);
}

function setStatus(id: string, status: 'approved' | 'rejected', lessonId?: string) {
  const videos = load();
  const v = videos.find((x) => x.youtubeId === id);
  if (!v) throw new Error(`لا يوجد فيديو بالمعرّف ${id}`);
  if (status === 'approved') {
    const target = lessonId ?? v.lessonId ?? v.suggestedLessonId;
    if (target && !lessonIds.has(target)) throw new Error(`الدرس غير موجود: ${target}`);
    if (!target && !v.subjectId) throw new Error('حدد درساً: npm run videos -- approve <youtubeId> <lessonId>');
    v.lessonId = target ?? null;
    if (target) v.subjectId = target.replace(/-u\d+-l\d+$/, '');
  }
  v.status = status;
  save(videos);
  console.log(`${status === 'approved' ? 'اعتُمد' : 'رُفض'}: ${v.title}${status === 'approved' ? ` → ${v.lessonId ? lessonTitle(v.lessonId) : `مادة ${v.subjectId}`}` : ''}`);
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
