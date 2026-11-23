-- اختبارات الأمان (RLS) ودوال الخادم. تفشل عند أول assert خاطئ.
\set ON_ERROR_STOP 1
\o /dev/null

-- مستخدمون تجريبيون
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test', '{"role":"student","grade":"5","display_name":"مريم"}'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test', '{"role":"student","grade":"7"}'),
  ('00000000-0000-0000-0000-00000000000c', 'p@test', '{"role":"parent"}'),
  ('00000000-0000-0000-0000-00000000000d', 'admin@test', '{}');
insert into public.admins (user_id) values ('00000000-0000-0000-0000-00000000000d');
-- سؤال واحد مراجَع
update public.questions set reviewed = true where id = 'g5-math-u1-l1-q1';
-- ولي الأمر مرتبط بالطالب A فقط
insert into public.parent_links (parent_id, student_id, status)
values ('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000a', 'active');

do $$ begin
  assert (select count(*) from public.profiles) = 4, 'trigger should create a profile per user';
  assert (select grade_id from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 5, 'grade from metadata';
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000c') = 'parent', 'role from metadata';
end $$;

-- ───────────── الزائر (anon) ─────────────
set role anon;
select set_config('request.jwt.claim.sub', '', false);
do $$ begin
  assert (select count(*) from public.subjects) = 72, 'anon reads all subjects';
  assert (select count(*) from public.lessons) = 144, 'anon reads published lessons';
  assert (select count(*) from public.questions) = 1, 'anon sees reviewed questions only';
  assert (select count(*) from public.profiles) = 0, 'anon sees no profiles';
  begin
    insert into public.questions (lesson_id, type, prompt, answer) values ('g5-math-u1-l1', 'true_false', 'x', 'true');
    assert false, 'anon must not insert questions';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ───────────── الطالب A ─────────────
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
do $$
declare r jsonb; ans jsonb;
begin
  assert (select count(*) from public.profiles) = 1, 'student sees only own profile';
  assert (select count(*) from public.questions) = 1, 'student sees reviewed questions only';
  assert not public.is_admin(), 'student is not admin';

  -- لا يستطيع تعديل نقاطه
  begin
    update public.profiles set points = 9999 where id = auth.uid();
    assert false, 'student must not update points';
  exception when insufficient_privilege then null; end;
  -- لكن يستطيع تعديل صفه واسمه
  update public.profiles set grade_id = 6, display_name = 'مريم' where id = auth.uid();
  assert (select grade_id from public.profiles where id = auth.uid()) = 6, 'student updates own grade';
  -- لا يستطيع تعديل ملف غيره
  update public.profiles set grade_id = 1 where id = '00000000-0000-0000-0000-00000000000b';

  -- لا يستطيع إدراج محاولة مباشرة
  begin
    insert into public.attempts (user_id, mode, correct, total, percent, stars) values (auth.uid(), 'lesson', 10, 10, 100, 3);
    assert false, 'direct attempt insert must fail';
  exception when insufficient_privilege then null; end;

  -- محاولة عبر الخادم: سؤال مخزّن (يتحقق الخادم من الإجابة رغم أن التطبيق قال خطأ) + سؤال مولّد صعب
  select answer into ans from public.questions where id = 'g5-math-u1-l1-q1';
  r := public.record_attempt('g5-math-u1-l1', 'g5-math', 'lesson', jsonb_build_array(
    jsonb_build_object('question_id', 'g5-math-u1-l1-q1', 'question_key', 'g5-math-u1-l1-q1', 'question_snapshot', '{}'::jsonb, 'given_answer', ans, 'is_correct', false),
    jsonb_build_object('question_key', 'gen-5-1-0', 'question_snapshot', '{"id":"gen-5-1-0","difficulty":"hard"}'::jsonb, 'given_answer', '"7"', 'is_correct', true)
  ), 60);
  assert (r ->> 'correct')::int = 2, 'server verifies MCQ answer';
  assert (r ->> 'points_earned')::int = 10 + 20 + 20, 'easy + hard + perfect bonus = 50, got ' || (r ->> 'points_earned');
  assert (r ->> 'points')::int = 50, 'profile points updated';
  assert (r ->> 'streak_count')::int = 1, 'streak starts at 1';

  -- إجابة خاطئة على سؤال مخزّن رغم ادعاء التطبيق أنها صحيحة
  begin
    perform public.record_attempt('g5-math-u1-l1', 'g5-math', 'lesson', '[{"question_id":"g5-math-u1-l1-q1","given_answer":"wrong","is_correct":true}]'::jsonb, 10);
    assert false, 'rate limit should block an immediate second attempt';
  exception when raise_exception then null; end;
end $$;
reset role;

-- نعيد المحاولة السابقة للماضي لتجاوز حد التكرار، ثم نختبر التحقق والسلسلة
update public.attempts set created_at = now() - interval '1 minute';
update public.profiles set last_active_date = public.muscat_today() - 1 where id = '00000000-0000-0000-0000-00000000000a';

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
do $$ declare r jsonb; begin
  r := public.record_attempt('g5-math-u1-l1', 'g5-math', 'lesson',
    '[{"question_id":"g5-math-u1-l1-q1","question_key":"g5-math-u1-l1-q1","question_snapshot":{"id":"g5-math-u1-l1-q1"},"given_answer":"wrong","is_correct":true}]'::jsonb, 10);
  assert (r ->> 'correct')::int = 0, 'server rejects a wrong MCQ answer claimed as correct';
  assert (r ->> 'points_earned')::int = 0, 'no points for wrong answer';
  assert (r ->> 'streak_count')::int = 2, 'consecutive day increments streak';
  assert (select count(*) from public.my_open_mistakes where user_id = auth.uid()) = 1, 'open mistake recorded';
  assert (select percent from public.my_lesson_best where lesson_id = 'g5-math-u1-l1') = 100, 'best score kept';
  assert (select count(*) from public.attempts) = 2, 'student sees own attempts';
  perform public.add_study_time(120);
  perform public.add_study_time(999999);
  assert (select seconds from public.study_sessions where user_id = auth.uid()) = 120 + 1800, 'study time capped per call';

  -- المفضلة
  insert into public.favorites (user_id, item_type, item_id, title) values (auth.uid(), 'video', 'v1', 'فيديو');
  begin
    insert into public.favorites (user_id, item_type, item_id, title) values ('00000000-0000-0000-0000-00000000000b', 'video', 'v1', 'x');
    assert false, 'cannot insert favorites for another user';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- سلسلة منقطعة تعود إلى 1
update public.attempts set created_at = now() - interval '1 minute';
update public.profiles set last_active_date = public.muscat_today() - 3 where id = '00000000-0000-0000-0000-00000000000a';
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
do $$ declare r jsonb; begin
  r := public.record_attempt('g5-math-u1-l1', 'g5-math', 'mistakes',
    ('[{"question_id":"g5-math-u1-l1-q1","question_key":"g5-math-u1-l1-q1","question_snapshot":{},"given_answer":' || (select answer::text from public.questions where id = 'g5-math-u1-l1-q1') || ',"is_correct":false}]')::jsonb, 10);
  assert (r ->> 'streak_count')::int = 1, 'broken streak resets to 1';
  assert (r ->> 'streak_best')::int = 2, 'best streak kept';
  assert (select count(*) from public.my_open_mistakes where user_id = auth.uid()) = 0, 'mistake cleared after a correct answer';
end $$;
reset role;

-- ───────────── الطالب B لا يرى بيانات A ─────────────
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ begin
  assert (select count(*) from public.attempts) = 0, 'B cannot see A attempts';
  assert (select count(*) from public.answers) = 0, 'B cannot see A answers';
  assert (select count(*) from public.favorites) = 0, 'B cannot see A favorites';
  assert (select count(*) from public.profiles) = 1, 'B sees only own profile';
  assert (select grade_id from public.profiles) = 7, 'A could not change B grade';
end $$;
reset role;

-- ───────────── ولي الأمر يرى ابنه المرتبط فقط ─────────────
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
do $$ begin
  assert (select count(*) from public.profiles) = 2, 'parent sees self + linked child';
  assert (select count(*) from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 0, 'parent cannot see unlinked student';
  assert (select count(*) from public.attempts) = 3, 'parent sees child attempts';
  assert (select count(*) from public.study_sessions) = 1, 'parent sees child study time';
  assert (select count(*) from public.favorites) = 0, 'parent cannot see child favorites';
end $$;
reset role;

-- ───────────── الأدمن ─────────────
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
do $$ begin
  assert public.is_admin(), 'admin detected';
  assert (select count(*) from public.questions) = 720, 'admin sees unreviewed questions';
  update public.questions set reviewed = true where id = 'g5-math-u1-l1-q2';
  assert (select reviewed from public.questions where id = 'g5-math-u1-l1-q2'), 'admin can review questions';
  insert into public.channels (youtube_channel_id, name, url) values ('UC_test', 'قناة', 'https://youtube.com/@x');
end $$;
reset role;

-- غير الأدمن لا يستطيع تعديل المحتوى (لا تتأثر أي صفوف)
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ begin
  update public.questions set prompt = 'hacked' where id = 'g5-math-u1-l1-q1';
  delete from public.subjects;
end $$;
reset role;
do $$ begin
  assert (select prompt from public.questions where id = 'g5-math-u1-l1-q1') <> 'hacked', 'student cannot edit questions';
  assert (select count(*) from public.subjects) = 72, 'student cannot delete subjects';
end $$;

-- ───────────── قيود البيانات ─────────────
do $$ begin
  begin
    insert into public.textbooks (grade_id, subject_id, term, title, official_url, file_path)
    values (5, 'g5-math', 1, 'كتاب', 'https://example.om/book', 'books/x.pdf');
    assert false, 'file upload requires permission_granted';
  exception when check_violation then null; end;
  begin
    insert into public.textbooks (grade_id, subject_id, term, title, official_url) values (5, 'g5-math', 1, 'كتاب', 'http://insecure');
    assert false, 'official url must be https';
  exception when check_violation then null; end;
  begin
    insert into public.questions (lesson_id, type, prompt, options, answer) values ('g5-math-u1-l1', 'mcq', 'x', '["a","b","c"]', '"a"');
    assert false, 'mcq needs 4 options';
  exception when check_violation then null; end;
end $$;

-- ───────────── نقل تقدّم وضع التجربة + حذف الحساب ─────────────
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$ begin
  assert public.import_guest_progress('{
    "attempts":[{"lesson_id":"g7-math-u1-l1","subject_id":"g7-math","mode":"lesson","correct":5,"total":5,"percent":100,"points":999,"duration_sec":60,"at":1700000000000}],
    "mistakes":[{"question_key":"g7-math-u1-l1-q2","question_snapshot":{"id":"g7-math-u1-l1-q2"}}],
    "study":{"2026-01-01":300},
    "streak":{"count":4,"best":9,"lastDay":"2000-01-01"}
  }'::jsonb), 'import succeeds the first time';
  assert (select points from public.profiles where id = auth.uid()) = 220, 'imported points are capped per attempt';
  assert (select streak_best from public.profiles where id = auth.uid()) = 9, 'best streak imported';
  assert (select streak_count from public.profiles where id = auth.uid()) = 0, 'stale streak not imported';
  assert (select count(*) from public.my_open_mistakes where user_id = auth.uid()) = 1, 'mistakes imported';
  assert not public.import_guest_progress('{"attempts":[]}'::jsonb), 'import only once';
  perform public.delete_my_account();
end $$;
reset role;
do $$ begin
  assert not exists (select 1 from auth.users where id = '00000000-0000-0000-0000-00000000000b'), 'account deleted';
  assert not exists (select 1 from public.attempts where user_id = '00000000-0000-0000-0000-00000000000b'), 'data cascaded';
end $$;


-- ═════════════ المرحلة 3: الفيديوهات والكتب ═════════════
insert into public.channels (handle, name, url) values ('mawred_test', 'مورد', 'https://www.youtube.com/@mawred_test');
do $$ begin
  begin
    insert into public.channels (name, url) values ('بلا معرّف', 'https://youtube.com');
    assert false, 'channel needs id or handle';
  exception when check_violation then null; end;
end $$;
insert into public.videos (youtube_id, channel_id, title, status, lesson_id, suggested_lesson_id) values
  ('vid_ok', (select id from public.channels where handle = 'mawred_test'), 'مفهوم الكسر', 'approved', 'g5-math-u1-l1', 'g5-math-u1-l1'),
  ('vid_pending', (select id from public.channels where handle = 'mawred_test'), 'جمع الكسور', 'pending', null, 'g5-math-u1-l2'),
  ('vid_nolesson', (select id from public.channels where handle = 'mawred_test'), 'لقاء تربوي', 'pending', null, null),
  ('vid_rejected', (select id from public.channels where handle = 'mawred_test'), 'غير مناسب', 'rejected', null, null);

set role anon;
select set_config('request.jwt.claim.sub', '', false);
do $$ begin
  assert (select count(*) from public.videos) = 1, 'anon sees approved videos only';
  assert (select count(*) from public.channels) >= 1, 'channel info is public';
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
do $$ begin
  assert (select count(*) from public.videos) = 1, 'student sees approved videos only';
  insert into public.video_ratings (user_id, video_id, helpful) values (auth.uid(), (select id from public.videos where youtube_id = 'vid_ok'), true);
  begin
    insert into public.video_ratings (user_id, video_id, helpful) values ('00000000-0000-0000-0000-00000000000c', (select id from public.videos where youtube_id = 'vid_ok'), false);
    assert false, 'cannot rate on behalf of another user';
  exception when insufficient_privilege then null; end;
  begin
    perform public.review_video((select id from public.videos where youtube_id = 'vid_ok'), 'rejected');
    assert false, 'students cannot review videos';
  exception when insufficient_privilege then null; end;
  assert (select count(*) from public.video_fetch_runs) = 0, 'fetch runs are admin-only';
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
do $$ begin
  assert (select count(*) from public.videos) = 4, 'admin sees all videos';
  perform public.review_video((select id from public.videos where youtube_id = 'vid_pending'), 'approved');
  assert (select lesson_id from public.videos where youtube_id = 'vid_pending') = 'g5-math-u1-l2', 'approval uses the suggested lesson';
  begin
    perform public.review_video((select id from public.videos where youtube_id = 'vid_nolesson'), 'approved');
    assert false, 'cannot approve a video without a lesson';
  exception when raise_exception then null; end;
  assert (select subject_id from public.videos where youtube_id = 'vid_pending') = 'g5-math', 'subject filled from lesson';
  update public.videos set subject_id = 'g12-biology' where youtube_id = 'vid_rejected';
  perform public.review_video((select id from public.videos where youtube_id = 'vid_rejected'), 'approved');
  assert (select status from public.videos where youtube_id = 'vid_rejected') = 'approved' and (select lesson_id from public.videos where youtube_id = 'vid_rejected') is null, 'subject-level approval';
  perform public.review_video((select id from public.videos where youtube_id = 'vid_nolesson'), 'approved', 'g5-math-u1-l1');
  assert (select status from public.videos where youtube_id = 'vid_nolesson') = 'approved', 'admin links manually';
  assert (select helpful from public.video_rating_stats where video_id = (select id from public.videos where youtube_id = 'vid_ok')) = 1, 'admin sees rating stats';
  insert into public.textbooks (grade_id, subject_id, term, title, official_url) values (5, 'g5-math', 1, 'الرياضيات', 'https://example.om/math5');
end $$;
reset role;

set role anon;
select set_config('request.jwt.claim.sub', '', false);
do $$ begin
  assert (select count(*) from public.videos) = 4, 'newly approved videos become visible';
  assert (select count(*) from public.textbooks where subject_id = 'g5-math') > 1, 'textbook links are public';
  assert (select count(*) from public.textbooks) >= 266, 'all official textbook links seeded';
end $$;
reset role;

\echo 'RLS & function tests: OK'
