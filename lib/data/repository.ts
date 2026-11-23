/**
 * طبقة الوصول إلى المحتوى.
 * المرحلة 1: تقرأ من البيانات المحلية (seed).
 * المرحلة 2: ستُستبدل القراءة بـ Supabase مع إبقاء نفس الواجهة.
 */
import { GRADE_SUBJECTS, SUBJECTS, subjectId, type GradeNumber, type SubjectDefinition } from '@/config/curriculum';
import { generateMathQuestions } from '@/lib/quiz/mathGenerator';
import type { Lesson, Question, SubjectContent, Unit } from '@/lib/types';
import { seedDatabase } from '@/seed';

const subjectsById = new Map(seedDatabase.subjects.map((s) => [s.id, s]));
const lessonsById = new Map<string, { lesson: Lesson; unit: Unit; subject: SubjectContent }>();
for (const subject of seedDatabase.subjects) {
  for (const unit of subject.units) {
    for (const lesson of unit.lessons) lessonsById.set(lesson.id, { lesson, unit, subject });
  }
}
const questionsByLesson = new Map<string, Question[]>();
const questionsById = new Map<string, Question>();
for (const q of seedDatabase.questions) {
  questionsById.set(q.id, q);
  const list = questionsByLesson.get(q.lessonId) ?? [];
  list.push(q);
  questionsByLesson.set(q.lessonId, list);
}

export interface SubjectWithMeta extends SubjectContent {
  meta: SubjectDefinition;
}

export function getSubjectsForGrade(grade: GradeNumber): SubjectWithMeta[] {
  return GRADE_SUBJECTS[grade]
    .map((key) => subjectsById.get(subjectId(grade, key)))
    .filter((s): s is SubjectContent => !!s)
    .map((s) => ({ ...s, meta: SUBJECTS[s.key] }));
}

export function getSubject(id: string): SubjectWithMeta | undefined {
  const s = subjectsById.get(id);
  return s ? { ...s, meta: SUBJECTS[s.key] } : undefined;
}

export function getLesson(id: string) {
  const found = lessonsById.get(id);
  if (!found) return undefined;
  return { ...found, meta: SUBJECTS[found.subject.key] };
}

export function getLessonIdsForSubject(id: string): string[] {
  return subjectsById.get(id)?.units.flatMap((u) => u.lessons.map((l) => l.id)) ?? [];
}

export function getQuestion(id: string): Question | undefined {
  return questionsById.get(id);
}

export interface QuestionFilter {
  /** إظهار الأسئلة غير المراجَعة (للتطوير فقط) */
  includeUnreviewed: boolean;
}

/** أسئلة الدرس المسموح بعرضها */
export function getLessonQuestions(lessonId: string, { includeUnreviewed }: QuestionFilter): Question[] {
  return (questionsByLesson.get(lessonId) ?? []).filter((q) => q.reviewed || includeUnreviewed);
}

/** عدد الأسئلة المولَّدة تلقائياً التي تُضاف لاختبارات الرياضيات */
export const GENERATED_MATH_COUNT = 5;

/**
 * يبني أسئلة اختبار الدرس: الأسئلة الثابتة المسموحة،
 * ولدروس الرياضيات تُضاف أسئلة مولَّدة جديدة في كل مرة.
 */
export function buildLessonQuiz(lessonId: string, filter: QuestionFilter, seed: number): Question[] {
  const fixed = getLessonQuestions(lessonId, filter);
  const info = lessonsById.get(lessonId);
  if (!info || info.subject.key !== 'math') return fixed;
  const generated = generateMathQuestions({ grade: info.subject.grade, count: GENERATED_MATH_COUNT, seed, lessonId });
  return [...fixed, ...generated];
}
