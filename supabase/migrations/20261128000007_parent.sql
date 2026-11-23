-- ════════════════════════════════════════════════════════════════════
-- المرحلة 5: لوحة ولي الأمر
-- 1) الطالب ينشئ رمز ربط (8 خانات، صالح 24 ساعة) ويعطيه لولي أمره.
-- 2) ولي الأمر يدخل الرمز فيصبح الربط «active».
-- 3) ولي الأمر يقرأ تقريراً مجمّعاً فقط (وقت الدراسة، الدرجات لكل مادة، مواطن الضعف) — لا يرى الإجابات.
-- كل الكتابة عبر دوال الخادم؛ جدول parent_links مغلق أمام الكتابة المباشرة (03_rls).
-- ════════════════════════════════════════════════════════════════════

-- رمز من حروف وأرقام لا تتشابه (بلا O/0 و I/1)
create or replace function public.random_link_code() returns text
language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, 8)
$$;

-- الطالب: إنشاء رمز ربط جديد (يلغي الرموز السابقة غير المستخدمة)
create or replace function public.create_parent_link_code() returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_expires timestamptz := now() + interval '24 hours';
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if (select role from public.profiles where id = v_uid) <> 'student' then
    raise exception 'only students can create link codes' using errcode = '42501';
  end if;
  delete from public.parent_links where student_id = v_uid and status = 'pending';
  loop
    v_code := public.random_link_code();
    exit when not exists (select 1 from public.parent_links where code = v_code);
  end loop;
  insert into public.parent_links (student_id, code, status, expires_at) values (v_uid, v_code, 'pending', v_expires);
  return jsonb_build_object('code', v_code, 'expires_at', v_expires);
end $$;

-- ولي الأمر: استخدام الرمز
create or replace function public.redeem_parent_link_code(p_code text) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_link public.parent_links;
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_child public.profiles;
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if (select role from public.profiles where id = v_uid) <> 'parent' then
    raise exception 'only parents can redeem link codes' using errcode = '42501';
  end if;
  select * into v_link from public.parent_links
  where code = v_code and status = 'pending' and expires_at > now()
  for update;
  if not found then raise exception 'invalid or expired code' using errcode = 'P0002'; end if;

  if exists (select 1 from public.parent_links where parent_id = v_uid and student_id = v_link.student_id) then
    update public.parent_links set status = 'active' where parent_id = v_uid and student_id = v_link.student_id;
    delete from public.parent_links where id = v_link.id;
  else
    update public.parent_links set parent_id = v_uid, status = 'active', code = null, expires_at = null where id = v_link.id;
  end if;

  select * into v_child from public.profiles where id = v_link.student_id;
  return jsonb_build_object('student_id', v_child.id, 'display_name', v_child.display_name, 'grade_id', v_child.grade_id);
end $$;

-- أيّ الطرفين: إلغاء الربط
create or replace function public.remove_parent_link(p_other uuid) returns void
language sql volatile security definer set search_path = public as $$
  delete from public.parent_links
  where status = 'active'
    and ((parent_id = auth.uid() and student_id = p_other) or (student_id = auth.uid() and parent_id = p_other))
$$;

-- ولي الأمر: أبناؤه المرتبطون
create or replace function public.my_children() returns table (
  student_id uuid, display_name text, grade_id smallint, points integer, streak_count integer, streak_best integer, last_active_date date, linked_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.grade_id, p.points,
         -- السلسلة تنقطع إذا مرّ أكثر من يوم بلا نشاط
         case when p.last_active_date >= public.muscat_today() - 1 then p.streak_count else 0 end,
         p.streak_best, p.last_active_date, l.created_at
  from public.parent_links l
  join public.profiles p on p.id = l.student_id
  where l.parent_id = auth.uid() and l.status = 'active'
  order by l.created_at
$$;

-- الطالب: أولياء الأمور المرتبطون به (لرؤيتهم وإلغاء الربط)
create or replace function public.my_parents() returns table (parent_id uuid, display_name text, linked_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, l.created_at
  from public.parent_links l
  join public.profiles p on p.id = l.parent_id
  where l.student_id = auth.uid() and l.status = 'active'
  order by l.created_at
$$;

-- تقرير مجمّع عن طالب: للطالب نفسه أو لولي أمره المرتبط أو للمشرف
create or replace function public.child_report(p_student uuid, p_days integer default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_days integer := least(greatest(coalesce(p_days, 30), 1), 365);
  v_from date := public.muscat_today() - (v_days - 1);
begin
  if not (p_student = auth.uid() or public.is_parent_of(p_student) or public.is_admin()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'days', v_days,
    -- ثواني الدراسة لكل يوم
    'study', coalesce((
      select jsonb_object_agg(day::text, seconds order by day)
      from public.study_sessions where user_id = p_student and day >= v_from
    ), '{}'::jsonb),
    -- لكل مادة: عدد المحاولات ومتوسط الدرجة وعدد الدروس المنجزة (نجمة فأكثر)
    'subjects', coalesce((
      select jsonb_agg(jsonb_build_object(
        'subject_id', s.subject_id, 'attempts', s.attempts, 'avg_percent', s.avg_percent,
        'lessons_done', s.lessons_done, 'last_at', s.last_at) order by s.subject_id)
      from (
        select a.subject_id, count(*)::int as attempts, round(avg(a.percent))::int as avg_percent,
               count(distinct a.lesson_id) filter (where a.stars >= 1)::int as lessons_done, max(a.created_at) as last_at
        from public.attempts a
        where a.user_id = p_student and a.subject_id is not null
        group by a.subject_id
      ) s
    ), '[]'::jsonb),
    -- الدروس الأضعف: أفضل نتيجة أقل من 70٪
    'weak_lessons', coalesce((
      select jsonb_agg(jsonb_build_object('lesson_id', w.lesson_id, 'title', w.title, 'subject_id', w.subject_id, 'best_percent', w.best) order by w.best)
      from (
        select a.lesson_id, l.title, a.subject_id, max(a.percent)::int as best
        from public.attempts a join public.lessons l on l.id = a.lesson_id
        where a.user_id = p_student and a.mode = 'lesson'
        group by a.lesson_id, l.title, a.subject_id
        having max(a.percent) < 70
        order by best
        limit 8
      ) w
    ), '[]'::jsonb),
    -- آخر النشاطات
    'recent', coalesce((
      select jsonb_agg(jsonb_build_object('lesson_id', r.lesson_id, 'title', r.title, 'subject_id', r.subject_id, 'percent', r.percent, 'stars', r.stars, 'at', r.created_at) order by r.created_at desc)
      from (
        select a.lesson_id, l.title, a.subject_id, a.percent, a.stars, a.created_at
        from public.attempts a left join public.lessons l on l.id = a.lesson_id
        where a.user_id = p_student and a.mode in ('lesson', 'mistakes')
        order by a.created_at desc
        limit 10
      ) r
    ), '[]'::jsonb),
    'open_mistakes', (select count(*) from public.my_open_mistakes where user_id = p_student)
  );
end $$;

revoke execute on function public.random_link_code() from public, anon, authenticated;
revoke execute on function public.create_parent_link_code() from public, anon;
revoke execute on function public.redeem_parent_link_code(text) from public, anon;
revoke execute on function public.remove_parent_link(uuid) from public, anon;
revoke execute on function public.my_children() from public, anon;
revoke execute on function public.my_parents() from public, anon;
revoke execute on function public.child_report(uuid, integer) from public, anon;
grant execute on function public.create_parent_link_code() to authenticated;
grant execute on function public.redeem_parent_link_code(text) to authenticated;
grant execute on function public.remove_parent_link(uuid) to authenticated;
grant execute on function public.my_children() to authenticated;
grant execute on function public.my_parents() to authenticated;
grant execute on function public.child_report(uuid, integer) to authenticated;
