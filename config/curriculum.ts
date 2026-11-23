/**
 * ملف إعدادات المنهج — عدّل هنا الصفوف والمواد وألوانها وأيقوناتها.
 *
 * - `SUBJECTS`: تعريف كل مادة مرة واحدة (الاسم، الأيقونة، اللون، اتجاه النص).
 * - `GRADE_SUBJECTS`: أي المواد تُدرَّس في أي صف.
 *
 * الأيقونات من مكتبة Lucide: https://lucide.dev/icons (اكتب الاسم بصيغة PascalCase مثل FlaskConical)
 * الألوان من theme/tokens.ts (subjectJewels).
 */

import type { IconName } from '@/components/icons';
import { subjectJewels } from '@/theme/tokens';

export type SubjectKey =
  | 'islamic'
  | 'arabic'
  | 'math'
  | 'science'
  | 'english'
  | 'social'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'national';

export type TextDirection = 'rtl' | 'ltr';

export interface SubjectDefinition {
  key: SubjectKey;
  nameAr: string;
  /** اسم أيقونة من مكتبة Lucide (https://lucide.dev/icons) */
  icon: IconName;
  /** لون «الجوهرة» الخاص بالمادة (من theme/tokens.ts) */
  color: string;
  /** اتجاه عرض المحتوى (الإنجليزية LTR، وباقي المواد RTL) */
  direction: TextDirection;
}

export const SUBJECTS: Record<SubjectKey, SubjectDefinition> = {
  islamic: { key: 'islamic', nameAr: 'التربية الإسلامية', icon: 'MoonStar', color: subjectJewels.islamic, direction: 'rtl' },
  arabic: { key: 'arabic', nameAr: 'اللغة العربية', icon: 'Feather', color: subjectJewels.arabic, direction: 'rtl' },
  math: { key: 'math', nameAr: 'الرياضيات', icon: 'Sigma', color: subjectJewels.math, direction: 'rtl' },
  science: { key: 'science', nameAr: 'العلوم', icon: 'FlaskConical', color: subjectJewels.science, direction: 'rtl' },
  english: { key: 'english', nameAr: 'اللغة الإنجليزية', icon: 'Languages', color: subjectJewels.english, direction: 'ltr' },
  social: { key: 'social', nameAr: 'الدراسات الاجتماعية', icon: 'Compass', color: subjectJewels.social, direction: 'rtl' },
  physics: { key: 'physics', nameAr: 'الفيزياء', icon: 'Atom', color: subjectJewels.physics, direction: 'rtl' },
  chemistry: { key: 'chemistry', nameAr: 'الكيمياء', icon: 'TestTubeDiagonal', color: subjectJewels.chemistry, direction: 'rtl' },
  biology: { key: 'biology', nameAr: 'الأحياء', icon: 'Leaf', color: subjectJewels.biology, direction: 'rtl' },
  national: { key: 'national', nameAr: 'هذا وطني', icon: 'Landmark', color: subjectJewels.national, direction: 'rtl' },
};

export type GradeNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const GRADES: GradeNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const PRIMARY: SubjectKey[] = ['islamic', 'arabic', 'math', 'science', 'english'];
const MIDDLE: SubjectKey[] = [...PRIMARY, 'social'];
const SECONDARY: SubjectKey[] = ['islamic', 'arabic', 'english', 'math', 'physics', 'chemistry', 'biology', 'national'];

/** المواد لكل صف */
export const GRADE_SUBJECTS: Record<GradeNumber, SubjectKey[]> = {
  1: PRIMARY,
  2: PRIMARY,
  3: PRIMARY,
  4: PRIMARY,
  5: MIDDLE,
  6: MIDDLE,
  7: MIDDLE,
  8: MIDDLE,
  9: MIDDLE,
  10: MIDDLE,
  11: SECONDARY,
  12: SECONDARY,
};

const ORDINALS_AR: Record<GradeNumber, string> = {
  1: 'الأول',
  2: 'الثاني',
  3: 'الثالث',
  4: 'الرابع',
  5: 'الخامس',
  6: 'السادس',
  7: 'السابع',
  8: 'الثامن',
  9: 'التاسع',
  10: 'العاشر',
  11: 'الحادي عشر',
  12: 'الثاني عشر',
};

export function gradeName(grade: GradeNumber): string {
  return `الصف ${ORDINALS_AR[grade]}`;
}

/** الفصول الدراسية */
export const TERMS = [
  { number: 1, nameAr: 'الفصل الدراسي الأول' },
  { number: 2, nameAr: 'الفصل الدراسي الثاني' },
] as const;

export type TermNumber = (typeof TERMS)[number]['number'];

/** معرّف موحّد لمادة في صف معيّن، مثل: g5-math */
export function subjectId(grade: GradeNumber, key: SubjectKey): string {
  return `g${grade}-${key}`;
}

export function isGradeNumber(n: number): n is GradeNumber {
  return Number.isInteger(n) && n >= 1 && n <= 12;
}
