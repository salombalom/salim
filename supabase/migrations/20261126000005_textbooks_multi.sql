-- ════════════════════════════════════════════════════════════════════
-- دَرْسي — عدة كتب لكل مادة وفصل (أجزاء، كتاب الطالب، كتاب النشاط)
-- والكتب السنوية بلا فصل (term = null تظهر في الفصلين)
-- ════════════════════════════════════════════════════════════════════
alter table public.textbooks drop constraint textbooks_subject_id_term_key;
alter table public.textbooks alter column term drop not null;
alter table public.textbooks add column part smallint;
alter table public.textbooks add column sort smallint not null default 0;
alter table public.textbooks add constraint textbooks_official_url_key unique (official_url);
create index textbooks_subject_idx on public.textbooks (subject_id, term, sort);
