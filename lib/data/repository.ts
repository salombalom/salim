/**
 * طبقة الوصول إلى المحتوى.
 * - المحتوى المضمَّن في التطبيق (seed) هو الاحتياط عند عدم الاتصال.
 * - عند ربط Supabase يُنزَّل محتوى الصف ويُخزَّن محلياً (contentStore) ويحلّ محل المضمَّن.
 * - الدوال متزامنة (sync) وتقرأ من فهرس يُعاد بناؤه عند تغيّر المحتوى.
 */
import { GRADE_SUBJECTS, SUBJECTS, subjectId, type GradeNumber, type SubjectDefinition } from '@/config/curriculum';
import { generateMathQuestions } from '@/lib/quiz/mathGenerator';
import type { Lesson, Question, SubjectContent, Unit } from '@/lib/types';
import { seedDatabase } from '@/seed';

import { useContent } from './contentStore';

interface Index {
  subjectsById: Map<string, SubjectContent>;
  lessonsById: Map<string, { lesson: Lesson; unit: Unit; subject: SubjectContent }>;
  /** أسئلة من الخادم (المراجَعة فقط بحكم RLS) */
  remoteByLesson: Map<string, Question[]>;
  /** أسئلة seed المضمّنة (غير مراجَعة) — تُعرض في وضع التطوير فقط */
  seedByLesson: Map<string, Question[]>;
  questionsById: Map<string, Question>;
}

function group(questions: Question[]) {
  const m = new Map<string, Question[]>();
  for (const q of questions) m.set(q.lessonId, [...(m.get(q.lessonId) ?? []), q]);
  return m;
}

const seedByLesson = group(seedDatabase.questions);

/** يبني الفهرس من المحتوى المضمَّن، مع استبدال الصفوف التي نزّلناها من الخادم */
function buildIndex(): Index {
  const remote = useContent.getState().grades;
  const remoteGrades = new Set(Object.keys(remote).map(Number));
  const subjects = [
    ...seedDatabase.subjects.filter((s) => !remoteGrades.has(s.grade)),
    ...Object.values(remote).flatMap((g) => g?.subjects ?? []),
  ];
  const remoteQuestions = Object.values(remote).flatMap((g) => g?.questions ?? []);

  const subjectsById = new Map(subjects.map((s) => [s.id, s]));
  const lessonsById: Index['lessonsById'] = new Map();
  for (const subject of subjects) for (const unit of subject.units) for (const lesson of unit.lessons) lessonsById.set(lesson.id, { lesson, unit, subject });
  const questionsById = new Map<string, Question>();
  for (const q of [...seedDatabase.questions, ...remoteQuestions]) questionsById.set(q.id, q);
  return { subjectsById, lessonsById, remoteByLesson: group(remoteQuestions), seedByLesson, questionsById };
}

let cached: Index | null = null;
let cachedVersion = -1;
function idx(): Index {
  const v = useContent.getState().version;
  if (!cached || v !== cachedVersion) {
    cached = buildIndex();
    cachedVersion = v;
  }
  return cached;
}

export interface SubjectWithMeta extends SubjectContent {
  meta: SubjectDefinition;
}

export function getSubjectsForGrade(grade: GradeNumber): SubjectWithMeta[] {
  return GRADE_SUBJECTS[grade]
    .map((key) => idx().subjectsById.get(subjectId(grade, key)))
    .filter((s): s is SubjectContent => !!s)
    .map((s) => ({ ...s, meta: SUBJECTS[s.key] }));
}

export function getSubject(id: string): SubjectWithMeta | undefined {
  const s = idx().subjectsById.get(id);
  return s ? { ...s, meta: SUBJECTS[s.key] } : undefined;
}

export function getLesson(id: string) {
  const found = idx().lessonsById.get(id);
  if (!found) return undefined;
  return { ...found, meta: SUBJECTS[found.subject.key] };
}

export function getLessonIdsForSubject(id: string): string[] {
  return idx().subjectsById.get(id)?.units.flatMap((u) => u.lessons.map((l) => l.id)) ?? [];
}

export function getQuestion(id: string): Question | undefined {
  return idx().questionsById.get(id);
}

export interface QuestionFilter {
  /** إظهار الأسئلة غير المراجَعة (للتطوير فقط) */
  includeUnreviewed: boolean;
}

/** أسئلة الدرس المسموح بعرضها */
export function getLessonQuestions(lessonId: string, { includeUnreviewed }: QuestionFilter): Question[] {
  const i = idx();
  const remote = i.remoteByLesson.get(lessonId) ?? [];
  const ids = new Set(remote.map((q) => q.id));
  const local = (i.seedByLesson.get(lessonId) ?? []).filter((q) => !ids.has(q.id));
  return [...remote, ...local].filter((q) => q.reviewed || includeUnreviewed);
}

/** عدد الأسئلة المولَّدة تلقائياً التي تُضاف لاختبارات الرياضيات */
export const GENERATED_MATH_COUNT = 5;

/**
 * يبني أسئلة اختبار الدرس: الأسئلة الثابتة المسموحة،
 * ولدروس الرياضيات تُضاف أسئلة مولَّدة جديدة في كل مرة.
 */
export function buildLessonQuiz(lessonId: string, filter: QuestionFilter, seed: number): Question[] {
  const fixed = getLessonQuestions(lessonId, filter);
  const info = idx().lessonsById.get(lessonId);
  if (!info || info.subject.key !== 'math') return fixed;
  const generated = generateMathQuestions({ grade: info.subject.grade, count: GENERATED_MATH_COUNT, seed, lessonId });
  return [...fixed, ...generated];
}
