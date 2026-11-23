-- ════════════════════════════════════════════════════════════════════
-- دَرْسي — أمان مستوى الصفوف (Row Level Security)
--   • المحتوى المنشور/المراجَع يُقرأ للجميع
--   • الأدمن فقط يعدّل المحتوى
--   • الطالب يرى بياناته فقط، وولي الأمر يرى بيانات أبنائه المرتبطين فقط
--   • النقاط والسلسلة والمحاولات تُكتب عبر دوال الخادم فقط
-- ════════════════════════════════════════════════════════════════════

alter table public.grades enable row level security;
alter table public.subjects enable row level security;
alter table public.terms enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_objectives enable row level security;
alter table public.questions enable row level security;
alter table public.textbooks enable row level security;
alter table public.channels enable row level security;
alter table public.videos enable row level security;
alter table public.summaries enable row level security;
alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.attempts enable row level security;
alter table public.answers enable row level security;
alter table public.favorites enable row level security;
alter table public.video_ratings enable row level security;
alter table public.study_sessions enable row level security;
alter table public.parent_links enable row level security;
alter table public.sponsors enable row level security;

-- ───────────── المحتوى: قراءة عامة، كتابة للأدمن ─────────────
create policy "grades: read all" on public.grades for select using (true);
create policy "grades: admin write" on public.grades for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "subjects: read all" on public.subjects for select using (true);
create policy "subjects: admin write" on public.subjects for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "terms: read all" on public.terms for select using (true);
create policy "terms: admin write" on public.terms for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "units: read published" on public.units for select using (published or public.is_admin());
create policy "units: admin write" on public.units for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "lessons: read published" on public.lessons for select
  using (
    public.is_admin()
    or (published and exists (select 1 from public.units u where u.id = unit_id and u.published))
  );
create policy "lessons: admin write" on public.lessons for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "objectives: read with lesson" on public.lesson_objectives for select
  using (exists (select 1 from public.lessons l where l.id = lesson_id));   -- يرث سياسة الدروس
create policy "objectives: admin write" on public.lesson_objectives for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- الأسئلة: لا يرى الطلاب إلا المراجَعة
create policy "questions: read reviewed" on public.questions for select
  using (public.is_admin() or (reviewed and exists (select 1 from public.lessons l where l.id = lesson_id)));
create policy "questions: admin write" on public.questions for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "textbooks: read all" on public.textbooks for select using (true);
create policy "textbooks: admin write" on public.textbooks for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "channels: read all" on public.channels for select using (true);
create policy "channels: admin write" on public.channels for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- الفيديوهات: لا تظهر إلا بعد الموافقة
create policy "videos: read approved" on public.videos for select using (status = 'approved' or public.is_admin());
create policy "videos: admin write" on public.videos for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- الملخصات: لا تظهر إلا بعد الاعتماد
create policy "summaries: read approved" on public.summaries for select using (status = 'approved' or public.is_admin());
create policy "summaries: admin write" on public.summaries for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "sponsors: read active" on public.sponsors for select using (active or public.is_admin());
create policy "sponsors: admin write" on public.sponsors for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ───────────── المستخدمون ─────────────
create policy "profiles: read own, children, admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_parent_of(id) or public.is_admin());
-- التعديل على أعمدة محددة فقط (انظر الصلاحيات بالأسفل)
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "admins: read own" on public.admins for select to authenticated using (user_id = auth.uid());

create policy "attempts: read own, children, admin" on public.attempts for select to authenticated
  using (user_id = auth.uid() or public.is_parent_of(user_id) or public.is_admin());

create policy "answers: read own, children, admin" on public.answers for select to authenticated
  using (user_id = auth.uid() or public.is_parent_of(user_id) or public.is_admin());

create policy "study: read own, children" on public.study_sessions for select to authenticated
  using (user_id = auth.uid() or public.is_parent_of(user_id) or public.is_admin());

create policy "favorites: own" on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "ratings: own" on public.video_ratings for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "parent_links: own side" on public.parent_links for select to authenticated
  using (parent_id = auth.uid() or student_id = auth.uid() or public.is_admin());

-- ───────────── الصلاحيات على الأعمدة والكتابة ─────────────
-- الملف الشخصي: يعدّل المستخدم الدور والصف والاسم فقط، لا النقاط ولا السلسلة
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (role, grade_id, display_name) on public.profiles to authenticated;

-- المحاولات والإجابات ووقت الدراسة وروابط ولي الأمر: عبر دوال الخادم فقط
revoke insert, update, delete on public.attempts, public.answers, public.study_sessions, public.parent_links from anon, authenticated;
revoke insert, update, delete on public.admins from anon, authenticated;

-- الزائر (بدون حساب) يقرأ المحتوى فقط
revoke insert, update, delete on public.favorites, public.video_ratings from anon;

-- الدوال
revoke execute on function public.record_attempt(text, text, text, jsonb, integer) from public, anon;
revoke execute on function public.add_study_time(integer) from public, anon;
revoke execute on function public.import_guest_progress(jsonb) from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.record_attempt(text, text, text, jsonb, integer) to authenticated;
grant execute on function public.add_study_time(integer) to authenticated;
grant execute on function public.import_guest_progress(jsonb) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

grant select on public.my_lesson_best, public.my_open_mistakes to authenticated;
