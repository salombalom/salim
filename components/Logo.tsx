import { View } from 'react-native';

import { AppText, Divider } from '@/components/ui';
import { spacing, useAppTheme } from '@/lib/theme';

/** شعار «دَرْسي»: الاسم بخط El Messiri بالذهبي مع زخرفة رفيعة */
export function Logo({ size = 64, tagline }: { size?: number; tagline?: string }) {
  const { fontScale } = useAppTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.md }}>
      <AppText variant="hero" color="gold" style={{ fontSize: size, lineHeight: size * 1.5 }} allowFontScaling={false}>
        دَرْسي
      </AppText>
      <Divider ornament />
      {tagline && (
        <AppText color="textMuted" center style={{ fontSize: 15 * fontScale }}>
          {tagline}
        </AppText>
      )}
    </View>
  );
}
