import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, ProgressBar } from '@/components/ui';
import type { SubjectWithMeta } from '@/lib/data/repository';
import { subjectCompletion } from '@/lib/progress';
import { useProgress } from '@/lib/store';
import { radius, spacing, subjectColors, useAppTheme } from '@/lib/theme';

export function SubjectCard({ subject }: { subject: SubjectWithMeta }) {
  const { isDark } = useAppTheme();
  const lessonBest = useProgress((s) => s.lessonBest);
  const { done, total, ratio } = subjectCompletion(subject.id, lessonBest);
  const c = subjectColors(subject.meta.color, subject.meta.tint, isDark);
  return (
    <Card
      onPress={() => router.push({ pathname: '/subject/[id]', params: { id: subject.id } })}
      accessibilityLabel={`${subject.meta.nameAr}، أنجزت ${done} من ${total} دروس`}
      style={styles.card}>
      <View style={[styles.icon, { backgroundColor: c.bg }]}>
        <MaterialCommunityIcons name={subject.meta.icon as never} size={30} color={c.fg} />
      </View>
      <AppText variant="label" weight="semibold" numberOfLines={2} style={{ minHeight: 44 }}>
        {subject.meta.nameAr}
      </AppText>
      <ProgressBar value={ratio} color={c.fg} height={6} />
      <AppText variant="caption" color="textMuted">
        {done} / {total} دروس
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', flexGrow: 1, gap: spacing.sm, padding: spacing.md },
  icon: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
