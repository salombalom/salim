import type { GradeNumber, SubjectKey, TermNumber } from '@/config/curriculum';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'word_order';

interface QuestionBase {
  id: string;
  lessonId: string;
  prompt: string;
  explanation: string;
  difficulty: Difficulty;
  /** هل راجع المسؤول هذا السؤال؟ لا يظهر للطلاب إلا المراجَع */
  reviewed: boolean;
  /** seed = كتبه الذكاء الاصطناعي مبدئياً، admin = أضافه المسؤول، generated = مولّد تلقائي */
  source: 'seed' | 'admin' | 'import' | 'generated';
}

export interface McqQuestion extends QuestionBase {
  type: 'mcq';
  /** أربعة خيارات بالضبط */
  options: string[];
  /** نص الخيار الصحيح (يجب أن يطابق أحد الخيارات) */
  answer: string;
}

export interface TrueFalseQuestion extends QuestionBase {
  type: 'true_false';
  answer: boolean;
}

export interface FillBlankQuestion extends QuestionBase {
  type: 'fill_blank';
  /** النص يحتوي على ____ مكان الفراغ */
  answer: string;
  /** إجابات أخرى مقبولة */
  accepted?: string[];
  /** خيارات اختيارية (بنك كلمات) للصفوف الصغيرة */
  options?: string[];
}

export interface WordOrderQuestion extends QuestionBase {
  type: 'word_order';
  /** الكلمات بالترتيب الصحيح */
  answer: string[];
}

export type Question = McqQuestion | TrueFalseQuestion | FillBlankQuestion | WordOrderQuestion;

/** إجابة الطالب */
export type QuestionResponse = string | boolean | string[];

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  order: number;
  objectives: string[];
}

export interface Unit {
  id: string;
  subjectId: string;
  term: TermNumber;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface SubjectContent {
  id: string;
  grade: GradeNumber;
  key: SubjectKey;
  units: Unit[];
}
