/**
 * اقتراح ربط فيديو يوتيوب بالدرس المناسب حسب عنوانه ووصفه.
 * ملف مستقل بلا اعتماديات: يستخدمه Edge Function (Deno) وأداة tools/suggest-videos.ts والاختبارات (Jest).
 *
 * الخطوات: نستخرج من العنوان الصف والمادة والفصل والوحدة، ثم نقارن كلماته بعناوين الدروس.
 * النتيجة اقتراح فقط — كل فيديو يبقى «بانتظار الموافقة» حتى يراجعه المسؤول.
 */

export type SubjectKey =
  | 'islamic'
  | 'arabic'
  | 'math'
  | 'science'
  | 'english'
  | 'social'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'national';

export interface LessonRef {
  id: string;
  title: string;
  unitTitle: string;
  unitOrder: number;
  term: number;
  grade: number;
  subject: SubjectKey;
}

export interface VideoInfo {
  title: string;
  description?: string;
}

export interface MatchResult {
  lessonId: string | null;
  /** المادة في صفها (مثل g12-biology) عند معرفة الصف والمادة — تُستخدم إذا لم يُعرف الدرس */
  subjectId: string | null;
  score: number;
  detected: { grade: number | null; subject: SubjectKey | null; term: number | null; unit: number | null };
}

/* ───────────── توحيد النص ───────────── */

export function normalizeAr(input: string): string {
  return input
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ───────────── استخراج الصف ───────────── */

// الترتيب مهم: «الحادي عشر» و«الثاني عشر» قبل «الثاني» و«الأول»
const GRADE_WORDS: [string, number][] = [
  ['الحادي عشر', 11],
  ['الثاني عشر', 12],
  ['حادي عشر', 11],
  ['ثاني عشر', 12],
  ['الاول', 1],
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

export function detectGrade(text: string): number | null {
  const t = normalizeAr(text);
  // ملاحظة: \b لا يعمل مع الحروف العربية، لذا نستخدم (^|\s) و(\s|$)
  const num = t.match(/(?:الصف|صف|grade|class)\s*(\d{1,2})(?:\s|$)/) ?? t.match(/(?:^|\s)ص\s?(\d{1,2})(?:\s|$)/) ?? t.match(/(?:^|\s)g(\d{1,2})(?:\s|$)/);
  if (num) {
    const n = Number(num[1]);
    if (n >= 1 && n <= 12) return n;
  }
  for (const [w, n] of GRADE_WORDS) {
    if (new RegExp(`(?:الصف|صف|للصف|لصف)\\s+${normalizeAr(w)}(?:\\s|$)`).test(t)) return n;
  }
  // صيغة قناة مورد: «الأحياء 12 - …» أو «الرياضيات المتقدمة 11 - …»: رقم بعد اسم المادة وقبل أول شَرطة
  const head = text.split(/\s[-–—|]\s?/)[0];
  const bare = normalizeAr(head).match(/(?:^|\s)(\d{1,2})$/);
  if (bare && detectSubject(head)) {
    const n = Number(bare[1]);
    if (n >= 1 && n <= 12) return n;
  }
  return null;
}

/* ───────────── استخراج المادة ───────────── */

const SUBJECT_KEYWORDS: [SubjectKey, string[]][] = [
  // الأكثر تحديداً أولاً
  ['national', ['هذا وطني']],
  ['physics', ['فيزياء', 'الفيزياء']],
  ['chemistry', ['كيمياء', 'الكيمياء']],
  ['biology', ['احياء', 'الاحياء', 'علم الاحياء']],
  ['social', ['دراسات اجتماعيه', 'الدراسات الاجتماعيه', 'اجتماعيات', 'جغرافيا', 'تاريخ']],
  ['islamic', ['تربيه اسلاميه', 'التربيه الاسلاميه', 'اسلاميه', 'قران', 'القران الكريم', 'تجويد', 'فقه', 'حديث', 'سيره']],
  ['english', ['english', 'انجليزي', 'الانجليزي', 'الانجليزيه', 'لغه انجليزيه']],
  ['arabic', ['لغه عربيه', 'اللغه العربيه', 'لغتي', 'نحو', 'املاء', 'بلاغه', 'قواعد اللغه']],
  ['math', ['رياضيات', 'الرياضيات', 'math', 'mathematics']],
  ['science', ['علوم', 'العلوم', 'science']],
];

export function detectSubject(text: string): SubjectKey | null {
  const t = ` ${normalizeAr(text)} `;
  for (const [key, words] of SUBJECT_KEYWORDS) {
    if (words.some((w) => t.includes(` ${normalizeAr(w)} `) || t.includes(` ${normalizeAr(w)}`))) return key;
  }
  return null;
}

/* ───────────── الفصل والوحدة ───────────── */

export function detectTerm(text: string): number | null {
  const t = normalizeAr(text);
  if (/الفصل (?:الدراسي )?(?:الاول|1)(?:\s|$)/.test(t) || /(?:^|\s)ف\s?1(?:\s|$)/.test(t)) return 1;
  if (/الفصل (?:الدراسي )?(?:الثاني|2)(?:\s|$)/.test(t) || /(?:^|\s)ف\s?2(?:\s|$)/.test(t)) return 2;
  return null;
}

const ORDINALS: [string, number][] = [
  ['الاولي', 1],
  ['الثانيه', 2],
  ['الثالثه', 3],
  ['الرابعه', 4],
  ['الخامسه', 5],
  ['السادسه', 6],
  ['السابعه', 7],
  ['الثامنه', 8],
  ['التاسعه', 9],
  ['العاشره', 10],
];

export function detectUnit(text: string): number | null {
  const t = normalizeAr(text);
  const m = t.match(/(?:الوحده|وحده|unit)\s*(\d{1,2})(?:\s|$)/);
  if (m) return Number(m[1]);
  for (const [w, n] of ORDINALS) if (t.includes(`الوحده ${w}`)) return n;
  return null;
}

/* ───────────── تشابه العناوين ───────────── */

const STOP = new Set(
  [
    'في', 'من', 'علي', 'الي', 'عن', 'مع', 'و', 'او', 'ثم', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي', 'ما', 'كيف', 'لماذا',
    'الصف', 'صف', 'للصف', 'الفصل', 'الدراسي', 'الوحده', 'وحده', 'درس', 'الدرس', 'شرح', 'مراجعه', 'حل', 'تمارين',
    'الجزء', 'جزء', 'مورد', 'قناه', 'وزاره', 'التربيه', 'والتعليم', 'سلطنه', 'عمان', 'مقطع', 'فيديو', 'the', 'and', 'of', 'lesson', 'unit', 'grade',
  ].map(normalizeAr),
);

export function tokens(text: string): Set<string> {
  const out = new Set<string>();
  for (let w of normalizeAr(text).split(' ')) {
    if (!w || STOP.has(w) || /^\d+$/.test(w)) continue;
    // إزالة «ال» التعريف وبعض اللواحق الشائعة لتحسين المطابقة
    if (w.startsWith('وال') && w.length > 4) w = w.slice(3);
    else if (w.startsWith('ال') && w.length > 3) w = w.slice(2);
    else if (w.startsWith('بال') && w.length > 4) w = w.slice(3);
    if (w.length > 4 && (w.endsWith('ات') || w.endsWith('ون') || w.endsWith('ين'))) w = w.slice(0, -2);
    if (w.length < 2 || STOP.has(w)) continue;
    out.add(w);
  }
  return out;
}

/** نسبة كلمات عنوان الدرس الموجودة في عنوان الفيديو (0..1) */
export function titleSimilarity(videoText: string, lessonTitle: string): number {
  const a = tokens(videoText);
  const b = tokens(lessonTitle);
  if (b.size === 0 || a.size === 0) return 0;
  let hit = 0;
  for (const w of b) {
    if (a.has(w)) hit += 1;
    else if ([...a].some((x) => x.length >= 4 && w.length >= 4 && (x.startsWith(w) || w.startsWith(x)))) hit += 0.6;
  }
  return Math.min(1, hit / b.size);
}

/* ───────────── المطابقة ───────────── */

/** الحد الأدنى لاقتراح درس (تحته يبقى الفيديو بلا اقتراح ويربطه المسؤول يدوياً) */
export const SUGGEST_THRESHOLD = 0.55;

export function matchVideo(video: VideoInfo, lessons: LessonRef[]): MatchResult {
  const text = `${video.title} ${video.description?.slice(0, 300) ?? ''}`;
  const grade = detectGrade(video.title) ?? detectGrade(text);
  const subject = detectSubject(video.title) ?? detectSubject(text);
  const term = detectTerm(text);
  const unit = detectUnit(video.title);
  const detected = { grade, subject, term, unit };

  let best: { id: string; score: number } | null = null;
  for (const l of lessons) {
    if (grade !== null && l.grade !== grade) continue;
    if (subject !== null && l.subject !== subject) continue;
    const sim = titleSimilarity(video.title, l.title);
    const unitSim = titleSimilarity(video.title, l.unitTitle);
    const score =
      (grade !== null ? 0.25 : 0) +
      (subject !== null ? 0.2 : 0) +
      (term !== null ? (term === l.term ? 0.05 : -0.1) : 0) +
      (unit !== null ? (unit === l.unitOrder ? 0.1 : -0.1) : 0) +
      0.35 * sim +
      0.1 * unitSim;
    if (!best || score > best.score) best = { id: l.id, score };
  }
  // المادة معروفة إذا وُجد لها درس واحد على الأقل في هذا الصف
  const subjectId =
    grade !== null && subject !== null && lessons.some((l) => l.grade === grade && l.subject === subject) ? `g${grade}-${subject}` : null;
  if (!best) return { lessonId: null, subjectId, score: 0, detected };
  const score = Math.round(Math.max(0, Math.min(1, best.score)) * 100) / 100;
  return { lessonId: score >= SUGGEST_THRESHOLD ? best.id : null, subjectId, score, detected };
}

/* ───────────── أدوات يوتيوب ───────────── */

/** مدة ISO 8601 (مثل PT12M5S) إلى ثوانٍ */
export function parseIsoDuration(iso: string | undefined | null): number | null {
  const m = iso?.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const [, d, h, min, s] = m.map((x) => Number(x ?? 0));
  return d * 86400 + h * 3600 + min * 60 + s;
}

/** يستخرج معرّف القناة أو المعرّف (@handle) من رابط أو نص */
export function parseChannelRef(input: string): { channelId?: string; handle?: string } | null {
  const v = input.trim();
  const id = v.match(/(UC[\w-]{22})/);
  if (id) return { channelId: id[1] };
  const handle = v.match(/@([\w.\-؀-ۿ]{3,})/);
  if (handle) return { handle: handle[1] };
  return null;
}
