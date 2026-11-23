-- ════════════════════════════════════════════════════════════════════
-- دَرْسي — الدوال (تُنفَّذ على الخادم)
-- النقاط والسلسلة اليومية تُحسب هنا فقط، ولا يستطيع التطبيق تعديلها مباشرة.
-- ════════════════════════════════════════════════════════════════════

-- تاريخ اليوم بتوقيت مسقط
create or replace function public.muscat_today() returns date
language sql stable as $$
  select (now() at time zone 'Asia/Muscat')::date
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

-- هل المستخدم الحالي ولي أمر مرتبط بهذا الطالب؟
create or replace function public.is_parent_of(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.parent_links
    where parent_id = auth.uid() and student_id = p_student and status = 'active'
  )
$$;

-- إنشاء ملف المستخدم تلقائياً عند التسجيل
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_grade smallint;
begin
  if (meta ->> 'grade') ~ '^\d{1,2}$' and (meta ->> 'grade')::int between 1 and 12 then
    v_grade := (meta ->> 'grade')::smallint;
  end if;
  insert into public.profiles (id, role, grade_id, display_name)
  values (
    new.id,
    case when meta ->> 'role' = 'parent' then 'parent'::public.user_role else 'student'::public.user_role end,
    v_grade,
    nullif(left(meta ->> 'display_name', 20), '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- النقاط لكل إجابة صحيحة (مطابقة لـ lib/gamification.ts)
create or replace function public.points_for(d public.difficulty) returns integer
language sql immutable as $$
  select case d when 'hard' then 20 when 'medium' then 15 else 10 end
$$;

create or replace function public.stars_for(p integer) returns smallint
language sql immutable as $$
  select (case when p >= 90 then 3 when p >= 70 then 2 when p >= 50 then 1 else 0 end)::smallint
$$;

/*
 * تسجيل محاولة اختبار: يحفظ الإجابات، ويحسب الدرجة والنقاط والسلسلة اليومية.
 * p_answers: [{ question_id?, question_key, question_snapshot, given_answer, is_correct }]
 * - لأسئلة الاختيار من متعدد وصح/خطأ المخزّنة: يتحقق الخادم من الإجابة بنفسه.
 * - لأكمل الفراغ وترتيب الكلمات والأسئلة المولّدة: يُعتمد تصحيح التطبيق (توحيد النص العربي).
 */
create or replace function public.record_attempt(
  p_lesson_id text,
  p_subject_id text,
  p_mode text,
  p_answers jsonb,
  p_duration_sec integer
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  n integer;
  a jsonb;
  q public.questions%rowtype;
  v_qid text;
  v_key text;
  v_diff public.difficulty;
  v_ok boolean;
  v_correct integer := 0;
  v_points integer := 0;
  v_percent integer;
  v_attempt uuid;
  v_lesson text;
  v_subject text;
  prof public.profiles%rowtype;
  today date := public.muscat_today();
  v_count integer;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_mode not in ('lesson', 'mistakes') then
    raise exception 'invalid mode';
  end if;
  if jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'answers must be an array';
  end if;
  n := jsonb_array_length(p_answers);
  if n < 1 or n > 20 then
    raise exception 'invalid number of answers';
  end if;
  -- حماية بسيطة من التكرار السريع
  if exists (select 1 from public.attempts where user_id = uid and created_at > now() - interval '5 seconds') then
    raise exception 'too many attempts' using errcode = 'P0001';
  end if;

  select id into v_lesson from public.lessons where id = p_lesson_id;
  select id into v_subject from public.subjects where id = p_subject_id;

  insert into public.attempts (user_id, lesson_id, subject_id, mode, correct, total, percent, stars, duration_sec)
  values (uid, v_lesson, v_subject, p_mode, 0, n, 0, 0, least(greatest(coalesce(p_duration_sec, 0), 0), 7200))
  returning id into v_attempt;

  for a in select value from jsonb_array_elements(p_answers) loop
    v_qid := nullif(a ->> 'question_id', '');
    q := null;
    if v_qid is not null then
      select * into q from public.questions where id = v_qid;
      if not found then v_qid := null; end if;
    end if;

    if v_qid is not null then
      v_diff := q.difficulty;
      if q.type in ('mcq', 'true_false') then
        v_ok := (a -> 'given_answer') = q.answer;          -- تحقق الخادم
      else
        v_ok := coalesce((a ->> 'is_correct')::boolean, false);
      end if;
    else
      v_diff := (case a -> 'question_snapshot' ->> 'difficulty' when 'hard' then 'hard' when 'medium' then 'medium' else 'easy' end)::public.difficulty;
      v_ok := coalesce((a ->> 'is_correct')::boolean, false);
    end if;

    v_key := left(coalesce(v_qid, nullif(a ->> 'question_key', ''), a -> 'question_snapshot' ->> 'id', gen_random_uuid()::text), 200);

    if v_ok then
      v_correct := v_correct + 1;
      v_points := v_points + public.points_for(v_diff);
    end if;

    insert into public.answers (attempt_id, user_id, question_id, question_key, question_snapshot, given_answer, is_correct)
    values (v_attempt, uid, v_qid, v_key, coalesce(a -> 'question_snapshot', '{}'::jsonb), a -> 'given_answer', v_ok);
  end loop;

  v_percent := round(v_correct * 100.0 / n);
  if v_correct = n then
    v_points := v_points + 20;
  end if;

  update public.attempts
  set correct = v_correct, percent = v_percent, stars = public.stars_for(v_percent), points_earned = v_points
  where id = v_attempt;

  -- النقاط والسلسلة اليومية
  select * into prof from public.profiles where id = uid for update;
  if prof.last_active_date = today then
    v_count := prof.streak_count;
  elsif prof.last_active_date = today - 1 then
    v_count := prof.streak_count + 1;
  else
    v_count := 1;
  end if;

  update public.profiles
  set points = points + v_points,
      streak_count = v_count,
      streak_best = greatest(streak_best, v_count),
      last_active_date = today
  where id = uid
  returning * into prof;

  return jsonb_build_object(
    'attempt_id', v_attempt,
    'correct', v_correct,
    'total', n,
    'percent', v_percent,
    'stars', public.stars_for(v_percent),
    'points_earned', v_points,
    'points', prof.points,
    'streak_count', prof.streak_count,
    'streak_best', prof.streak_best,
    'last_active_date', prof.last_active_date
  );
end $$;

-- إضافة وقت دراسة لليوم (بحد أقصى 30 دقيقة لكل استدعاء)
create or replace function public.add_study_time(p_seconds integer) returns integer
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  s integer := least(greatest(coalesce(p_seconds, 0), 0), 1800);
  total integer;
begin
  if uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  insert into public.study_sessions (user_id, day, seconds)
  values (uid, public.muscat_today(), s)
  on conflict (user_id, day) do update set seconds = least(public.study_sessions.seconds + excluded.seconds, 86400)
  returning seconds into total;
  return total;
end $$;

/*
 * نقل تقدّم «وضع التجربة» إلى الحساب عند أول تسجيل دخول.
 * يعمل مرة واحدة فقط (إذا لم يكن للحساب أي محاولات)، والقيم محدودة لمنع التلاعب.
 */
create or replace function public.import_guest_progress(p jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  a jsonb;
  m jsonb;
  d record;
  v_points integer := 0;
  v_pts integer;
  v_att uuid;
  v_count integer;
  v_best integer;
  v_last date;
  today date := public.muscat_today();
begin
  if uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if exists (select 1 from public.attempts where user_id = uid) then
    return false;
  end if;

  for a in select value from jsonb_array_elements(coalesce(p -> 'attempts', '[]'::jsonb)) limit 300 loop
    v_pts := least(greatest(coalesce((a ->> 'points')::int, 0), 0), 220);
    v_points := v_points + v_pts;
    insert into public.attempts (user_id, lesson_id, subject_id, mode, correct, total, percent, stars, points_earned, duration_sec, created_at)
    values (
      uid,
      (select id from public.lessons where id = a ->> 'lesson_id'),
      (select id from public.subjects where id = a ->> 'subject_id'),
      case when a ->> 'mode' = 'mistakes' then 'mistakes' else 'lesson' end,
      least(greatest(coalesce((a ->> 'correct')::int, 0), 0), 20),
      least(greatest(coalesce((a ->> 'total')::int, 0), 0), 20),
      least(greatest(coalesce((a ->> 'percent')::int, 0), 0), 100),
      public.stars_for(least(greatest(coalesce((a ->> 'percent')::int, 0), 0), 100)),
      v_pts,
      least(greatest(coalesce((a ->> 'duration_sec')::int, 0), 0), 7200),
      least(coalesce(to_timestamp((a ->> 'at')::bigint / 1000.0), now()), now())
    );
  end loop;

  -- الأخطاء المفتوحة
  if jsonb_array_length(coalesce(p -> 'mistakes', '[]'::jsonb)) > 0 then
    insert into public.attempts (user_id, mode, correct, total, percent, stars)
    values (uid, 'imported', 0, 0, 0, 0)
    returning id into v_att;
    for m in select value from jsonb_array_elements(p -> 'mistakes') limit 500 loop
      insert into public.answers (attempt_id, user_id, question_id, question_key, question_snapshot, is_correct)
      values (
        v_att,
        uid,
        (select id from public.questions where id = m ->> 'question_key'),
        left(m ->> 'question_key', 200),
        coalesce(m -> 'question_snapshot', '{}'::jsonb),
        false
      );
    end loop;
  end if;

  -- وقت الدراسة
  for d in select key, value from jsonb_each_text(coalesce(p -> 'study', '{}'::jsonb)) limit 400 loop
    if d.key ~ '^\d{4}-\d{2}-\d{2}$' and d.key::date <= today then
      insert into public.study_sessions (user_id, day, seconds)
      values (uid, d.key::date, least(greatest(d.value::int, 0), 86400))
      on conflict (user_id, day) do nothing;
    end if;
  end loop;

  -- السلسلة اليومية
  v_best := least(greatest(coalesce((p -> 'streak' ->> 'best')::int, 0), 0), 3650);
  v_count := least(greatest(coalesce((p -> 'streak' ->> 'count')::int, 0), 0), v_best);
  if (p -> 'streak' ->> 'lastDay') ~ '^\d{4}-\d{2}-\d{2}$' then
    v_last := least((p -> 'streak' ->> 'lastDay')::date, today);
  end if;

  update public.profiles
  set points = points + least(v_points, 20000),
      streak_count = case when v_last is not null and v_last >= today - 1 then greatest(streak_count, v_count) else streak_count end,
      streak_best = greatest(streak_best, v_best),
      last_active_date = greatest(last_active_date, v_last)
  where id = uid;

  return true;
end $$;

-- حذف الحساب وكل بياناته (متطلب App Store و Google Play)
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- ───────────── عروض (Views) للتطبيق ─────────────

-- أفضل نتيجة لكل درس
create view public.my_lesson_best with (security_invoker = true) as
select user_id, lesson_id, max(percent)::int as percent, max(stars)::int as stars, count(*)::int as attempts
from public.attempts
where mode = 'lesson' and lesson_id is not null
group by user_id, lesson_id;

-- الأخطاء المفتوحة: آخر إجابة على السؤال كانت خاطئة
create view public.my_open_mistakes with (security_invoker = true) as
select l.user_id, l.question_key, l.question_snapshot, l.last_at, l.wrong_count
from (
  select distinct on (a.user_id, a.question_key)
    a.user_id,
    a.question_key,
    a.question_snapshot,
    a.is_correct,
    a.created_at as last_at,
    count(*) filter (where not a.is_correct) over (partition by a.user_id, a.question_key) as wrong_count
  from public.answers a
  order by a.user_id, a.question_key, a.created_at desc
) l
where not l.is_correct;
