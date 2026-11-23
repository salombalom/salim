import { GRADE_SUBJECTS, GRADES, subjectId } from '@/config/curriculum';
import { isCorrect } from '@/lib/quiz/grading';
import { buildLessonQuiz, getLessonQuestions } from '@/lib/data/repository';
import { seedDatabase } from '@/seed';

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

  it('marks every seed question as unreviewed', () => {
    expect(questions.every((q) => q.reviewed === false && q.source === 'seed')).toBe(true);
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
