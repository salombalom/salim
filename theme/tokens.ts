/**
 * رموز التصميم (Design Tokens) — المصدر الوحيد لكل الألوان والخطوط والمسافات والحركة.
 * لا تكتب أي لون مباشرة داخل الشاشات؛ استخدم هذه القيم عبر useAppTheme().
 *
 * الاتجاه: فخامة هادئة بإحساس عُماني — كحلي عميق، عاجي، ولمسات ذهبية للتفاصيل فقط.
 *
 * ملاحظة التباين (WCAG AA):
 * الألوان الأساسية (gold / success / danger) تُستخدم للخطوط والأيقونات والتعبئة.
 * للنصوص الصغيرة نستخدم نسخ *Text المعدّلة لتحقق تباين 4.5:1 على الأقل.
 * التحقق آلي في __tests__/contrast.test.ts.
 */

export const darkColors = {
  background: '#0B1220',
  surface: '#131C2E',
  surfaceRaised: '#18233A',
  border: '#1F2A40',
  borderStrong: '#2A3852',
  text: '#F3EEE3',
  textMuted: '#9AA3B5',
  gold: '#C9A45C',
  goldHover: '#E2C88A',
  /** ذهبي للنصوص الصغيرة */
  goldText: '#C9A45C',
  /** لون النص فوق زر ذهبي */
  onGold: '#0B1220',
  goldFaint: 'rgba(201,164,92,0.10)',
  goldLine: 'rgba(201,164,92,0.35)',
  success: '#3E9C7A',
  successText: '#55B08F',
  successFaint: 'rgba(62,156,122,0.12)',
  danger: '#C0564B',
  dangerText: '#D8766B',
  dangerFaint: 'rgba(192,86,75,0.12)',
  overlay: 'rgba(5,9,18,0.7)',
  pattern: '#C9A45C',
} as const;

export type ThemeColors = { [K in keyof typeof darkColors]: string };

export const lightColors: ThemeColors = {
  background: '#F7F3EA',
  surface: '#FFFFFF',
  surfaceRaised: '#FBF8F1',
  border: '#E8E0CF',
  borderStrong: '#D9CDB4',
  text: '#0B1220',
  textMuted: '#5C6475',
  gold: '#A8823A',
  goldHover: '#8F6E2F',
  goldText: '#8A6A2C',
  onGold: '#0B1220',
  goldFaint: 'rgba(168,130,58,0.10)',
  goldLine: 'rgba(168,130,58,0.40)',
  success: '#3E9C7A',
  successText: '#2E7A5F',
  successFaint: 'rgba(62,156,122,0.10)',
  danger: '#C0564B',
  dangerText: '#A8463C',
  dangerFaint: 'rgba(192,86,75,0.08)',
  overlay: 'rgba(11,18,32,0.45)',
  pattern: '#A8823A',
};

/** ألوان «الجواهر» للمواد — تظهر كخط رفيع أو خلفية خفيفة جداً للأيقونة */
export const subjectJewels = {
  islamic: '#2F6F5E',
  arabic: '#7A3B3B',
  math: '#2C4A7A',
  science: '#2B6670',
  english: '#4B3F72',
  social: '#7A5A2F',
  physics: '#3A4F7A',
  chemistry: '#2F6670',
  biology: '#3F6B3A',
  national: '#8A2E2E',
} as const;

/** الخطوط: El Messiri للعناوين والأرقام، IBM Plex Sans Arabic للنصوص */
export const fonts = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  heading: 'ElMessiri_500Medium',
  headingStrong: 'ElMessiri_600SemiBold',
  display: 'ElMessiri_400Regular',
} as const;

export type FontName = keyof typeof fonts;

export const typeScale = {
  hero: { size: 56, line: 84, font: 'display' },
  display: { size: 34, line: 54, font: 'heading' },
  title: { size: 24, line: 38, font: 'heading' },
  h2: { size: 19, line: 30, font: 'heading' },
  body: { size: 16, line: 27, font: 'regular' },
  label: { size: 15, line: 24, font: 'medium' },
  caption: { size: 13, line: 21, font: 'regular' },
  overline: { size: 11, line: 16, font: 'medium' },
} as const satisfies Record<string, { size: number; line: number; font: FontName }>;

export const FONT_SCALES = { sm: 0.9, md: 1, lg: 1.15, xl: 1.3 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { card: 20, button: 14, chip: 999, small: 10 } as const;

export const borderWidth = { hairline: 1, accent: 2 } as const;

export const iconSize = { sm: 16, md: 20, lg: 24, xl: 32 } as const;
/** سماكة خطوط الأيقونات (Lucide) — خفيفة وأنيقة */
export const iconStroke = 1.5;

export const progress = { height: 4 } as const;

/** الحركة: هادئة وبطيئة قليلاً، ظهور تدريجي بدل القفز */
export const motion = { fast: 200, normal: 280, slow: 400 } as const;

/** شفافية النقشة الهندسية */
export const patternOpacity = 0.05;
