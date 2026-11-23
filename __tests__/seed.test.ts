import { GRADE_SUBJECTS, GRADES, subjectId } from '@/config/curriculum';
import { isCorrect } from '@/lib/quiz/grading';
import { buildLessonQuiz, getLessonQuestions } from '@/lib/data/repository';
import { seedDatabase } from '@/seed';
import reviewedIds from '@/seed/reviewed.json';

const { subjects, questions } = seedDatabase;

describe('seed content', () => {
  it('has at least one unit with ≥10 questions for every subject in every grade', () => {
    for (const grade of GRADES) {
      for (const key of GRADE_SUBJECTS[grade]) {
        const s = subjects.find((x) => x.id === subjectId(grade, key));
        expect(s).toBeDefined();
        expect(s!.units.length).toBeGreaterThanOrEqual(1);
        for (const unit of s!.units) {
          const lessonIds = new Set(unit.lessons.map((l) => l.id));
          const count = questions.filter((q) => lessonIds.has(q.lessonId)).length;
          expect(count).toBeGreaterThanOrEqual(10);
        }
      }
    }
  });

  it('has unique ids', () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
  });

  it('has a unit with ≥10 questions in both terms for every subject', () => {
    for (const s of subjects) {
      for (const term of [1, 2] as const) {
        const units = s.units.filter((u) => u.term === term);
        expect(units.length).toBeGreaterThanOrEqual(1);
        const lessonIds = new Set(units.flatMap((u) => u.lessons.map((l) => l.id)));
        expect(questions.filter((q) => lessonIds.has(q.lessonId)).length).toBeGreaterThanOrEqual(10);
      }
    }
    expect(questions.length).toBe(1440);
  });

  it('marks seed questions reviewed only when listed in reviewed.json', () => {
    const reviewed = new Set(reviewedIds as string[]);
    for (const q of questions) {
      expect(q.source).toBe('seed');
      expect(q.reviewed).toBe(reviewed.has(q.id));
    }
  });

  it('reviewed.json only names existing questions', () => {
    const ids = new Set(questions.map((q) => q.id));
    for (const id of reviewedIds as string[]) expect(ids.has(id)).toBe(true);
  });

  it('has well-formed questions whose stored answer grades as correct', () => {
    for (const q of questions) {
      expect(q.prompt.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      if (q.type === 'mcq') {
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.options).toContain(q.answer);
      }
      if (q.type === 'fill_blank') {
        expect(q.prompt).toContain('____');
        if (q.options) expect(q.options).toContain(q.answer);
      }
      if (q.type === 'word_order') expect(q.answer.length).toBeGreaterThanOrEqual(3);
      expect(isCorrect(q, q.answer)).toBe(true);
    }
  });

  it('every lesson has objectives', () => {
    for (const s of subjects) for (const u of s.units) for (const l of u.lessons) expect(l.objectives.length).toBeGreaterThan(0);
  });
});

describe('question visibility', () => {
  const lessonId = 'g1-islamic-u1-l1';

  it('hides unreviewed questions from students', () => {
    expect(getLessonQuestions(lessonId, { includeUnreviewed: false })).toHaveLength(0);
  });

  it('shows them in development mode', () => {
    expect(getLessonQuestions(lessonId, { includeUnreviewed: true }).length).toBeGreaterThan(0);
  });

  it('adds generated questions to math quizzes even when nothing is reviewed', () => {
    const quiz = buildLessonQuiz('g3-math-u1-l1', { includeUnreviewed: false }, 7);
    expect(quiz.length).toBeGreaterThan(0);
    expect(quiz.every((q) => q.reviewed)).toBe(true);
  });
});
