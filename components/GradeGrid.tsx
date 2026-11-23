import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { GRADES, gradeName, type GradeNumber } from '@/config/curriculum';
import { radius, spacing, useAppTheme } from '@/lib/theme';

const STAGES: { title: string; grades: GradeNumber[] }[] = [
  { title: 'الحلقة الأولى', grades: GRADES.filter((g) => g <= 4) },
  { title: 'الحلقة الثانية', grades: GRADES.filter((g) => g >= 5 && g <= 10) },
  { title: 'ما بعد الأساسي', grades: GRADES.filter((g) => g >= 11) },
];

export function GradeGrid({ value, onSelect }: { value: GradeNumber | null; onSelect: (g: GradeNumber) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      {STAGES.map((stage) => (
        <View key={stage.title} style={{ gap: spacing.sm }}>
          <AppText variant="label" color="textMuted">
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
                    { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border },
                    pressed && { opacity: 0.8 },
                  ]}>
                  <AppText variant="title" color={active ? 'primaryText' : 'primary'}>
                    {g}
                  </AppText>
                  <AppText variant="caption" color={active ? 'primaryText' : 'textMuted'} numberOfLines={1}>
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
  cell: {
    width: '31.5%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
