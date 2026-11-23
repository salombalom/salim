import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, IconCircle } from '@/components/ui';
import type { SubjectWithMeta } from '@/lib/data/repository';
import { subjectCompletion } from '@/lib/progress';
import { useProgress } from '@/lib/store';
import { spacing } from '@/lib/theme';

/** بطاقة مادة داكنة موحّدة: أيقونة ذهبية وخط رفيع بلون المادة */
export function SubjectCard({ subject }: { subject: SubjectWithMeta }) {
  const lessonBest = useProgress((s) => s.lessonBest);
  const { done, total } = subjectCompletion(subject.id, lessonBest);
  return (
    <Card
      onPress={() => router.push({ pathname: '/subject/[id]', params: { id: subject.id } })}
      accessibilityLabel={`${subject.meta.nameAr}، أنجزت ${done} من ${total} دروس`}
      accent={subject.meta.color}
      style={styles.card}>
      <IconCircle name={subject.meta.icon} size={46} tint={subject.meta.color} />
      <View style={{ gap: 2 }}>
        <AppText variant="label" numberOfLines={1}>
          {subject.meta.nameAr}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {done} من {total} دروس
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: '47%', flexGrow: 1, gap: spacing.lg, padding: spacing.lg, paddingStart: spacing.xl },
});
