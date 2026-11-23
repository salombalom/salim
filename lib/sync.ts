/**
 * مزامنة التقدّم مع Supabase.
 * - التطبيق يحفظ كل شيء محلياً أولاً (يعمل دون إنترنت).
 * - عند تسجيل الدخول تُرفع المحاولات عبر دالة الخادم record_attempt، والخادم يحسب النقاط والسلسلة.
 * - المحاولات التي لم تُرفع (انقطاع الاتصال) تبقى في قائمة انتظار وتُرفع لاحقاً.
 */
import { dayKey, type StreakState } from '@/lib/gamification';
import {
  subjectIdFromLesson,
  useProgress,
  useSettings,
  type AnswerRecord,
  type AttemptRecord,
  type FavoriteRecord,
  type LessonBest,
  type MistakeRecord,
} from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { Question } from '@/lib/types';
import { isGradeNumber } from '@/config/curriculum';

async function uid(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

interface ServerResult {
  points: number;
  streak_count: number;
  streak_best: number;
  last_active_date: string | null;
}

function applyServerStats(r: ServerResult) {
  const streak: StreakState = { count: r.streak_count, best: r.streak_best, lastDay: r.last_active_date };
  useProgress.getState().applyServer({ points: r.points, streak });
}

/* ───────────── الملف الشخصي ───────────── */

/** يرفع الدور والصف والاسم إلى الملف الشخصي */
export async function syncProfile() {
  const id = await uid();
  if (!supabase || !id) return;
  const s = useSettings.getState();
  await supabase
    .from('profiles')
    .update({ role: s.role ?? 'student', grade_id: s.grade, display_name: s.displayName.trim() || null })
    .eq('id', id);
}

/* ───────────── بعد تسجيل الدخول ───────────── */

export async function afterSignIn() {
  const id = await uid();
  if (!supabase || !id) return;
  const settings = useSettings.getState();

  const { data: profile } = await supabase.from('profiles').select('role, grade_id, display_name').eq('id', id).maybeSingle();

  if (profile?.grade_id && isGradeNumber(profile.grade_id)) {
    // حساب موجود: نعتمد بيانات الخادم (جهاز جديد مثلاً)
    settings.set({
      onboarded: true,
      role: profile.role,
      grade: settings.grade ?? profile.grade_id,
      displayName: settings.displayName || profile.display_name || '',
    });
    if (settings.grade && settings.grade !== profile.grade_id) await syncProfile();
  } else {
    settings.set({ onboarded: true });
    if (settings.role || settings.grade) await syncProfile();
  }

  // نقل تقدّم وضع التجربة (مرة واحدة، إذا كان الحساب جديداً)
  const p = useProgress.getState();
  if (p.attempts.length || Object.keys(p.mistakes).length || Object.keys(p.studySeconds).length) {
    await supabase.rpc('import_guest_progress', {
      p: {
        attempts: p.attempts.map((a) => ({
          lesson_id: a.lessonId,
          subject_id: a.subjectId,
          mode: a.mode,
          correct: a.score.correct,
          total: a.score.total,
          percent: a.score.percent,
          points: a.score.points,
          duration_sec: a.durationSec,
          at: a.at,
        })),
        mistakes: Object.values(p.mistakes).map((m) => ({ question_key: m.question.id, question_snapshot: m.question })),
        study: p.studySeconds,
        streak: p.streak,
      },
    });
    useProgress.setState({ pendingStudySeconds: 0, pendingAttempts: [] });
  }
  await pullFromServer();
}

/* ───────────── تنزيل الحالة من الخادم ───────────── */

export async function pullFromServer() {
  const id = await uid();
  if (!supabase || !id) return;
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
  const [profile, best, mistakes, favorites, study, attempts] = await Promise.all([
    supabase.from('profiles').select('points, streak_count, streak_best, last_active_date').eq('id', id).maybeSingle(),
    supabase.from('my_lesson_best').select('lesson_id, percent, stars, attempts').eq('user_id', id),
    supabase.from('my_open_mistakes').select('question_key, question_snapshot, last_at, wrong_count').eq('user_id', id).order('last_at', { ascending: false }).limit(500),
    supabase.from('favorites').select('item_type, item_id, title, subtitle, created_at').eq('user_id', id),
    supabase.from('study_sessions').select('day, seconds').eq('user_id', id).gte('day', since),
    supabase
      .from('attempts')
      .select('id, lesson_id, subject_id, mode, correct, total, percent, stars, points_earned, duration_sec, created_at')
      .eq('user_id', id)
      .neq('mode', 'imported')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);
  if (profile.error || !profile.data) return;

  const lessonBest: Record<string, LessonBest> = {};
  for (const r of best.data ?? []) lessonBest[r.lesson_id] = { percent: r.percent, stars: r.stars, attempts: r.attempts };

  const mistakeMap: Record<string, MistakeRecord> = {};
  for (const r of mistakes.data ?? []) {
    const q = r.question_snapshot as Question;
    if (!q?.prompt || !q.lessonId) continue;
    mistakeMap[q.id] = { question: q, subjectId: subjectIdFromLesson(q.lessonId), wrongCount: r.wrong_count, lastAt: Date.parse(r.last_at) };
  }

  const favs: FavoriteRecord[] = (favorites.data ?? []).map((f) => ({
    type: f.item_type,
    id: f.item_id,
    title: f.title,
    subtitle: f.subtitle ?? undefined,
    addedAt: Date.parse(f.created_at),
  }));

  const pendingSecs = useProgress.getState().pendingStudySeconds;
  const studySeconds: Record<string, number> = {};
  for (const r of study.data ?? []) studySeconds[r.day] = r.seconds;
  if (pendingSecs) studySeconds[dayKey()] = (studySeconds[dayKey()] ?? 0) + pendingSecs;

  const recent: AttemptRecord[] = (attempts.data ?? []).map((a) => ({
    id: a.id,
    lessonId: a.lesson_id,
    subjectId: a.subject_id,
    mode: a.mode,
    score: { correct: a.correct, total: a.total, percent: a.percent, stars: a.stars, points: a.points_earned },
    durationSec: a.duration_sec,
    at: Date.parse(a.created_at),
  }));

  useProgress.getState().applyServer({
    points: profile.data.points,
    streak: { count: profile.data.streak_count, best: profile.data.streak_best, lastDay: profile.data.last_active_date },
    lessonBest,
    mistakes: mistakeMap,
    favorites: favs,
    studySeconds,
    attempts: recent,
  });
}

/* ───────────── رفع المحاولات ───────────── */

/** يُستدعى بعد كل اختبار: يضيف المحاولة لقائمة الانتظار ويحاول رفعها */
export async function queueAttempt(local: AttemptRecord, answers: AnswerRecord[]) {
  if (!(await uid())) return;
  useProgress.getState().enqueueAttempt({
    id: local.id,
    lessonId: local.lessonId,
    subjectId: local.subjectId,
    mode: local.mode,
    durationSec: local.durationSec,
    answers: answers.map((a) => ({
      question_id: a.question.source === 'generated' ? null : a.question.id,
      question_key: a.question.id,
      question_snapshot: a.question,
      given_answer: a.response,
      is_correct: a.correct,
    })),
  });
  await flushPending();
}

let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

export async function flushPending() {
  if (!supabase || flushing || !(await uid())) return;
  flushing = true;
  try {
    const queue = [...useProgress.getState().pendingAttempts];
    for (const p of queue) {
      const { data, error } = await supabase.rpc('record_attempt', {
        p_lesson_id: p.lessonId,
        p_subject_id: p.subjectId,
        p_mode: p.mode,
        p_answers: p.answers,
        p_duration_sec: p.durationSec,
      });
      if (error) {
        // انقطاع الاتصال أو حدّ التكرار: نعيد المحاولة لاحقاً
        if (/too many|fetch|network|timeout/i.test(error.message)) break;
        useProgress.getState().removePendingAttempt(p.id); // خطأ دائم: نتجاهل المحاولة
        continue;
      }
      useProgress.getState().removePendingAttempt(p.id);
      applyServerStats(data as ServerResult);
      // الخادم يسمح بمحاولة كل 5 ثوانٍ: نؤجّل الباقي
      if (useProgress.getState().pendingAttempts.length) {
        retryTimer && clearTimeout(retryTimer);
        retryTimer = setTimeout(() => flushPending().catch(() => {}), 6000);
        break;
      }
    }

    const secs = useProgress.getState().takePendingStudySeconds();
    if (secs > 0) {
      const { error } = await supabase.rpc('add_study_time', { p_seconds: Math.min(secs, 1800) });
      const left = error ? secs : secs - Math.min(secs, 1800);
      if (left > 0) useProgress.setState((s) => ({ pendingStudySeconds: s.pendingStudySeconds + left }));
    }
  } finally {
    flushing = false;
  }
}

/* ───────────── المفضلة ───────────── */

export async function syncFavorite(fav: Omit<FavoriteRecord, 'addedAt'>, saved: boolean) {
  const id = await uid();
  if (!supabase || !id) return;
  if (saved) {
    await supabase.from('favorites').upsert({ user_id: id, item_type: fav.type, item_id: fav.id, title: fav.title, subtitle: fav.subtitle ?? null });
  } else {
    await supabase.from('favorites').delete().match({ user_id: id, item_type: fav.type, item_id: fav.id });
  }
}

/* ───────────── تسجيل الخروج ───────────── */

/** يمسح بيانات الحساب من هذا الجهاز (يبقي إعدادات المظهر) */
export function clearLocalAccountData() {
  useProgress.getState().reset();
  const { themeMode, fontScale, soundOn, hapticsOn, showUnreviewed } = useSettings.getState();
  useSettings.getState().reset();
  useSettings.getState().set({ themeMode, fontScale, soundOn, hapticsOn, showUnreviewed });
}

/* ───────────── تقييم الفيديوهات ───────────── */

export async function syncVideoRating(dbId: string | undefined, helpful: boolean | null) {
  const id = await uid();
  if (!supabase || !id || !dbId) return;
  if (helpful === null) await supabase.from('video_ratings').delete().match({ user_id: id, video_id: dbId });
  else await supabase.from('video_ratings').upsert({ user_id: id, video_id: dbId, helpful });
}
