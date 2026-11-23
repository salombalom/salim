import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Gradient, Row } from '@/components/ui';
import { GRADES, gradeName, type GradeNumber } from '@/config/curriculum';
import { radius, softShadow, spacing, useAppTheme } from '@/lib/theme';

const STAGES: { title: string; emoji: string; grades: GradeNumber[]; colors: [string, string] }[] = [
  { title: 'الحلقة الأولى', emoji: '🌱', grades: GRADES.filter((g) => g <= 4), colors: ['#34D399', '#0EA371'] },
  { title: 'الحلقة الثانية', emoji: '🚀', grades: GRADES.filter((g) => g >= 5 && g <= 10), colors: ['#8B5CF6', '#5B3FE0'] },
  { title: 'ما بعد الأساسي', emoji: '🎓', grades: GRADES.filter((g) => g >= 11), colors: ['#FF8A4C', '#FF4F7B'] },
];

export function GradeGrid({ value, onSelect }: { value: GradeNumber | null; onSelect: (g: GradeNumber) => void }) {
  const { colors, isDark } = useAppTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      {STAGES.map((stage) => (
        <View key={stage.title} style={{ gap: spacing.sm }}>
          <Row gap={6}>
            <AppText>{stage.emoji}</AppText>
            <AppText variant="label" weight="bold" color="textMuted">
              {stage.title}
            </AppText>
          </Row>
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
                  style={({ pressed }) => [styles.cellWrap, pressed && { transform: [{ scale: 0.95 }] }]}>
                  {active ? (
                    <Gradient colors={stage.colors} style={[styles.cell, { borderBottomColor: 'rgba(0,0,0,0.2)' }]}>
                      <AppText variant="display" color="#FFFFFF" style={styles.num}>
                        {g}
                      </AppText>
                      <AppText variant="tiny" color="#FFFFFF" numberOfLines={1}>
                        {gradeName(g)}
                      </AppText>
                    </Gradient>
                  ) : (
                    <View style={[styles.cell, { backgroundColor: colors.surface, borderBottomColor: isDark ? colors.border : '#E3DDF7' }, softShadow(colors.shadow, isDark, 0.5)]}>
                      <AppText variant="display" color={stage.colors[1]} style={styles.num}>
                        {g}
                      </AppText>
                      <AppText variant="tiny" color="textMuted" numberOfLines={1}>
                        {gradeName(g)}
                      </AppText>
                    </View>
                  )}
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
  cellWrap: { width: '31.5%', flexGrow: 1 },
  cell: { alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, borderBottomWidth: 4 },
  num: { fontSize: 32, lineHeight: 46 },
});
