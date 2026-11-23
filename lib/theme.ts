import { Platform, useColorScheme, type ViewStyle } from 'react-native';

import { useSettings } from '@/lib/store';

/**
 * هوية «دَرْسي» البصرية:
 * بنفسجي حيوي كلون أساسي، تدرجات مبهجة، أزرار ثلاثية الأبعاد، وزوايا دائرية كبيرة.
 */
export const palette = {
  light: {
    background: '#F6F4FF',
    surface: '#FFFFFF',
    surfaceAlt: '#EFECFC',
    border: '#E6E1F7',
    text: '#1C1838',
    textMuted: '#6E6A8E',
    primary: '#6C4CF5',
    primaryDeep: '#4B2FCF',
    primaryText: '#FFFFFF',
    primarySoft: '#EDE8FF',
    accent: '#FF4F7B',
    accentSoft: '#FFE4EC',
    success: '#16B364',
    successDeep: '#0E8A4C',
    successSoft: '#DDF8E9',
    danger: '#F0405F',
    dangerDeep: '#C21F3E',
    dangerSoft: '#FFE3E8',
    warning: '#C27803',
    warningSoft: '#FFF1D6',
    star: '#FFB61D',
    starSoft: '#FFF3D4',
    sky: '#0EA5E9',
    skySoft: '#E0F4FE',
    overlay: 'rgba(28,24,56,0.45)',
    shadow: '#4B2FCF',
  },
  dark: {
    background: '#100D22',
    surface: '#1B1736',
    surfaceAlt: '#262046',
    border: '#322B5A',
    text: '#F4F2FF',
    textMuted: '#A9A3CF',
    primary: '#8E74FF',
    primaryDeep: '#5B3FE0',
    primaryText: '#FFFFFF',
    primarySoft: '#2A2257',
    accent: '#FF6E93',
    accentSoft: '#3A1A2C',
    success: '#34D399',
    successDeep: '#0E9F6E',
    successSoft: '#123327',
    danger: '#FB7185',
    dangerDeep: '#C21F3E',
    dangerSoft: '#3A1622',
    warning: '#FBBF24',
    warningSoft: '#3A2E10',
    star: '#FFC94A',
    starSoft: '#3A2F12',
    sky: '#38BDF8',
    skySoft: '#0F2A3D',
    overlay: 'rgba(0,0,0,0.6)',
    shadow: '#000000',
  },
} as const;

export type ThemeColors = { [K in keyof (typeof palette)['light']]: string };

/** تدرجات عامة */
export const gradients = {
  light: {
    hero: ['#5B3FE0', '#8B5CF6', '#D946EF'] as const,
    success: ['#22C55E', '#0EA371'] as const,
    sunset: ['#FF8A4C', '#FF4F7B'] as const,
    gold: ['#FFC93C', '#FF9F1C'] as const,
  },
  dark: {
    hero: ['#3B2A9E', '#6D3FD0', '#A3329E'] as const,
    success: ['#15803D', '#0F766E'] as const,
    sunset: ['#C2410C', '#BE185D'] as const,
    gold: ['#B7791F', '#B45309'] as const,
  },
};

/**
 * الخطوط: «بلو بهيجان» الدائري المرح للعناوين، و«IBM Plex Sans Arabic» الواضح للنصوص.
 */
export const fonts = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
  heading: 'BalooBhaijaan2_700Bold',
  black: 'BalooBhaijaan2_800ExtraBold',
} as const;

export type FontWeightName = keyof typeof fonts;

export const FONT_SCALES = { sm: 0.9, md: 1, lg: 1.15, xl: 1.3 } as const;
export type FontScaleKey = keyof typeof FONT_SCALES;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;

export function useAppTheme() {
  const system = useColorScheme();
  const themeMode = useSettings((s) => s.themeMode);
  const fontScaleKey = useSettings((s) => s.fontScale);
  const isDark = themeMode === 'system' ? system === 'dark' : themeMode === 'dark';
  return {
    isDark,
    colors: (isDark ? palette.dark : palette.light) as ThemeColors,
    gradients: isDark ? gradients.dark : gradients.light,
    fontScale: FONT_SCALES[fontScaleKey],
  };
}

/** ظل ناعم ملوّن */
export function softShadow(color: string, isDark: boolean, strength = 1): ViewStyle {
  if (isDark) return {};
  if (Platform.OS === 'android') return { elevation: 3 * strength, shadowColor: color };
  return {
    shadowColor: color,
    shadowOpacity: 0.1 * strength,
    shadowRadius: 14 * strength,
    shadowOffset: { width: 0, height: 6 * strength },
  };
}

/** ألوان المادة حسب الوضع */
export function subjectColors(color: string, tint: string, isDark: boolean) {
  return isDark ? { fg: lighten(color, 0.35), bg: `${color}33` } : { fg: color, bg: tint };
}

export function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return toHex(mix((n >> 16) & 255), mix((n >> 8) & 255), mix(n & 255));
}

export function darken(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c * (1 - amount));
  return toHex(mix((n >> 16) & 255), mix((n >> 8) & 255), mix(n & 255));
}

function toHex(r: number, g: number, b: number) {
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** لون شفاف من hex */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
