/**
 * ملخصات الدروس — مشتركة بين Edge Function «generate-summary» وأداة tools/summaries.ts و Jest.
 * بلا اعتماديات: تبني الطلب (التعليمات + المخطط) وتتحقق من الرد فقط.
 * الاستدعاء الفعلي لـ Claude API يحدث في الخادم أو في أداة المشرف، ولا يحدث أبداً داخل التطبيق.
 */

export interface SummaryDefinition {
  term: string;
  meaning: string;
}

/** محتوى الملخص (يطابق عمود summaries.content) */
export interface SummaryContent {
  /** فقرة قصيرة تعرّف بالدرس */
  overview: string;
  /** أهم الأفكار، 3–6 نقاط */
  concepts: string[];
  /** مصطلحات وتعريفاتها، 0–5 */
  definitions: SummaryDefinition[];
  /** مثال محلول أو توضيحي (اختياري) */
  example?: string;
  /** أسئلة مراجعة سريعة بلا إجابات، 2–4 */
  review: string[];
}

export type SummaryStatus = 'draft' | 'approved';

export interface SummaryRecord {
  status: SummaryStatus;
  content: SummaryContent;
  /** مصدر الملخص: نموذج Claude المستخدم */
  model: string;
  updatedAt: string;
}

export const SUMMARY_MODEL = 'claude-opus-5-5';

export interface SummaryLessonInput {
  grade: number;
  gradeName: string;
  subjectName: string;
  /** المواد الإنجليزية تُكتب ملخصاتها بالإنجليزية */
  english: boolean;
  term: number;
  unitTitle: string;
  lessonTitle: string;
  objectives: string[];
  /** أسئلة الدرس (للسياق فقط — لا تُنسخ في الملخص) */
  questions: { prompt: string; answer: string; explanation: string }[];
}

/** JSON Schema لمخرجات Claude (output_config.format) */
export const SUMMARY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['overview', 'concepts', 'definitions', 'example', 'review'],
  properties: {
    overview: { type: 'string' },
    concepts: { type: 'array', items: { type: 'string' } },
    definitions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['term', 'meaning'],
        properties: { term: { type: 'string' }, meaning: { type: 'string' } },
      },
    },
    example: { type: 'string' },
    review: { type: 'array', items: { type: 'string' } },
  },
} as const;

const SYSTEM_AR = `أنت معلم خبير في المناهج العمانية، تكتب ملخصات دروس قصيرة وواضحة لطلاب المدارس في سلطنة عُمان.
قواعد ملزمة:
- اكتب نصاً أصلياً من عندك. لا تنسخ أي نص من الكتب المدرسية أو من أي موقع.
- اكتب بالعربية الفصحى البسيطة المناسبة لعمر الطالب في الصف المذكور. (إذا قيل لك إن المادة إنجليزية فاكتب بالإنجليزية البسيطة.)
- التزم بموضوع الدرس وأهدافه فقط، ولا تضف معلومات خارج مستوى الصف.
- تحقق من صحة كل معلومة علمية أو شرعية أو لغوية؛ إن لم تكن متأكداً فاحذفها.
- لا تستخدم الرموز التعبيرية (emoji) ولا تنسيق Markdown.
الشكل:
- overview: جملتان أو ثلاث تعرّف بالدرس.
- concepts: من 3 إلى 6 أفكار رئيسية، كل فكرة جملة أو جملتان.
- definitions: من 0 إلى 5 مصطلحات مهمة مع تعريف قصير لكل منها (اتركها فارغة إن لم يكن في الدرس مصطلحات).
- example: مثال توضيحي أو مسألة محلولة قصيرة، أو نص فارغ إن لم يناسب الدرس.
- review: من 2 إلى 4 أسئلة مراجعة قصيرة بلا إجابات، مختلفة عن أسئلة الاختبار.`;

export function buildSummaryPrompt(input: SummaryLessonInput): { system: string; user: string } {
  const q = input.questions
    .slice(0, 12)
    .map((x, i) => `${i + 1}. ${x.prompt} ← ${x.answer}${x.explanation ? ` (${x.explanation})` : ''}`)
    .join('\n');
  const user = [
    `الصف: ${input.gradeName}`,
    `المادة: ${input.subjectName}${input.english ? ' (مادة إنجليزية: اكتب الملخص بالإنجليزية)' : ''}`,
    `الفصل الدراسي: ${input.term === 2 ? 'الثاني' : 'الأول'}`,
    `الوحدة: ${input.unitTitle}`,
    `الدرس: ${input.lessonTitle}`,
    `أهداف الدرس:\n${input.objectives.map((o) => `- ${o}`).join('\n')}`,
    q ? `أسئلة الاختبار الحالية (للسياق فقط، لا تكررها):\n${q}` : '',
    'اكتب ملخص هذا الدرس.',
  ]
    .filter(Boolean)
    .join('\n\n');
  return { system: SYSTEM_AR, user };
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const EMOJI = /\p{Extended_Pictographic}/u;

/** يتحقق من الرد ويطبّعه. يرمي خطأ يشرح المشكلة إن كان غير صالح. */
export function validateSummary(raw: unknown): SummaryContent {
  if (!raw || typeof raw !== 'object') throw new Error('summary: not an object');
  const r = raw as Record<string, unknown>;
  const overview = str(r.overview);
  const concepts = Array.isArray(r.concepts) ? r.concepts.map(str).filter(Boolean) : [];
  const review = Array.isArray(r.review) ? r.review.map(str).filter(Boolean) : [];
  const definitions = Array.isArray(r.definitions)
    ? r.definitions
        .map((d) => ({ term: str((d as SummaryDefinition)?.term), meaning: str((d as SummaryDefinition)?.meaning) }))
        .filter((d) => d.term && d.meaning)
    : [];
  const example = str(r.example);
  if (!overview) throw new Error('summary: empty overview');
  if (concepts.length < 2) throw new Error('summary: needs at least 2 concepts');
  if (review.length < 1) throw new Error('summary: needs at least 1 review question');
  const all = [overview, example, ...concepts, ...review, ...definitions.flatMap((d) => [d.term, d.meaning])];
  if (all.some((t) => EMOJI.test(t))) throw new Error('summary: contains emoji');
  return {
    overview,
    concepts: concepts.slice(0, 6),
    definitions: definitions.slice(0, 5),
    ...(example ? { example } : {}),
    review: review.slice(0, 4),
  };
}

/** نص عادي للملخص (للبحث والمشاركة) */
export function summaryToPlainText(title: string, s: SummaryContent): string {
  const lines = [title, '', s.overview, '', 'أهم الأفكار:', ...s.concepts.map((c) => `• ${c}`)];
  if (s.definitions.length) lines.push('', 'مصطلحات:', ...s.definitions.map((d) => `• ${d.term}: ${d.meaning}`));
  if (s.example) lines.push('', 'مثال:', s.example);
  lines.push('', 'راجع نفسك:', ...s.review.map((r, i) => `${i + 1}. ${r}`));
  return lines.join('\n');
}
