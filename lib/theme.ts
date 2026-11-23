import { useColorScheme } from 'react-native';

import { useSettings } from '@/lib/store';

export const palette = {
  light: {
    background: '#F6F7F9',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF1F4',
    border: '#E2E6EB',
    text: '#15191E',
    textMuted: '#5B6470',
    primary: '#0E7C66',
    primaryText: '#FFFFFF',
    primarySoft: '#D7F2EA',
    accent: '#C8102E',
    success: '#16A34A',
    successSoft: '#DCFCE7',
    danger: '#DC2626',
    dangerSoft: '#FEE2E2',
    warning: '#B45309',
    warningSoft: '#FEF3C7',
    star: '#F5A524',
    overlay: 'rgba(0,0,0,0.4)',
  },
  dark: {
    background: '#0E1114',
    surface: '#171B20',
    surfaceAlt: '#20262D',
    border: '#2B323A',
    text: '#ECEFF3',
    textMuted: '#9AA4AF',
    primary: '#34C3A2',
    primaryText: '#062019',
    primarySoft: '#123A31',
    accent: '#F05A6E',
    success: '#4ADE80',
    successSoft: '#123222',
    danger: '#F87171',
    dangerSoft: '#3A1717',
    warning: '#FBBF24',
    warningSoft: '#3A2E10',
    star: '#FFC24B',
    overlay: 'rgba(0,0,0,0.6)',
  },
} as const;

export type ThemeColors = { [K in keyof (typeof palette)['light']]: string };

export const fonts = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
} as const;

export type FontWeightName = keyof typeof fonts;

export const FONT_SCALES = { sm: 0.9, md: 1, lg: 1.15, xl: 1.3 } as const;
export type FontScaleKey = keyof typeof FONT_SCALES;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 } as const;

export function useAppTheme() {
  const system = useColorScheme();
  const themeMode = useSettings((s) => s.themeMode);
  const fontScaleKey = useSettings((s) => s.fontScale);
  const isDark = themeMode === 'system' ? system === 'dark' : themeMode === 'dark';
  return {
    isDark,
    colors: (isDark ? palette.dark : palette.light) as ThemeColors,
    fontScale: FONT_SCALES[fontScaleKey],
  };
}

/** لون المادة مناسب للوضع الحالي (في الوضع الليلي نستخدم خلفية داكنة شفافة) */
export function subjectColors(color: string, tint: string, isDark: boolean) {
  return isDark ? { fg: lighten(color), bg: `${color}33` } : { fg: color, bg: tint };
}

function lighten(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.35);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
