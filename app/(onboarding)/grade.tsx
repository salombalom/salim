import { router } from 'expo-router';
import { TextInput, View } from 'react-native';

import { GradeGrid } from '@/components/GradeGrid';
import { AppText, Screen } from '@/components/ui';
import { useSettings } from '@/lib/store';
import { borderWidth, fonts, radius, spacing, useAppTheme } from '@/lib/theme';

export default function GradeScreen() {
  const { colors } = useAppTheme();
  const { grade, role, displayName, set } = useSettings();
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="display">{role === 'parent' ? 'صفّ ابنك' : 'صفّك الدراسي'}</AppText>
        <AppText color="textMuted">يمكنك تغييره لاحقاً من الإعدادات.</AppText>
      </View>
      {role !== 'parent' && (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="overline" color="textMuted">
            بماذا نناديك؟ (اختياري)
          </AppText>
          <TextInput
            value={displayName}
            onChangeText={(t) => set({ displayName: t.slice(0, 20) })}
            placeholder="اسمك الأول أو اسم مستعار"
            placeholderTextColor={colors.textMuted}
            style={{
              borderWidth: borderWidth.hairline,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              borderRadius: radius.button,
              paddingHorizontal: spacing.lg,
              paddingVertical: 14,
              color: colors.text,
              fontFamily: fonts.regular,
              fontSize: 16,
              textAlign: 'right',
            }}
          />
        </View>
      )}
      <GradeGrid
        value={grade}
        onSelect={(g) => {
          set({ grade: g });
          router.replace('/home');
        }}
      />
    </Screen>
  );
}
