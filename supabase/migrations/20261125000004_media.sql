-- ════════════════════════════════════════════════════════════════════
-- دَرْسي — المرحلة 3: الكتب (روابط) وفيديوهات يوتيوب
-- ════════════════════════════════════════════════════════════════════

-- القناة تُضاف بالمعرّف (UC…) أو بالاسم المختصر (@handle)، والدالة اليومية تكمل الباقي
alter table public.channels alter column youtube_channel_id drop not null;
alter table public.channels add column handle text unique;
alter table public.channels add constraint channel_ref_present check (youtube_channel_id is not null or handle is not null);

alter table public.videos add column duration_sec integer;
alter table public.videos add column fetched_at timestamptz not null default now();

-- سجل تشغيل الدالة اليومية (لمراقبة استهلاك حصة YouTube)
create table public.video_fetch_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  quota_units integer not null default 0,
  new_videos integer not null default 0,
  suggested integer not null default 0,
  error text
);
alter table public.video_fetch_runs enable row level security;
create policy "fetch runs: admin read" on public.video_fetch_runs for select to authenticated using (public.is_admin());
revoke insert, update, delete on public.video_fetch_runs from anon, authenticated;

-- الأدمن يرى تقييمات الطلاب (للإحصائيات فقط)
create policy "ratings: admin read" on public.video_ratings for select to authenticated using (public.is_admin());

-- إحصائيات التقييم لكل فيديو (مفيد / غير مفيد)
create view public.video_rating_stats with (security_invoker = true) as
select video_id,
       count(*) filter (where helpful)::int as helpful,
       count(*) filter (where not helpful)::int as not_helpful
from public.video_ratings
group by video_id;
grant select on public.video_rating_stats to authenticated;

-- اعتماد فيديو وربطه بدرس (أو رفضه) — للأدمن فقط
create or replace function public.review_video(p_video_id uuid, p_status public.video_status, p_lesson_id text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if p_status = 'approved' and coalesce(p_lesson_id, (select coalesce(lesson_id, suggested_lesson_id) from public.videos where id = p_video_id)) is null then
    raise exception 'an approved video must be linked to a lesson';
  end if;
  update public.videos
  set status = p_status,
      lesson_id = case when p_status = 'approved' then coalesce(p_lesson_id, lesson_id, suggested_lesson_id) else lesson_id end,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_video_id;
end $$;
revoke execute on function public.review_video(uuid, public.video_status, text) from public, anon;
grant execute on function public.review_video(uuid, public.video_status, text) to authenticated;
