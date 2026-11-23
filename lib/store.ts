/**
 * الحالة المحلية للتطبيق (الإعدادات والتقدم) — محفوظة على الجهاز عبر AsyncStorage.
 * في المرحلة 2 ستُزامَن مع Supabase عند تسجيل الدخول.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { GradeNumber } from '@/config/curriculum';
import { dayKey, EMPTY_STREAK, registerActivity, type QuizScore, type StreakState } from '@/lib/gamification';
import type { Question, QuestionResponse } from '@/lib/types';

/* ───────────── الإعدادات ───────────── */

export type Role = 'student' | 'parent';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface SettingsState {
  onboarded: boolean;
  role: Role | null;
  grade: GradeNumber | null;
  /** اسم مستعار اختياري للتحية — يُحفظ على الجهاز فقط */
  displayName: string;
  themeMode: ThemeMode;
  fontScale: 'sm' | 'md' | 'lg' | 'xl';
  soundOn: boolean;
  hapticsOn: boolean;
  /** عرض الأسئلة غير المراجَعة — للتطوير فقط */
  showUnreviewed: boolean;
  set: (patch: Partial<Omit<SettingsState, 'set' | 'reset'>>) => void;
  reset: () => void;
}

const defaultSettings = {
  onboarded: false,
  role: null,
  grade: null,
  displayName: '',
  // الوضع الليلي هو الافتراضي في هوية «دَرْسي»
  themeMode: 'dark' as ThemeMode,
  fontScale: 'md' as const,
  soundOn: true,
  hapticsOn: true,
  // في نسخة التطوير (Expo Go) نُظهر غير المراجَع حتى تتمكن من التجربة، وفي نسخة المتجر لا.
  showUnreviewed: typeof __DEV__ !== 'undefined' ? __DEV__ : false,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      set: (patch) => set(patch),
      reset: () => set(defaultSettings),
    }),
    {
      name: 'darsi.settings.v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      // الإصدار 2: الوضع الليلي افتراضي + الاسم المستعار
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<SettingsState>;
        if (version < 2) return { ...s, themeMode: s.themeMode === 'system' ? 'dark' : s.themeMode, displayName: s.displayName ?? '' } as SettingsState;
        return s as SettingsState;
      },
    },
  ),
);

/* ───────────── التقدم ───────────── */

export interface AnswerRecord {
  question: Question;
  response: QuestionResponse | null;
  correct: boolean;
}

export interface AttemptRecord {
  id: string;
  lessonId: string | null;
  subjectId: string | null;
  mode: 'lesson' | 'mistakes';
  score: QuizScore;
  durationSec: number;
  at: number;
}

export interface MistakeRecord {
  /** نحفظ السؤال كاملاً لأن أسئلة الرياضيات المولّدة لا تُخزَّن في مكان آخر */
  question: Question;
  subjectId: string;
  wrongCount: number;
  lastAt: number;
}

export interface FavoriteRecord {
  type: 'video' | 'summary';
  id: string;
  title: string;
  subtitle?: string;
  addedAt: number;
}

export interface LessonBest {
  percent: number;
  stars: 0 | 1 | 2 | 3;
  attempts: number;
}

export interface ProgressState {
  points: number;
  streak: StreakState;
  lessonBest: Record<string, LessonBest>;
  attempts: AttemptRecord[];
  mistakes: Record<string, MistakeRecord>;
  favorites: FavoriteRecord[];
  /** ثوانٍ الدراسة لكل يوم (YYYY-MM-DD) */
  studySeconds: Record<string, number>;

  recordQuiz: (input: {
    lessonId: string | null;
    subjectId: string | null;
    mode: 'lesson' | 'mistakes';
    answers: AnswerRecord[];
    score: QuizScore;
    durationSec: number;
  }) => AttemptRecord;
  toggleFavorite: (fav: Omit<FavoriteRecord, 'addedAt'>) => void;
  addStudyTime: (seconds: number) => void;
  reset: () => void;
}

const emptyProgress = {
  points: 0,
  streak: EMPTY_STREAK,
  lessonBest: {},
  attempts: [],
  mistakes: {},
  favorites: [],
  studySeconds: {},
};

const MAX_ATTEMPTS = 300;

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...emptyProgress,

      recordQuiz: ({ lessonId, subjectId, mode, answers, score, durationSec }) => {
        const now = Date.now();
        const attempt: AttemptRecord = {
          id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
          lessonId,
          subjectId,
          mode,
          score,
          durationSec,
          at: now,
        };
        const state = get();

        const mistakes = { ...state.mistakes };
        for (const a of answers) {
          const id = a.question.id;
          if (a.correct) {
            delete mistakes[id];
          } else {
            const prev = mistakes[id];
            mistakes[id] = {
              question: a.question,
              subjectId: subjectId ?? prev?.subjectId ?? subjectIdFromLesson(a.question.lessonId),
              wrongCount: (prev?.wrongCount ?? 0) + 1,
              lastAt: now,
            };
          }
        }

        const lessonBest = { ...state.lessonBest };
        if (lessonId && mode === 'lesson') {
          const prev = lessonBest[lessonId];
          lessonBest[lessonId] = {
            percent: Math.max(prev?.percent ?? 0, score.percent),
            stars: Math.max(prev?.stars ?? 0, score.stars) as LessonBest['stars'],
            attempts: (prev?.attempts ?? 0) + 1,
          };
        }

        set({
          points: state.points + score.points,
          streak: score.total > 0 ? registerActivity(state.streak, dayKey()) : state.streak,
          lessonBest,
          mistakes,
          attempts: [attempt, ...state.attempts].slice(0, MAX_ATTEMPTS),
        });
        return attempt;
      },

      toggleFavorite: (fav) => {
        const exists = get().favorites.some((f) => f.type === fav.type && f.id === fav.id);
        set({
          favorites: exists
            ? get().favorites.filter((f) => !(f.type === fav.type && f.id === fav.id))
            : [{ ...fav, addedAt: Date.now() }, ...get().favorites],
        });
      },

      addStudyTime: (seconds) => {
        if (seconds <= 0) return;
        const key = dayKey();
        const cur = get().studySeconds;
        set({ studySeconds: { ...cur, [key]: (cur[key] ?? 0) + Math.round(seconds) } });
      },

      reset: () => set(emptyProgress),
    }),
    {
      name: 'darsi.progress.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        points: s.points,
        streak: s.streak,
        lessonBest: s.lessonBest,
        attempts: s.attempts,
        mistakes: s.mistakes,
        favorites: s.favorites,
        studySeconds: s.studySeconds,
      }),
    },
  ),
);

/** g5-math-u1-l2 → g5-math */
export function subjectIdFromLesson(lessonId: string): string {
  const m = lessonId.match(/^(g\d+-[a-z]+)/);
  return m ? m[1] : lessonId;
}

/* ───────────── نتيجة آخر اختبار (في الذاكرة فقط) ───────────── */

interface SessionState {
  lastResult: { attempt: AttemptRecord; answers: AnswerRecord[] } | null;
  setLastResult: (r: SessionState['lastResult']) => void;
}

export const useSession = create<SessionState>()((set) => ({
  lastResult: null,
  setLastResult: (lastResult) => set({ lastResult }),
}));
