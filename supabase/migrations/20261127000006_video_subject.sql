-- ════════════════════════════════════════════════════════════════════
-- دَرْسي — ربط الفيديو بالمادة في صفها عندما لا يطابق درساً محدداً
-- (عناوين قناة «مورد» تتبع وحدات المنهج الفعلية: «الأحياء 12 - (9-4) …»)
-- ════════════════════════════════════════════════════════════════════
alter table public.videos add column subject_id text references public.subjects (id) on delete set null;
create index videos_subject_idx on public.videos (subject_id) where status = 'approved';

-- المادة تُستنتج من الدرس تلقائياً إن وُجد
create or replace function public.videos_fill_subject() returns trigger
language plpgsql as $$
begin
  if new.lesson_id is not null then
    select t.subject_id into new.subject_id
    from public.lessons l join public.units u on u.id = l.unit_id join public.terms t on t.id = u.term_id
    where l.id = new.lesson_id;
  end if;
  return new;
end $$;
create trigger videos_fill_subject before insert or update of lesson_id on public.videos
  for each row execute function public.videos_fill_subject();

-- الاعتماد يتطلب درساً أو مادة
create or replace function public.review_video(p_video_id uuid, p_status public.video_status, p_lesson_id text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v public.videos%rowtype;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  select * into v from public.videos where id = p_video_id;
  if p_status = 'approved' and coalesce(p_lesson_id, v.lesson_id, v.suggested_lesson_id, v.subject_id) is null then
    raise exception 'an approved video must be linked to a lesson or a subject';
  end if;
  update public.videos
  set status = p_status,
      lesson_id = case when p_status = 'approved' then coalesce(p_lesson_id, lesson_id, suggested_lesson_id) else lesson_id end,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_video_id;
end $$;
