/**
 * أدوات مختصرة لكتابة المحتوى المبدئي (seed).
 * كل الأسئلة هنا أصلية، كتبها الذكاء الاصطناعي حسب المستوى العام لكل صف،
 * ولم تُنسخ من الكتب المدرسية. تبدأ كلها بـ reviewed = false.
 */
import type { SubjectKey, TermNumber } from '@/config/curriculum';
import type { Difficulty, Question } from '@/lib/types';

const E: Difficulty = 'easy';

type Distribute<T> = T extends Question ? Omit<T, 'id' | 'lessonId'> : never;
export type SeedQuestion = Distribute<Question>;

const base = { reviewed: false, source: 'seed' as const };

/** اختيار من متعدد — `correct` رقم الخيار الصحيح (يبدأ من 0) */
export function mcq(prompt: string, options: [string, string, string, string], correct: 0 | 1 | 2 | 3, explanation: string, difficulty: Difficulty = E): SeedQuestion {
  return { ...base, type: 'mcq', prompt, options, answer: options[correct], explanation, difficulty };
}

/** صح أو خطأ */
export function tf(prompt: string, answer: boolean, explanation: string, difficulty: Difficulty = E): SeedQuestion {
  return { ...base, type: 'true_false', prompt, answer, explanation, difficulty };
}

/** أكمل الفراغ — ضع ____ مكان الفراغ */
export function fill(
  prompt: string,
  answer: string,
  explanation: string,
  difficulty: Difficulty = E,
  extra: { accepted?: string[]; options?: string[] } = {},
): SeedQuestion {
  return { ...base, type: 'fill_blank', prompt, answer, explanation, difficulty, ...extra };
}

/** ترتيب الكلمات — اكتب الجملة الصحيحة، وتُقسَّم إلى كلمات تلقائياً */
export function order(sentence: string, explanation: string, difficulty: Difficulty = E, prompt?: string): SeedQuestion {
  const words = sentence.trim().split(/\s+/);
  const isEnglish = /^[\x00-\x7F]+$/.test(sentence);
  return {
    ...base,
    type: 'word_order',
    prompt: prompt ?? (isEnglish ? 'Put the words in the correct order.' : 'رتّب الكلمات لتكوين جملة صحيحة.'),
    answer: words,
    explanation,
    difficulty,
  };
}

export interface SeedLesson {
  title: string;
  objectives: string[];
  questions: SeedQuestion[];
}

export interface SeedUnit {
  title: string;
  term: TermNumber;
  lessons: SeedLesson[];
}

export function lesson(title: string, objectives: string[], questions: SeedQuestion[]): SeedLesson {
  return { title, objectives, questions };
}

export function unit(title: string, lessons: SeedLesson[], term: TermNumber = 1): SeedUnit {
  return { title, term, lessons };
}

/** محتوى صف كامل: لكل مادة وحدة أو أكثر */
export type GradeSeed = Partial<Record<SubjectKey, SeedUnit[]>>;
