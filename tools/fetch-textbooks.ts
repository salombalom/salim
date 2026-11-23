/**
 * يجمع روابط الكتب المدرسية من «مكتبة المناهج» في موقع وزارة التربية والتعليم
 * (https://home.moe.gov.om/ar/manaheg/0) ويكتب seed/media/textbooks.ts.
 *
 * روابط فقط: يقرأ صفحات الفهرس (HTML) ولا يحمّل أي ملف PDF.
 * التشغيل: npm run textbooks:fetch
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { GRADE_SUBJECTS, type GradeNumber, type SubjectKey } from '../config/curriculum';

const BASE = 'https://home.moe.gov.om';
const LIST = `${BASE}/ar/manaheg/0`;

const GRADE_WORDS: [string, GradeNumber][] = [
  ['الحادي عشر', 11],
  ['الثاني عشر', 12],
  ['الأول', 1],
  ['الثاني', 2],
  ['الثالث', 3],
  ['الرابع', 4],
  ['الخامس', 5],
  ['السادس', 6],
  ['السابع', 7],
  ['الثامن', 8],
  ['التاسع', 9],
  ['العاشر', 10],
];

/** اسم الكتاب في الموقع ← مادة التطبيق (الأطول أولاً) */
const BOOK_SUBJECTS: [string, SubjectKey][] = [
  ['هذا وطني', 'national'],
  ['الفيزياء', 'physics'],
  ['الكيمياء', 'chemistry'],
  ['الأحياء', 'biology'],
  ['سلاسل العلوم', 'science'],
  ['العلوم والبيئة', 'science'],
  ['العلوم', 'science'],
  ['سلاسل الرياضيات', 'math'],
  ['الرياضيات الأساسية', 'math'],
  ['الرياضيات المتقدمة', 'math'],
  ['الرياضيات البحتة', 'math'],
  ['الرياضيات التطبيقية', 'math'],
  ['الرياضيات', 'math'],
  ['التربية الإسلامية', 'islamic'],
  ['ديني حياتي', 'islamic'],
  ['أحب لغتي', 'arabic'],
  ['لغتي الجميلة', 'arabic'],
  ['اللغة العربية', 'arabic'],
  // كتابا اللغة العربية للصفين 11 و12 (بتأكيد المالك)
  ['المؤنس', 'arabic'],
  ['المفيد', 'arabic'],
  ['English', 'english'],
  ['الدراسات الاجتماعية', 'social'],
  ['الهوية والمواطنة', 'social'],
];

export interface RawBook {
  path: string;
  title: string;
}

export interface ClassifiedBook {
  subjectId: string;
  grade: GradeNumber;
  key: SubjectKey;
  term: 1 | 2 | null;
  part: number | null;
  title: string;
  officialUrl: string;
}

const decode = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

export function parseListing(html: string): RawBook[] {
  const out: RawBook[] = [];
  const re = /<a href="(ar\/manaheg\/\d+\/show\/\d+)" class="book-card">[\s\S]*?<h3 class="book-card-title"[^>]*>([\s\S]*?)<\/h3>/g;
  for (let m = re.exec(html); m; m = re.exec(html)) out.push({ path: m[1], title: decode(m[2]) });
  return out;
}

/** يصنّف الكتاب أو يعيد سبب الاستبعاد */
export function classify(b: RawBook): ClassifiedBook | { skip: string } {
  const t = b.title;
  if (t.includes('دليل')) return { skip: 'guide' };
  if (t.includes('الإعاقة')) return { skip: 'special-edition' };
  const grade = GRADE_WORDS.find(([w]) => new RegExp(`الصف ${w}(?:\\s|$|-|\\()`).test(`${t} `))?.[1];
  const name = t.split(' - ')[0].trim();
  const key = BOOK_SUBJECTS.find(([w]) => name === w || name.startsWith(w))?.[1];
  if (!key) return { skip: 'subject-not-in-app' };
  if (!grade) return { skip: 'no-grade' };
  if (!GRADE_SUBJECTS[grade].includes(key)) return { skip: 'subject-not-in-grade' };
  const term = /الفصل (?:الدراسي )?الأول/.test(t) ? 1 : /الفصل (?:الدراسي )?الثاني/.test(t) ? 2 : null;
  const part = t.match(/الجزء (\d+)/);
  return { subjectId: `g${grade}-${key}`, grade, key, term, part: part ? Number(part[1]) : null, title: t, officialUrl: `${BASE}/${b.path}` };
}

async function main() {
  const books = new Map<string, RawBook>();
  for (let page = 0; page < 60; page++) {
    const url = page === 0 ? LIST : `${LIST}/page/${page}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (darsi textbook link index)' } });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    const found = parseListing(await res.text());
    const before = books.size;
    for (const b of found) books.set(b.path, b);
    if (page > 1 && books.size === before) break; // لا جديد: انتهت الصفحات
    await new Promise((r) => setTimeout(r, 500)); // تمهّل احتراماً للموقع
  }

  const kept: ClassifiedBook[] = [];
  const skipped: Record<string, number> = {};
  for (const b of books.values()) {
    const c = classify(b);
    if ('skip' in c) skipped[c.skip] = (skipped[c.skip] ?? 0) + 1;
    else kept.push(c);
  }
  kept.sort((a, b) => a.grade - b.grade || a.key.localeCompare(b.key) || (a.term ?? 0) - (b.term ?? 0) || (a.part ?? 0) - (b.part ?? 0) || a.title.localeCompare(b.title));

  const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const lines = kept.map(
    (b) => `  { subjectId: ${q(b.subjectId)}, term: ${b.term ?? 'null'}, part: ${b.part ?? 'null'}, title: ${q(b.title)}, officialUrl: ${q(b.officialUrl)}, licenseStatus: 'link_only' },`,
  );
  const file = `import type { TextbookEntry } from './types';

/**
 * روابط الكتب المدرسية الرسمية — مولَّد من «مكتبة المناهج» بموقع وزارة التربية والتعليم:
 * ${LIST}
 * روابط فقط: لا نحمّل ملفات الكتب ولا نرفعها. أعد التوليد بـ: npm run textbooks:fetch
 *
 * term: الفصل الدراسي (null = الكتاب للعام كاملاً ويظهر في الفصلين).
 * licenseStatus: 'link_only' (الافتراضي) أو 'permission_granted' (بعد الحصول على إذن رسمي برفع الملف).
 */
export const TEXTBOOKS: TextbookEntry[] = [
${lines.join('\n')}
];
`;
  writeFileSync(join(__dirname, '..', 'seed', 'media', 'textbooks.ts'), file);
  console.log(`الكتب في الموقع: ${books.size} — أُضيف: ${kept.length} — استُبعد:`, skipped);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
