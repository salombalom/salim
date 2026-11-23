/**
 * أداة مراجعة الأسئلة (للمعلم/المشرف).
 *
 *   npm run questions -- export [ملف.csv] [--grade 5]   ← يكتب ورقة مراجعة تُفتح في Excel
 *   npm run questions -- import ملف.csv                  ← يقرأ عمود «معتمد» ويحدّث seed/reviewed.json
 *   npm run questions -- stats                            ← عدد الأسئلة المعتمدة لكل صف
 *
 * في عمود «معتمد» اكتب: نعم / 1 / x / ✓ للسؤال المعتمد، واتركه فارغاً لغير المعتمد.
 * بعد الاستيراد: npm test ثم npm run db:seed-sql (إن كنت تستخدم Supabase).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { SUBJECTS, gradeName, type GradeNumber, type SubjectKey } from '../config/curriculum';
import type { Question } from '../lib/types';
import { seedDatabase } from '../seed';

const ROOT = join(__dirname, '..');
const REVIEWED_FILE = join(ROOT, 'seed', 'reviewed.json');

const TYPE_AR: Record<Question['type'], string> = {
  mcq: 'اختيار من متعدد',
  true_false: 'صح أو خطأ',
  fill_blank: 'أكمل الفراغ',
  word_order: 'ترتيب كلمات',
};
const DIFF_AR = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' } as const;
const HEADERS = ['المعرّف', 'الصف', 'المادة', 'الفصل', 'الوحدة', 'الدرس', 'النوع', 'السؤال', 'الخيارات', 'الإجابة', 'الشرح', 'الصعوبة', 'معتمد'];
const YES = new Set(['نعم', 'yes', 'y', '1', 'x', '✓', '✔', 'true', 'معتمد']);

function readReviewed(): string[] {
  return JSON.parse(readFileSync(REVIEWED_FILE, 'utf8')) as string[];
}

function lessonIndex() {
  const map = new Map<string, { grade: GradeNumber; key: SubjectKey; term: number; unit: string; lesson: string }>();
  for (const s of seedDatabase.subjects)
    for (const u of s.units)
      for (const l of u.lessons) map.set(l.id, { grade: s.grade, key: s.key, term: u.term, unit: u.title, lesson: l.title });
  return map;
}

function answerText(q: Question): string {
  if (q.type === 'true_false') return q.answer ? 'صح' : 'خطأ';
  if (q.type === 'word_order') return q.answer.join(' ');
  if (q.type === 'fill_blank' && q.accepted?.length) return `${q.answer} (يُقبل أيضاً: ${q.accepted.join('، ')})`;
  return q.answer;
}

const csvCell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** محلّل CSV بسيط يدعم الاقتباس والأسطر داخل الخلية */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',' || c === ';' || c === '\t') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim()));
}

function exportCsv(file: string, grade?: number) {
  const reviewed = new Set(readReviewed());
  const idx = lessonIndex();
  const lines = [HEADERS.join(',')];
  let n = 0;
  for (const q of seedDatabase.questions) {
    const l = idx.get(q.lessonId)!;
    if (grade && l.grade !== grade) continue;
    const options = q.type === 'mcq' || (q.type === 'fill_blank' && q.options) ? (q.options ?? []).join(' | ') : '';
    lines.push(
      [q.id, gradeName(l.grade), SUBJECTS[l.key].nameAr, String(l.term), l.unit, l.lesson, TYPE_AR[q.type], q.prompt, options, answerText(q), q.explanation, DIFF_AR[q.difficulty], reviewed.has(q.id) ? 'نعم' : '']
        .map(csvCell)
        .join(','),
    );
    n++;
  }
  // BOM حتى يفتح Excel الملف بترميز UTF-8 وتظهر العربية صحيحة
  writeFileSync(file, '﻿' + lines.join('\r\n') + '\r\n', 'utf8');
  console.log(`✓ كُتب ${n} سؤالاً في ${file}`);
}

function importCsv(file: string) {
  const rows = parseCsv(readFileSync(file, 'utf8'));
  const header = rows.shift() ?? [];
  const idCol = header.findIndex((h) => h.trim() === 'المعرّف' || h.trim().toLowerCase() === 'id');
  const okCol = header.findIndex((h) => h.trim() === 'معتمد' || h.trim().toLowerCase() === 'reviewed');
  if (idCol < 0 || okCol < 0) throw new Error('لم أجد عمودي «المعرّف» و«معتمد» في الصف الأول.');

  const known = new Set(seedDatabase.questions.map((q) => q.id));
  const reviewed = new Set(readReviewed());
  let added = 0;
  let removed = 0;
  const unknown: string[] = [];
  for (const r of rows) {
    const id = (r[idCol] ?? '').trim();
    if (!id) continue;
    if (!known.has(id)) {
      unknown.push(id);
      continue;
    }
    const ok = YES.has((r[okCol] ?? '').trim().toLowerCase());
    if (ok && !reviewed.has(id)) {
      reviewed.add(id);
      added++;
    } else if (!ok && reviewed.has(id)) {
      reviewed.delete(id);
      removed++;
    }
  }
  const sorted = [...reviewed].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  writeFileSync(REVIEWED_FILE, JSON.stringify(sorted, null, 1) + '\n', 'utf8');
  console.log(`✓ اعتُمد ${added} سؤالاً جديداً، وأُلغي اعتماد ${removed}. المجموع الآن: ${sorted.length} من ${known.size}.`);
  if (unknown.length) console.warn(`⚠ تجاهلت ${unknown.length} معرّفاً غير موجود، مثل: ${unknown.slice(0, 3).join('، ')}`);
}

function stats() {
  const reviewed = new Set(readReviewed());
  const idx = lessonIndex();
  const per = new Map<number, [number, number]>();
  for (const q of seedDatabase.questions) {
    const g = idx.get(q.lessonId)!.grade;
    const cur = per.get(g) ?? [0, 0];
    cur[1]++;
    if (reviewed.has(q.id)) cur[0]++;
    per.set(g, cur);
  }
  for (const [g, [ok, all]] of [...per].sort((a, b) => a[0] - b[0])) console.log(`${gradeName(g as GradeNumber)}: ${ok}/${all}`);
  console.log(`المجموع: ${reviewed.size}/${seedDatabase.questions.length}`);
}

if (require.main === module) {
  const [cmd, ...rest] = process.argv.slice(2);
  const gi = rest.indexOf('--grade');
  const grade = gi >= 0 ? Number(rest.splice(gi, 2)[1]) : undefined;
  if (cmd === 'export') exportCsv(rest[0] ?? join(ROOT, grade ? `questions-grade${grade}.csv` : 'questions-review.csv'), grade);
  else if (cmd === 'import' && rest[0]) importCsv(rest[0]);
  else if (cmd === 'stats') stats();
  else {
    console.log('الاستخدام: npm run questions -- export [ملف.csv] [--grade N] | import ملف.csv | stats');
    process.exit(1);
  }
}
