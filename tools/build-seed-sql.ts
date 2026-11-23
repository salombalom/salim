/**
 * يولّد supabase/seed.sql من محتوى seed/ و config/curriculum.ts
 * التشغيل: npm run db:seed-sql
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { GRADES, GRADE_SUBJECTS, SUBJECTS, TERMS, gradeName, subjectId } from '../config/curriculum';
import { seedDatabase } from '../seed';
import { CHANNELS, TEXTBOOKS, VIDEOS } from '../seed/media';

const q = (v: string | null | undefined) => (v === null || v === undefined ? 'null' : `'${v.replace(/'/g, "''")}'`);
const j = (v: unknown) => (v === undefined || v === null ? 'null' : `${q(JSON.stringify(v))}::jsonb`);

const out: string[] = [
  '-- ⚠️ ملف مولَّد تلقائياً من seed/ — لا تعدّله يدوياً. أعد توليده بـ: npm run db:seed-sql',
  '-- كل الأسئلة هنا أصلية. لا يظهر للطلاب إلا ما راجعه المعلم (seed/reviewed.json → reviewed = true).',
  'begin;',
  '',
];

out.push('insert into public.grades (id, name_ar, sort) values');
out.push(GRADES.map((g) => `  (${g}, ${q(gradeName(g))}, ${g})`).join(',\n') + '\non conflict (id) do update set name_ar = excluded.name_ar;\n');

const subjectRows: string[] = [];
const termRows: string[] = [];
for (const g of GRADES) {
  GRADE_SUBJECTS[g].forEach((key, i) => {
    const s = SUBJECTS[key];
    const sid = subjectId(g, key);
    subjectRows.push(`  (${q(sid)}, ${g}, ${q(key)}, ${q(s.nameAr)}, ${q(s.icon)}, ${q(s.color)}, ${q(s.direction)}, ${i})`);
    for (const t of TERMS) termRows.push(`  (${q(`${sid}-t${t.number}`)}, ${q(sid)}, ${t.number}, ${q(t.nameAr)})`);
  });
}
out.push('insert into public.subjects (id, grade_id, key, name_ar, icon, color, direction, sort) values');
out.push(subjectRows.join(',\n') + '\non conflict (id) do update set name_ar = excluded.name_ar, icon = excluded.icon, color = excluded.color, direction = excluded.direction, sort = excluded.sort;\n');
out.push('insert into public.terms (id, subject_id, number, name_ar) values');
out.push(termRows.join(',\n') + '\non conflict (id) do nothing;\n');

const unitRows: string[] = [];
const lessonRows: string[] = [];
const objectiveRows: string[] = [];
for (const s of seedDatabase.subjects) {
  for (const u of s.units) {
    unitRows.push(`  (${q(u.id)}, ${q(`${s.id}-t${u.term}`)}, ${q(u.title)}, ${u.order})`);
    for (const l of u.lessons) {
      lessonRows.push(`  (${q(l.id)}, ${q(u.id)}, ${q(l.title)}, ${l.order})`);
      l.objectives.forEach((o, i) => objectiveRows.push(`  (${q(l.id)}, ${q(o)}, ${i})`));
    }
  }
}
out.push('insert into public.units (id, term_id, title, sort) values');
out.push(unitRows.join(',\n') + '\non conflict (id) do update set title = excluded.title, sort = excluded.sort;\n');
out.push('insert into public.lessons (id, unit_id, title, sort) values');
out.push(lessonRows.join(',\n') + '\non conflict (id) do update set title = excluded.title, sort = excluded.sort;\n');
out.push('-- الأهداف: نحذف ونعيد الإدراج للدروس المولّدة فقط');
out.push(`delete from public.lesson_objectives where lesson_id in (${lessonRows.length ? seedDatabase.subjects.flatMap((s) => s.units.flatMap((u) => u.lessons.map((l) => q(l.id)))).join(', ') : "''"});`);
out.push('insert into public.lesson_objectives (lesson_id, text, sort) values');
out.push(objectiveRows.join(',\n') + ';\n');

const questionRows = seedDatabase.questions.map((x) => {
  const options = x.type === 'mcq' || x.type === 'fill_blank' ? (x.options ?? null) : null;
  const accepted = x.type === 'fill_blank' ? (x.accepted ?? null) : null;
  return `  (${q(x.id)}, ${q(x.lessonId)}, ${q(x.type)}, ${q(x.prompt)}, ${j(options)}, ${j(x.answer)}, ${j(accepted)}, ${q(x.explanation)}, ${q(x.difficulty)}, ${x.reviewed ? 'true' : 'false'}, 'seed')`;
});
out.push('-- المراجعة لا تُلغى من هنا: سؤال راجعه المشرف يبقى مراجَعاً، وما في reviewed.json يصبح مراجَعاً');
out.push('insert into public.questions (id, lesson_id, type, prompt, options, answer, accepted, explanation, difficulty, reviewed, source) values');
out.push(questionRows.join(',\n') + '\non conflict (id) do update set reviewed = public.questions.reviewed or excluded.reviewed;\n');
// ───── الوسائط: الكتب (روابط) والقنوات والفيديوهات ─────
if (TEXTBOOKS.length) {
  out.push('insert into public.textbooks (grade_id, subject_id, term, part, sort, title, official_url, license_status) values');
  out.push(
    TEXTBOOKS.map(
      (t, i) =>
        `  (${Number(t.subjectId.match(/^g(\d+)-/)?.[1])}, ${q(t.subjectId)}, ${t.term ?? 'null'}, ${t.part ?? 'null'}, ${i}, ${q(t.title)}, ${q(t.officialUrl)}, ${q(t.licenseStatus)})`,
    ).join(',\n') + '\non conflict (official_url) do update set title = excluded.title, term = excluded.term, part = excluded.part, sort = excluded.sort;\n',
  );
}
const channels = CHANNELS.filter((c) => c.channelId || c.handle);
for (const c of channels) {
  out.push(
    `insert into public.channels (youtube_channel_id, handle, name, url, active) values (${q(c.channelId ?? null)}, ${q(c.handle ?? null)}, ${q(c.name)}, ${q(c.url || 'https://www.youtube.com/')}, ${c.active}) on conflict do nothing;`,
  );
}
const channelRef = (key: string) => {
  const c = CHANNELS.find((x) => x.key === key);
  return c?.channelId ? `(select id from public.channels where youtube_channel_id = ${q(c.channelId)})` : `(select id from public.channels where handle = ${q(c?.handle ?? '')})`;
};
const videos = VIDEOS.filter((v) => channels.some((c) => c.key === v.channelKey));
if (videos.length) {
  out.push('insert into public.videos (youtube_id, channel_id, title, thumbnail_url, published_at, duration_sec, suggested_lesson_id, subject_id, lesson_id, match_score, status) values');
  out.push(
    videos
      .map((v) => `  (${q(v.youtubeId)}, ${channelRef(v.channelKey)}, ${q(v.title)}, ${q(v.thumbnailUrl)}, ${q(v.publishedAt)}, ${v.durationSec ?? 'null'}, ${q(v.suggestedLessonId)}, ${q(v.subjectId)}, ${q(v.lessonId)}, ${v.matchScore}, ${q(v.status)})`)
      .join(',\n') + '\non conflict (youtube_id) do nothing;\n',
  );
}

out.push('commit;');

const path = join(__dirname, '..', 'supabase', 'seed.sql');
writeFileSync(path, out.join('\n') + '\n');
console.log(`wrote ${path}: ${seedDatabase.subjects.length} subjects, ${unitRows.length} units, ${lessonRows.length} lessons, ${questionRows.length} questions, ${TEXTBOOKS.length} textbooks, ${channels.length} channels, ${videos.length} videos`);
