/**
 * Edge Function: fetch-videos — تعمل يومياً (pg_cron) لجلب فيديوهات القنوات المعتمدة.
 *
 * لكل قناة مفعّلة: نحدد معرّفها وقائمة uploads (مرة واحدة)، ثم نقرأ الفيديوهات الجديدة فقط،
 * ونقترح الدرس المناسب لكل فيديو، ونحفظه بحالة pending حتى يوافق عليه المسؤول.
 * الاستهلاك عادةً بضع وحدات يومياً من أصل 10,000 مجانية (انظر _shared/youtube.ts).
 *
 * الأسرار: YOUTUBE_API_KEY (supabase secrets set). وتتوفر SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY تلقائياً.
 * الاستدعاء: POST مع Authorization: Bearer <service_role_key>. اختياري: {"maxPages": 20} لجلب أرشيف أكبر أول مرة.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

import { matchVideo, type LessonRef, type SubjectKey } from '../_shared/videoMatch.ts';
import { collectNewVideos, createYouTube, resolveChannel } from '../_shared/youtube.ts';

function isServiceRole(req: Request): boolean {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!token) return false;
  if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role === 'service_role';
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!isServiceRole(req)) return new Response('Forbidden', { status: 403 });

  const key = Deno.env.get('YOUTUBE_API_KEY');
  if (!key) return Response.json({ error: 'YOUTUBE_API_KEY is not set' }, { status: 500 });
  const body = await req.json().catch(() => ({}));
  const maxPages = Math.min(Math.max(Number(body?.maxPages) || 4, 1), 40);

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const yt = createYouTube(key);
  const { data: run } = await db.from('video_fetch_runs').insert({}).select('id').single();

  try {
    const { data: rows, error: lessonErr } = await db
      .from('lessons')
      .select('id, title, units!inner(title, sort, terms!inner(number, subjects!inner(key, grade_id)))');
    if (lessonErr) throw lessonErr;
    // deno-lint-ignore no-explicit-any
    const lessons: LessonRef[] = (rows ?? []).map((l: any) => ({
      id: l.id,
      title: l.title,
      unitTitle: l.units.title,
      unitOrder: l.units.sort,
      term: l.units.terms.number,
      grade: l.units.terms.subjects.grade_id,
      subject: l.units.terms.subjects.key as SubjectKey,
    }));

    const { data: channels, error: chErr } = await db
      .from('channels')
      .select('id, youtube_channel_id, handle, uploads_playlist_id')
      .eq('active', true);
    if (chErr) throw chErr;

    let newVideos = 0;
    let suggested = 0;
    for (const ch of channels ?? []) {
      let uploads = ch.uploads_playlist_id as string | null;
      if (!uploads || !ch.youtube_channel_id) {
        const r = await resolveChannel(yt, { channelId: ch.youtube_channel_id, handle: ch.handle });
        uploads = r.uploadsPlaylistId;
        await db
          .from('channels')
          .update({ youtube_channel_id: r.channelId, uploads_playlist_id: uploads, url: `https://www.youtube.com/channel/${r.channelId}` })
          .eq('id', ch.id);
      }

      const fresh = await collectNewVideos(
        yt,
        uploads,
        async (ids) => {
          const { data } = await db.from('videos').select('youtube_id').in('youtube_id', ids);
          return new Set((data ?? []).map((d) => d.youtube_id as string));
        },
        maxPages,
      );

      const toInsert = fresh.map((v) => {
        const m = matchVideo({ title: v.title, description: v.description }, lessons);
        if (m.lessonId) suggested += 1;
        return {
          youtube_id: v.youtubeId,
          channel_id: ch.id,
          title: v.title,
          description: v.description,
          thumbnail_url: v.thumbnailUrl,
          published_at: v.publishedAt,
          duration_sec: v.durationSec,
          raw: v.raw,
          suggested_lesson_id: m.lessonId,
          subject_id: m.subjectId,
          match_score: m.score,
          status: 'pending',
        };
      });
      if (toInsert.length) {
        const { error } = await db.from('videos').upsert(toInsert, { onConflict: 'youtube_id', ignoreDuplicates: true });
        if (error) throw error;
        newVideos += toInsert.length;
      }
      await db.from('channels').update({ last_fetched_at: new Date().toISOString() }).eq('id', ch.id);
    }

    await db.from('video_fetch_runs').update({ finished_at: new Date().toISOString(), quota_units: yt.quota, new_videos: newVideos, suggested }).eq('id', run?.id);
    return Response.json({ ok: true, channels: channels?.length ?? 0, newVideos, suggested, quotaUnits: yt.quota });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db.from('video_fetch_runs').update({ finished_at: new Date().toISOString(), quota_units: yt.quota, error: message }).eq('id', run?.id);
    return Response.json({ ok: false, error: message, quotaUnits: yt.quota }, { status: 500 });
  }
});
