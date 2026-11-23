/** ربط رموز التصميم (theme/tokens.ts) بإعدادات المستخدم */
import { useColorScheme } from 'react-native';

import { useSettings } from '@/lib/store';
import { darkColors, FONT_SCALES, lightColors, type ThemeColors } from '@/theme/tokens';

export * from '@/theme/tokens';

export function useAppTheme() {
  const system = useColorScheme();
  const themeMode = useSettings((s) => s.themeMode);
  const fontScaleKey = useSettings((s) => s.fontScale);
  const isDark = themeMode === 'system' ? system !== 'light' : themeMode === 'dark';
  return {
    isDark,
    colors: (isDark ? darkColors : lightColors) as ThemeColors,
    fontScale: FONT_SCALES[fontScaleKey],
  };
}

/** لون شفاف من hex */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
