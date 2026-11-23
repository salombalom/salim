/**
 * ملخصات الدروس (للمشرف) — تُحفظ في seed/summaries.json وتُضمَّن في التطبيق وفي supabase/seed.sql.
 *
 *   npm run summaries -- generate [--grade N] [--lesson ID] [--force]   ← يولّد مسودات بـ Claude (يحتاج ANTHROPIC_API_KEY في .env)
 *   npm run summaries -- approve ID... | --grade N | --all               ← اعتماد
 *   npm run summaries -- draft ID...                                     ← إعادة إلى مسودة
 *   npm run summaries -- show ID                                          ← عرض ملخص
 *   npm run summaries -- stats                                            ← عدد المسودات والمعتمد لكل صف
 *
 * مفتاح Claude يبقى على جهاز المشرف أو في أسرار Supabase، ولا يدخل التطبيق أبداً.
 */
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { gradeName, SUBJECTS, type GradeNumber } from '../config/curriculum';
import { seedDatabase } from '../seed';
import {
  buildSummaryPrompt,
  SUMMARY_MODEL,
  SUMMARY_SCHEMA,
  summaryToPlainText,
  validateSummary,
  type SummaryRecord,
} from '../supabase/functions/_shared/summary';

const FILE = join(__dirname, '..', 'seed', 'summaries.json');

type Store = Record<string, SummaryRecord>;
const load = (): Store => JSON.parse(readFileSync(FILE, 'utf8'));
function save(s: Store) {
  const sorted = Object.fromEntries(Object.entries(s).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })));
  writeFileSync(FILE, JSON.stringify(sorted, null, 1) + '\n', 'utf8');
}

function allLessons() {
  return seedDatabase.subjects.flatMap((s) =>
    s.units.flatMap((u) =>
      u.lessons.map((l) => ({
        id: l.id,
        grade: s.grade,
        input: {
          grade: s.grade,
          gradeName: gradeName(s.grade),
          subjectName: SUBJECTS[s.key].nameAr,
          english: SUBJECTS[s.key].direction === 'ltr',
          term: u.term,
          unitTitle: u.title,
          lessonTitle: l.title,
          objectives: l.objectives,
          questions: seedDatabase.questions
            .filter((q) => q.lessonId === l.id)
            .map((q) => ({
              prompt: q.prompt,
              answer: Array.isArray(q.answer) ? q.answer.join(' ') : typeof q.answer === 'boolean' ? (q.answer ? 'صح' : 'خطأ') : q.answer,
              explanation: q.explanation,
            })),
        },
      })),
    ),
  );
}

async function generate(opts: { grade?: number; lesson?: string; force: boolean }) {
  const client = new Anthropic();
  const store = load();
  const targets = allLessons().filter((l) => (!opts.grade || l.grade === opts.grade) && (!opts.lesson || l.id === opts.lesson));
  let done = 0;
  for (const l of targets) {
    if (store[l.id] && !opts.force) continue;
    const { system, user } = buildSummaryPrompt(l.input);
    try {
      const res = await client.beta.messages.create({
        model: SUMMARY_MODEL,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: SUMMARY_SCHEMA } },
        system,
        messages: [{ role: 'user', content: user }],
      });
      if (res.stop_reason === 'refusal') throw new Error('refused');
      if (res.stop_reason === 'max_tokens') throw new Error('truncated');
      const text = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
      store[l.id] = { status: 'draft', content: validateSummary(JSON.parse(text)), model: res.model, updatedAt: new Date().toISOString() };
      save(store); // نحفظ بعد كل درس حتى لا يضيع شيء عند الانقطاع
      done++;
      console.log(`✓ ${l.id}`);
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) throw new Error('مفتاح ANTHROPIC_API_KEY غير صالح أو غير موجود في .env');
      if (e instanceof Anthropic.RateLimitError) {
        console.warn('… تجاوز حد الطلبات، انتظر دقيقة ثم أعد التشغيل (يكمل من حيث توقف).');
        break;
      }
      console.warn(`✗ ${l.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  console.log(`انتهى: ${done} ملخصاً جديداً (مسودات). راجعها ثم: npm run summaries -- approve ...`);
}

function setStatus(ids: string[], status: 'draft' | 'approved') {
  const store = load();
  let n = 0;
  for (const id of ids) {
    if (!store[id]) {
      console.warn(`⚠ لا يوجد ملخص للدرس ${id}`);
      continue;
    }
    if (store[id].status !== status) n++;
    store[id] = { ...store[id], status, updatedAt: new Date().toISOString() };
  }
  save(store);
  console.log(`✓ ${status === 'approved' ? 'اعتُمد' : 'أعيد إلى مسودة'}: ${n}`);
}

function stats() {
  const store = load();
  const per = new Map<number, { total: number; draft: number; approved: number }>();
  for (const l of allLessons()) {
    const cur = per.get(l.grade) ?? { total: 0, draft: 0, approved: 0 };
    cur.total++;
    if (store[l.id]?.status === 'draft') cur.draft++;
    if (store[l.id]?.status === 'approved') cur.approved++;
    per.set(l.grade, cur);
  }
  for (const [g, c] of [...per].sort((a, b) => a[0] - b[0])) console.log(`${gradeName(g as GradeNumber)}: ${c.approved} معتمد، ${c.draft} مسودة، من ${c.total} درساً`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args.shift();
  const flag = (name: string) => {
    const i = args.indexOf(name);
    return i >= 0 ? args.splice(i, 2)[1] : undefined;
  };
  const has = (name: string) => {
    const i = args.indexOf(name);
    if (i >= 0) args.splice(i, 1);
    return i >= 0;
  };
  (async () => {
    if (cmd === 'generate') {
      const grade = flag('--grade');
      const lesson = flag('--lesson');
      await generate({ grade: grade ? Number(grade) : undefined, lesson, force: has('--force') });
    } else if (cmd === 'approve' || cmd === 'draft') {
      const grade = flag('--grade');
      const all = has('--all');
      const ids = all || grade ? allLessons().filter((l) => all || l.grade === Number(grade)).map((l) => l.id).filter((id) => load()[id]) : args;
      setStatus(ids, cmd === 'approve' ? 'approved' : 'draft');
    } else if (cmd === 'show' && args[0]) {
      const rec = load()[args[0]];
      const lesson = allLessons().find((l) => l.id === args[0]);
      console.log(rec ? `[${rec.status}]\n${summaryToPlainText(lesson?.input.lessonTitle ?? args[0], rec.content)}` : 'لا يوجد ملخص');
    } else if (cmd === 'stats') stats();
    else {
      console.log('الاستخدام: npm run summaries -- generate [--grade N] [--lesson ID] [--force] | approve ID…|--grade N|--all | draft ID… | show ID | stats');
      process.exit(1);
    }
  })().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
