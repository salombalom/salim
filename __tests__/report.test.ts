import { buildReportHtml } from '@/lib/reportPdf';
import { activeDaysIn, lastDays, localReport, mapServerReport, studySecondsIn } from '@/lib/report';
import type { AttemptRecord } from '@/lib/store';

const today = '2026-11-23';
const at = (day: string) => Date.parse(`${day}T08:00:00Z`);
const attempt = (lessonId: string, percent: number, day: string): AttemptRecord => ({
  id: `${lessonId}-${day}`,
  lessonId,
  subjectId: lessonId.replace(/-u\d+-l\d+$/, ''),
  mode: 'lesson',
  score: { correct: 0, total: 10, percent, stars: percent >= 90 ? 3 : percent >= 70 ? 2 : percent >= 50 ? 1 : 0, points: 0 },
  durationSec: 60,
  at: at(day),
});

describe('parent report', () => {
  it('lists the last n days in ascending order', () => {
    expect(lastDays(today, 3)).toEqual(['2026-11-21', '2026-11-22', '2026-11-23']);
    expect(lastDays('2026-03-01', 2)).toEqual(['2026-02-28', '2026-03-01']);
  });

  it('builds a local report from device progress', () => {
    const r = localReport(
      {
        attempts: [attempt('g5-math-u1-l1', 40, '2026-11-20'), attempt('g5-math-u1-l1', 80, '2026-11-22'), attempt('g5-arabic-u1-l1', 100, '2026-11-23')],
        lessonBest: { 'g5-math-u1-l1': { percent: 80, stars: 2, attempts: 2 }, 'g5-arabic-u1-l2': { percent: 30, stars: 0, attempts: 1 } },
        mistakes: { a: {} as never, b: {} as never },
        studySeconds: { '2026-11-23': 600, '2026-11-20': 30, '2026-09-01': 999 },
      },
      today,
    );
    expect(r.study).toEqual({ '2026-11-23': 600, '2026-11-20': 30 }); // older than 30 days dropped
    const math = r.subjects.find((s) => s.subjectId === 'g5-math')!;
    expect(math).toMatchObject({ attempts: 2, avgPercent: 60, lessonsDone: 1 });
    expect(r.weakLessons.map((w) => w.lessonId)).toEqual(['g5-arabic-u1-l2']);
    expect(r.recent[0].lessonId).toBe('g5-arabic-u1-l1');
    expect(r.openMistakes).toBe(2);
    expect(studySecondsIn(r, today, 7)).toBe(630);
    expect(activeDaysIn(r, today, 7)).toBe(1); // under a minute does not count
  });

  it('maps the server child_report shape', () => {
    const r = mapServerReport({
      days: 7,
      study: { '2026-11-23': 120 },
      subjects: [{ subject_id: 'g5-math', attempts: 3, avg_percent: 75, lessons_done: 2, last_at: null }],
      weak_lessons: [{ lesson_id: 'g5-math-u1-l2', title: 'x', subject_id: 'g5-math', best_percent: 40 }],
      recent: [],
      open_mistakes: 4,
    });
    expect(r.subjects[0]).toEqual({ subjectId: 'g5-math', attempts: 3, avgPercent: 75, lessonsDone: 2, lastAt: null });
    expect(r.weakLessons[0].bestPercent).toBe(40);
    expect(r.openMistakes).toBe(4);
  });

  it('renders a PDF report without personal data beyond the display name', () => {
    const r = localReport({ attempts: [attempt('g5-math-u1-l1', 40, today)], lessonBest: { 'g5-math-u1-l1': { percent: 40, stars: 0, attempts: 1 } }, mistakes: {}, studySeconds: { [today]: 900 } }, today);
    const html = buildReportHtml({ report: r, header: { name: 'مريم <b>', grade: 5, points: 30, streak: 2 }, today });
    expect(html).toContain('مريم &lt;b&gt;');
    expect(html).toContain('الرياضيات');
    expect(html).toContain('الصف الخامس');
    expect(html.slice(html.indexOf('<body>'))).not.toMatch(/@|\+968/);
  });
});
