-- ════════════════════════════════════════════════════════════════════
-- دَرْسي — الجداول الأساسية
-- المحتوى بمعرّفات نصية ثابتة (مثل g5-math-u1-l2) حتى يطابق ملفات seed.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ───────────── الأنواع ─────────────
create type public.question_type as enum ('mcq', 'true_false', 'fill_blank', 'word_order');
create type public.difficulty as enum ('easy', 'medium', 'hard');
create type public.content_source as enum ('seed', 'admin', 'import', 'generated');
create type public.user_role as enum ('student', 'parent');
create type public.license_status as enum ('link_only', 'permission_granted');
create type public.video_status as enum ('pending', 'approved', 'rejected');
create type public.summary_status as enum ('draft', 'approved');
create type public.link_status as enum ('pending', 'active', 'revoked');

-- تحديث updated_at تلقائياً
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ───────────── هيكل المنهج ─────────────
create table public.grades (
  id smallint primary key check (id between 1 and 12),
  name_ar text not null,
  sort smallint not null default 0
);

create table public.subjects (
  id text primary key,                       -- مثل g5-math
  grade_id smallint not null references public.grades (id) on delete cascade,
  key text not null,                         -- islamic, arabic, math…
  name_ar text not null,
  icon text not null default 'BookOpen',
  color text not null default '#2C4A7A',
  direction text not null default 'rtl' check (direction in ('rtl', 'ltr')),
  sort smallint not null default 0,
  unique (grade_id, key)
);

create table public.terms (
  id text primary key default gen_random_uuid()::text,   -- مثل g5-math-t1
  subject_id text not null references public.subjects (id) on delete cascade,
  number smallint not null check (number in (1, 2)),
  name_ar text not null,
  unique (subject_id, number)
);

create table public.units (
  id text primary key default gen_random_uuid()::text,
  term_id text not null references public.terms (id) on delete cascade,
  title text not null,
  sort smallint not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index units_term_idx on public.units (term_id, sort);

create table public.lessons (
  id text primary key default gen_random_uuid()::text,
  unit_id text not null references public.units (id) on delete cascade,
  title text not null,
  sort smallint not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lessons_unit_idx on public.lessons (unit_id, sort);

-- أهداف الدرس (يدخلها المسؤول يدوياً)
create table public.lesson_objectives (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null references public.lessons (id) on delete cascade,
  text text not null,
  sort smallint not null default 0
);
create index lesson_objectives_lesson_idx on public.lesson_objectives (lesson_id, sort);

-- ───────────── الأسئلة ─────────────
create table public.questions (
  id text primary key default gen_random_uuid()::text,
  lesson_id text not null references public.lessons (id) on delete cascade,
  type public.question_type not null,
  prompt text not null,
  options jsonb,                 -- mcq: 4 نصوص، fill_blank: بنك كلمات اختياري
  answer jsonb not null,         -- mcq/fill: نص، true_false: boolean، word_order: مصفوفة كلمات
  accepted jsonb,                -- إجابات بديلة مقبولة لـ fill_blank
  explanation text not null default '',
  difficulty public.difficulty not null default 'easy',
  reviewed boolean not null default false,
  reviewed_at timestamptz,
  reviewed_by uuid,
  source public.content_source not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mcq_has_four_options check (
    type <> 'mcq' or (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4 and options ? (answer #>> '{}'))
  ),
  constraint tf_answer_is_boolean check (type <> 'true_false' or jsonb_typeof(answer) = 'boolean'),
  constraint order_answer_is_array check (type <> 'word_order' or jsonb_typeof(answer) = 'array')
);
create index questions_lesson_idx on public.questions (lesson_id);
create index questions_unreviewed_idx on public.questions (reviewed) where not reviewed;

-- ───────────── الكتب المدرسية (روابط فقط) ─────────────
create table public.textbooks (
  id uuid primary key default gen_random_uuid(),
  grade_id smallint not null references public.grades (id) on delete cascade,
  subject_id text not null references public.subjects (id) on delete cascade,
  term smallint not null check (term in (1, 2)),
  title text not null,
  official_url text not null check (official_url ~ '^https://'),
  license_status public.license_status not null default 'link_only',
  -- لا يُسمح برفع ملف إلا بعد الحصول على إذن رسمي
  file_path text check (file_path is null or license_status = 'permission_granted'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, term)
);

-- ───────────── قنوات وفيديوهات يوتيوب ─────────────
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  youtube_channel_id text not null unique,
  name text not null,
  url text not null,
  uploads_playlist_id text,
  active boolean not null default true,
  last_fetched_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null unique,
  channel_id uuid not null references public.channels (id) on delete cascade,
  title text not null,
  description text,
  thumbnail_url text,
  published_at timestamptz,
  raw jsonb,                                   -- نتيجة YouTube API المخزّنة
  suggested_lesson_id text references public.lessons (id) on delete set null,
  lesson_id text references public.lessons (id) on delete set null,
  match_score real,
  status public.video_status not null default 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index videos_lesson_idx on public.videos (lesson_id) where status = 'approved';
create index videos_pending_idx on public.videos (status) where status = 'pending';

-- ───────────── الملخصات ─────────────
create table public.summaries (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null unique references public.lessons (id) on delete cascade,
  content jsonb not null,          -- {concepts:[], definitions:[{term,meaning}], review:[]}
  model text,
  status public.summary_status not null default 'draft',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────── المستخدمون ─────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'student',
  grade_id smallint references public.grades (id),
  display_name text check (char_length(display_name) <= 20),
  -- تُحدَّث من الخادم فقط (record_attempt)
  points integer not null default 0,
  streak_count integer not null default 0,
  streak_best integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id text references public.lessons (id) on delete set null,
  subject_id text references public.subjects (id) on delete set null,
  mode text not null check (mode in ('lesson', 'mistakes', 'imported')),
  correct smallint not null,
  total smallint not null,
  percent smallint not null check (percent between 0 and 100),
  stars smallint not null check (stars between 0 and 3),
  points_earned integer not null default 0,
  duration_sec integer not null default 0,
  created_at timestamptz not null default now()
);
create index attempts_user_idx on public.attempts (user_id, created_at desc);
create index attempts_lesson_idx on public.attempts (lesson_id);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id text references public.questions (id) on delete set null,
  -- مفتاح السؤال: معرّف السؤال، أو معرّف السؤال المولّد تلقائياً
  question_key text not null,
  -- نسخة من السؤال (ضرورية لأسئلة الرياضيات المولّدة ولشاشة «أخطائي»)
  question_snapshot jsonb not null,
  given_answer jsonb,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);
create index answers_user_key_idx on public.answers (user_id, question_key, created_at desc);
create index answers_question_idx on public.answers (question_id) where not is_correct;

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_type text not null check (item_type in ('video', 'summary')),
  item_id text not null,
  title text not null,
  subtitle text,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

create table public.video_ratings (
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  helpful boolean not null,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create table public.study_sessions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  seconds integer not null default 0 check (seconds between 0 and 86400),
  primary key (user_id, day)
);

create table public.parent_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  code text unique,
  status public.link_status not null default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_path text,
  url text,
  active boolean not null default false,
  sort smallint not null default 0,
  created_at timestamptz not null default now()
);

-- updated_at triggers
create trigger units_touch before update on public.units for each row execute function public.touch_updated_at();
create trigger lessons_touch before update on public.lessons for each row execute function public.touch_updated_at();
create trigger questions_touch before update on public.questions for each row execute function public.touch_updated_at();
create trigger textbooks_touch before update on public.textbooks for each row execute function public.touch_updated_at();
create trigger summaries_touch before update on public.summaries for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
