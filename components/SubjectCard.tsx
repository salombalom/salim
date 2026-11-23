import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Gradient, ProgressBar } from '@/components/ui';
import type { SubjectWithMeta } from '@/lib/data/repository';
import { subjectCompletion } from '@/lib/progress';
import { useProgress } from '@/lib/store';
import { darken, radius, softShadow, spacing, useAppTheme } from '@/lib/theme';

export function SubjectCard({ subject }: { subject: SubjectWithMeta }) {
  const { isDark } = useAppTheme();
  const lessonBest = useProgress((s) => s.lessonBest);
  const { done, total, ratio } = subjectCompletion(subject.id, lessonBest);
  const [from, to] = subject.meta.gradient;
  const icon = subject.meta.icon as never;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/subject/[id]', params: { id: subject.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${subject.meta.nameAr}، أنجزت ${done} من ${total} دروس`}
      style={({ pressed }) => [styles.wrap, softShadow(to, isDark, 1), pressed && { transform: [{ scale: 0.96 }] }]}>
      <Gradient colors={isDark ? [darken(from, 0.2), darken(to, 0.3)] : [from, to]} style={styles.card}>
        {/* أيقونة زخرفية كبيرة في الخلفية */}
        <View style={styles.decor} pointerEvents="none">
          <MaterialCommunityIcons name={icon} size={110} color="rgba(255,255,255,0.16)" />
        </View>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name={icon} size={28} color="#FFFFFF" />
        </View>
        <AppText variant="h2" color="#FFFFFF" numberOfLines={2} style={{ fontSize: 17, lineHeight: 26, minHeight: 52 }}>
          {subject.meta.nameAr}
        </AppText>
        <View style={{ gap: 4 }}>
          <ProgressBar value={ratio} color="#FFFFFF" trackColor="rgba(255,255,255,0.28)" height={8} />
          <AppText variant="tiny" color="rgba(255,255,255,0.92)">
            {done} / {total} دروس
          </AppText>
        </View>
      </Gradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '47%', flexGrow: 1, borderRadius: radius.lg },
  card: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm, overflow: 'hidden', minHeight: 168, borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.15)' },
  decor: { position: 'absolute', bottom: -18, start: -14, transform: [{ rotate: '-15deg' }] },
  iconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' },
});
