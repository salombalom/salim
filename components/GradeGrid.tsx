import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { GRADES, gradeName, type GradeNumber } from '@/config/curriculum';
import { borderWidth, fonts, radius, spacing, useAppTheme } from '@/lib/theme';

const STAGES: { title: string; grades: GradeNumber[] }[] = [
  { title: 'الحلقة الأولى', grades: GRADES.filter((g) => g <= 4) },
  { title: 'الحلقة الثانية', grades: GRADES.filter((g) => g >= 5 && g <= 10) },
  { title: 'ما بعد التعليم الأساسي', grades: GRADES.filter((g) => g >= 11) },
];

export function GradeGrid({ value, onSelect }: { value: GradeNumber | null; onSelect: (g: GradeNumber) => void }) {
  const { colors, fontScale } = useAppTheme();
  return (
    <View style={{ gap: spacing.xl }}>
      {STAGES.map((stage) => (
        <View key={stage.title} style={{ gap: spacing.md }}>
          <AppText variant="overline" color="textMuted">
            {stage.title}
          </AppText>
          <View style={styles.grid}>
            {stage.grades.map((g) => {
              const active = g === value;
              return (
                <Pressable
                  key={g}
                  onPress={() => onSelect(g)}
                  accessibilityRole="button"
                  accessibilityLabel={gradeName(g)}
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.cell,
                    {
                      backgroundColor: active ? colors.goldFaint : colors.surface,
                      borderColor: active || pressed ? colors.gold : colors.border,
                    },
                  ]}>
                  <AppText color="goldText" style={{ fontFamily: fonts.heading, fontSize: 28 * fontScale, lineHeight: 44 * fontScale }}>
                    {g}
                  </AppText>
                  <AppText variant="overline" color={active ? 'text' : 'textMuted'} numberOfLines={1}>
                    {gradeName(g)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: { width: '31%', flexGrow: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.card - 6, borderWidth: borderWidth.hairline },
});
