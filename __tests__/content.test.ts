import { mapSubjects, useContent } from '@/lib/data/contentStore';
import { getLesson, getLessonQuestions, getSubjectsForGrade } from '@/lib/data/repository';
import type { Question } from '@/lib/types';

const remoteRows = [
  {
    id: 'g5-math',
    key: 'math',
    sort: 2,
    terms: [
      {
        number: 1,
        units: [
          {
            id: 'g5-math-u1',
            title: 'الكسور (من الخادم)',
            sort: 1,
            lessons: [
              { id: 'g5-math-u1-l2', title: 'درس ثانٍ', sort: 2, lesson_objectives: [] },
              { id: 'g5-math-u1-l1', title: 'درس أول', sort: 1, lesson_objectives: [{ text: 'ب', sort: 1 }, { text: 'أ', sort: 0 }] },
            ],
          },
        ],
      },
    ],
  },
  { id: 'g5-unknown', key: 'astrology', sort: 9, terms: [] },
];

const reviewed: Question = {
  id: 'g5-math-u1-l1-q1',
  lessonId: 'g5-math-u1-l1',
  type: 'true_false',
  prompt: 'سؤال من الخادم',
  answer: true,
  explanation: '',
  difficulty: 'easy',
  reviewed: true,
  source: 'admin',
};

afterEach(() => useContent.setState({ grades: {}, version: useContent.getState().version + 1 }));

describe('remote content', () => {
  it('maps nested rows, sorts lessons and objectives, and skips unknown subjects', () => {
    const [math, ...rest] = mapSubjects(remoteRows, 5);
    expect(rest).toHaveLength(0);
    expect(math.units[0].lessons.map((l) => l.id)).toEqual(['g5-math-u1-l1', 'g5-math-u1-l2']);
    expect(math.units[0].lessons[0].objectives).toEqual(['أ', 'ب']);
  });

  it('uses bundled content until a grade is downloaded, then the server version', () => {
    expect(getSubjectsForGrade(5)).toHaveLength(6);
    useContent.setState({ grades: { 5: { subjects: mapSubjects(remoteRows, 5), questions: [reviewed], fetchedAt: 1 } }, version: 99 });
    const subjects = getSubjectsForGrade(5);
    expect(subjects.map((s) => s.key)).toEqual(['math']);
    expect(getLesson('g5-math-u1-l1')?.unit.title).toBe('الكسور (من الخادم)');
  });

  it('shows server-reviewed questions to students, and bundled unreviewed ones only in dev mode', () => {
    useContent.setState({ grades: { 5: { subjects: mapSubjects(remoteRows, 5), questions: [reviewed], fetchedAt: 1 } }, version: 100 });
    expect(getLessonQuestions('g5-math-u1-l1', { includeUnreviewed: false }).map((q) => q.id)).toEqual(['g5-math-u1-l1-q1']);
    const dev = getLessonQuestions('g5-math-u1-l1', { includeUnreviewed: true });
    expect(dev[0].prompt).toBe('سؤال من الخادم'); // نسخة الخادم تغلب النسخة المضمّنة
    expect(dev.length).toBeGreaterThan(1);
    expect(new Set(dev.map((q) => q.id)).size).toBe(dev.length);
  });
});
