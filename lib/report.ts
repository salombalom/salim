/**
 * تقرير ولي الأمر — شكل واحد لمصدرين:
 *  - محلي: من تقدّم هذا الجهاز (الوضع المحلي أو قبل تسجيل الدخول).
 *  - خادم: من الدالة child_report (ولي أمر مرتبط برمز).
 * التقرير مجمّع فقط: وقت الدراسة، ومتوسط الدرجات لكل مادة، والدروس التي تحتاج مراجعة. لا يعرض الإجابات.
 */
import { daysBetween, dayKey } from '@/lib/gamification';
import { getLesson, getLessonIdsForSubject } from '@/lib/data/repository';
import type { AttemptRecord, LessonBest, MistakeRecord } from '@/lib/store';

export interface ReportSubject {
  subjectId: string;
  attempts: number;
  avgPercent: number;
  lessonsDone: number;
  lastAt: string | null;
}

export interface ChildReport {
  days: number;
  /** ثواني الدراسة لكل يوم (YYYY-MM-DD) */
  study: Record<string, number>;
  subjects: ReportSubject[];
  weakLessons: { lessonId: string; title: string; subjectId: string; bestPercent: number }[];
  recent: { lessonId: string | null; title: string | null; subjectId: string | null; percent: number; stars: number; at: string }[];
  openMistakes: number;
}

/** آخر n يوماً بترتيب تصاعدي، بتوقيت مسقط */
export function lastDays(today: string, n: number): string[] {
  const base = Date.parse(`${today}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) => new Date(base - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10));
}

export function studySecondsIn(report: ChildReport, today: string, n: number): number {
  return lastDays(today, n).reduce((sum, d) => sum + (report.study[d] ?? 0), 0);
}

export function activeDaysIn(report: ChildReport, today: string, n: number): number {
  return lastDays(today, n).filter((d) => (report.study[d] ?? 0) >= 60).length;
}

/** تقرير من بيانات هذا الجهاز */
export function localReport(
  p: { attempts: AttemptRecord[]; lessonBest: Record<string, LessonBest>; mistakes: Record<string, MistakeRecord>; studySeconds: Record<string, number> },
  today: string = dayKey(),
  days = 30,
): ChildReport {
  const study: Record<string, number> = {};
  for (const [d, s] of Object.entries(p.studySeconds)) {
    const age = daysBetween(d, today);
    if (age >= 0 && age < days) study[d] = s;
  }

  const bySubject = new Map<string, { attempts: number; sum: number; last: number }>();
  for (const a of p.attempts) {
    if (!a.subjectId) continue;
    const cur = bySubject.get(a.subjectId) ?? { attempts: 0, sum: 0, last: 0 };
    cur.attempts++;
    cur.sum += a.score.percent;
    cur.last = Math.max(cur.last, a.at);
    bySubject.set(a.subjectId, cur);
  }
  const subjects: ReportSubject[] = [...bySubject]
    .map(([subjectId, s]) => ({
      subjectId,
      attempts: s.attempts,
      avgPercent: Math.round(s.sum / s.attempts),
      lessonsDone: getLessonIdsForSubject(subjectId).filter((id) => (p.lessonBest[id]?.stars ?? 0) >= 1).length,
      lastAt: s.last ? new Date(s.last).toISOString() : null,
    }))
    .sort((a, b) => a.subjectId.localeCompare(b.subjectId, 'en', { numeric: true }));

  const weakLessons = Object.entries(p.lessonBest)
    .filter(([, b]) => b.percent < 70)
    .map(([lessonId, b]) => {
      const info = getLesson(lessonId);
      return info ? { lessonId, title: info.lesson.title, subjectId: info.subject.id, bestPercent: b.percent } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => a.bestPercent - b.bestPercent)
    .slice(0, 8);

  const recent = [...p.attempts]
    .sort((a, b) => b.at - a.at)
    .slice(0, 10)
    .map((a) => ({
      lessonId: a.lessonId,
      title: a.lessonId ? (getLesson(a.lessonId)?.lesson.title ?? null) : null,
      subjectId: a.subjectId,
      percent: a.score.percent,
      stars: a.score.stars,
      at: new Date(a.at).toISOString(),
    }));

  return { days, study, subjects, weakLessons, recent, openMistakes: Object.keys(p.mistakes).length };
}

type Json = Record<string, any>;

/** يحوّل رد الدالة child_report إلى ChildReport */
export function mapServerReport(r: Json): ChildReport {
  return {
    days: r.days ?? 30,
    study: r.study ?? {},
    subjects: (r.subjects ?? []).map((s: Json) => ({
      subjectId: s.subject_id,
      attempts: s.attempts,
      avgPercent: s.avg_percent,
      lessonsDone: s.lessons_done,
      lastAt: s.last_at ?? null,
    })),
    weakLessons: (r.weak_lessons ?? []).map((w: Json) => ({ lessonId: w.lesson_id, title: w.title, subjectId: w.subject_id, bestPercent: w.best_percent })),
    recent: (r.recent ?? []).map((x: Json) => ({ lessonId: x.lesson_id, title: x.title, subjectId: x.subject_id, percent: x.percent, stars: x.stars, at: x.at })),
    openMistakes: Number(r.open_mistakes ?? 0),
  };
}
