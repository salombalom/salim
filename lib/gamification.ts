import type { Difficulty } from '@/lib/types';

/** النقاط لكل إجابة صحيحة حسب الصعوبة */
export const POINTS_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 10,
  medium: 15,
  hard: 20,
};

/** مكافأة الدرجة الكاملة */
export const PERFECT_BONUS = 20;

export interface AnswerOutcome {
  correct: boolean;
  difficulty: Difficulty;
}

export interface QuizScore {
  correct: number;
  total: number;
  /** نسبة مئوية صحيحة من 0 إلى 100 */
  percent: number;
  stars: 0 | 1 | 2 | 3;
  points: number;
}

export function starsForPercent(percent: number): 0 | 1 | 2 | 3 {
  if (percent >= 90) return 3;
  if (percent >= 70) return 2;
  if (percent >= 50) return 1;
  return 0;
}

export function scoreQuiz(outcomes: AnswerOutcome[]): QuizScore {
  const total = outcomes.length;
  const correct = outcomes.filter((o) => o.correct).length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
  let points = outcomes.reduce((sum, o) => sum + (o.correct ? POINTS_BY_DIFFICULTY[o.difficulty] : 0), 0);
  if (total > 0 && correct === total) points += PERFECT_BONUS;
  return { correct, total, percent, stars: starsForPercent(percent), points };
}

/* ───────────── السلسلة اليومية (Streak) ───────────── */

export const APP_TIME_ZONE = 'Asia/Muscat';

/** تاريخ اليوم بصيغة YYYY-MM-DD بتوقيت مسقط (UTC+4 دائماً، بلا توقيت صيفي) */
export function dayKey(date: Date = new Date()): string {
  const muscat = new Date(date.getTime() + 4 * 60 * 60 * 1000);
  return muscat.toISOString().slice(0, 10);
}

/** عدد الأيام بين تاريخين بصيغة YYYY-MM-DD */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export interface StreakState {
  count: number;
  /** آخر يوم أنهى فيه الطالب اختباراً */
  lastDay: string | null;
  best: number;
}

export const EMPTY_STREAK: StreakState = { count: 0, lastDay: null, best: 0 };

/** تحديث السلسلة عند إنهاء نشاط في اليوم `today` */
export function registerActivity(state: StreakState, today: string): StreakState {
  if (state.lastDay === today) return state;
  const gap = state.lastDay ? daysBetween(state.lastDay, today) : Infinity;
  if (gap < 0) return state; // تاريخ الجهاز رجع للخلف: لا نغيّر شيئاً
  const count = gap === 1 ? state.count + 1 : 1;
  return { count, lastDay: today, best: Math.max(state.best, count) };
}

/** السلسلة كما تُعرض اليوم (تصبح 0 إذا فات يوم كامل دون نشاط) */
export function currentStreak(state: StreakState, today: string): number {
  if (!state.lastDay) return 0;
  const gap = daysBetween(state.lastDay, today);
  return gap <= 1 && gap >= 0 ? state.count : 0;
}
