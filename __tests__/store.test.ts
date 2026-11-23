import { scoreQuiz } from '@/lib/gamification';
import { subjectIdFromLesson, useProgress, type AnswerRecord } from '@/lib/store';
import type { Question } from '@/lib/types';

const q = (id: string, difficulty: Question['difficulty'] = 'easy'): Question => ({
  id,
  lessonId: 'g5-math-u1-l1',
  type: 'true_false',
  prompt: id,
  answer: true,
  explanation: '',
  difficulty,
  reviewed: true,
  source: 'seed',
});

const record = (answers: AnswerRecord[], lessonId: string | null = 'g5-math-u1-l1', mode: 'lesson' | 'mistakes' = 'lesson') =>
  useProgress.getState().recordQuiz({
    lessonId,
    subjectId: lessonId ? subjectIdFromLesson(lessonId) : null,
    mode,
    answers,
    score: scoreQuiz(answers.map((a) => ({ correct: a.correct, difficulty: a.question.difficulty }))),
    durationSec: 60,
  });

beforeEach(() => useProgress.getState().reset());

describe('progress store', () => {
  it('adds points, records the best lesson score and starts the streak', () => {
    record([
      { question: q('a'), response: true, correct: true },
      { question: q('b', 'hard'), response: false, correct: false },
    ]);
    const s = useProgress.getState();
    expect(s.points).toBe(10);
    expect(s.lessonBest['g5-math-u1-l1']).toEqual({ percent: 50, stars: 1, attempts: 1 });
    expect(s.streak.count).toBe(1);
    expect(Object.keys(s.mistakes)).toEqual(['b']);
    expect(s.mistakes.b.subjectId).toBe('g5-math');
  });

  it('keeps the best score across attempts', () => {
    record([{ question: q('a'), response: true, correct: true }]);
    record([{ question: q('a'), response: false, correct: false }]);
    expect(useProgress.getState().lessonBest['g5-math-u1-l1']).toEqual({ percent: 100, stars: 3, attempts: 2 });
  });

  it('removes a mistake once it is answered correctly and counts repeated errors', () => {
    record([{ question: q('x'), response: false, correct: false }]);
    record([{ question: q('x'), response: false, correct: false }]);
    expect(useProgress.getState().mistakes.x.wrongCount).toBe(2);
    record([{ question: q('x'), response: true, correct: true }], null, 'mistakes');
    expect(useProgress.getState().mistakes.x).toBeUndefined();
  });

  it('toggles favorites', () => {
    const fav = { type: 'video' as const, id: 'v1', title: 'فيديو' };
    useProgress.getState().toggleFavorite(fav);
    expect(useProgress.getState().favorites).toHaveLength(1);
    useProgress.getState().toggleFavorite(fav);
    expect(useProgress.getState().favorites).toHaveLength(0);
  });

  it('derives the subject id from a lesson id', () => {
    expect(subjectIdFromLesson('g12-chemistry-u1-l2')).toBe('g12-chemistry');
  });
});
