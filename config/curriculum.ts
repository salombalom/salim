/**
 * ملف إعدادات المنهج — عدّل هنا الصفوف والمواد وألوانها وأيقوناتها.
 *
 * - `SUBJECTS`: تعريف كل مادة مرة واحدة (الاسم، الأيقونة، اللون، اتجاه النص).
 * - `GRADE_SUBJECTS`: أي المواد تُدرَّس في أي صف.
 *
 * الأيقونات من مكتبة MaterialCommunityIcons:
 * https://icons.expo.fyi (اختر المكتبة MaterialCommunityIcons)
 */

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
  /** اسم أيقونة من MaterialCommunityIcons */
  icon: string;
  /** اللون الأساسي للمادة (الوضع الفاتح) */
  color: string;
  /** لون أفتح للخلفيات */
  tint: string;
  /** تدرّج بطاقة المادة [من، إلى] */
  gradient: [string, string];
  /** اتجاه عرض المحتوى (الإنجليزية LTR، وباقي المواد RTL) */
  direction: TextDirection;
}

export const SUBJECTS: Record<SubjectKey, SubjectDefinition> = {
  islamic: { key: 'islamic', nameAr: 'التربية الإسلامية', icon: 'mosque', color: '#0F766E', tint: '#CCFBF1', gradient: ['#10B981', '#047857'], direction: 'rtl' },
  arabic: { key: 'arabic', nameAr: 'اللغة العربية', icon: 'abjad-arabic', color: '#B45309', tint: '#FEF3C7', gradient: ['#F59E0B', '#EA580C'], direction: 'rtl' },
  math: { key: 'math', nameAr: 'الرياضيات', icon: 'calculator-variant', color: '#1D4ED8', tint: '#DBEAFE', gradient: ['#3B82F6', '#4F46E5'], direction: 'rtl' },
  science: { key: 'science', nameAr: 'العلوم', icon: 'flask', color: '#15803D', tint: '#DCFCE7', gradient: ['#22C55E', '#0D9488'], direction: 'rtl' },
  english: { key: 'english', nameAr: 'اللغة الإنجليزية', icon: 'alphabetical-variant', color: '#BE123C', tint: '#FFE4E6', gradient: ['#F43F5E', '#DB2777'], direction: 'ltr' },
  social: { key: 'social', nameAr: 'الدراسات الاجتماعية', icon: 'earth', color: '#7C3AED', tint: '#EDE9FE', gradient: ['#A855F7', '#7C3AED'], direction: 'rtl' },
  physics: { key: 'physics', nameAr: 'الفيزياء', icon: 'atom', color: '#0369A1', tint: '#E0F2FE', gradient: ['#06B6D4', '#2563EB'], direction: 'rtl' },
  chemistry: { key: 'chemistry', nameAr: 'الكيمياء', icon: 'test-tube', color: '#C2410C', tint: '#FFEDD5', gradient: ['#FB923C', '#E11D48'], direction: 'rtl' },
  biology: { key: 'biology', nameAr: 'الأحياء', icon: 'dna', color: '#4D7C0F', tint: '#ECFCCB', gradient: ['#84CC16', '#15803D'], direction: 'rtl' },
  national: { key: 'national', nameAr: 'هذا وطني', icon: 'flag', color: '#B91C1C', tint: '#FEE2E2', gradient: ['#EF4444', '#B91C1C'], direction: 'rtl' },
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
