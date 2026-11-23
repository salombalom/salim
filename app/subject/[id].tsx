import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, EmptyState, Icon, ProgressBar, Row, Screen, Segmented, Stars } from '@/components/ui';
import { gradeName, TERMS, type TermNumber } from '@/config/curriculum';
import { getSubject } from '@/lib/data/repository';
import { completionFor, isLessonDone } from '@/lib/progress';
import { useProgress } from '@/lib/store';
import { radius, spacing, subjectColors, useAppTheme } from '@/lib/theme';

export default function SubjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subject = getSubject(id);
  const { colors, isDark } = useAppTheme();
  const lessonBest = useProgress((s) => s.lessonBest);
  const [term, setTerm] = useState<TermNumber>(1);

  if (!subject) return <EmptyState icon="alert-circle-outline" title="المادة غير موجودة" />;
  const c = subjectColors(subject.meta.color, subject.meta.tint, isDark);
  const units = subject.units.filter((u) => u.term === term);
  const all = completionFor(
    subject.units.flatMap((u) => u.lessons.map((l) => l.id)),
    lessonBest,
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: subject.meta.nameAr }} />
      <Card style={{ backgroundColor: c.bg, borderColor: c.bg }}>
        <Row gap={spacing.md}>
          <Icon name={subject.meta.icon as never} size={36} color={c.fg} />
          <View style={{ flex: 1 }}>
            <AppText variant="h2" color={c.fg}>
              {subject.meta.nameAr}
            </AppText>
            <AppText variant="caption" color={c.fg}>
              {gradeName(subject.grade)} • الإنجاز {Math.round(all.ratio * 100)}%
            </AppText>
          </View>
        </Row>
        <ProgressBar value={all.ratio} color={c.fg} />
      </Card>

      <Segmented value={term} onChange={setTerm} options={TERMS.map((t) => ({ value: t.number, label: t.nameAr }))} />

      {units.length === 0 ? (
        <EmptyState icon="book-clock-outline" title="لا توجد وحدات بعد" message="سيُضاف محتوى هذا الفصل قريباً." />
      ) : (
        units.map((unit) => {
          const comp = completionFor(
            unit.lessons.map((l) => l.id),
            lessonBest,
          );
          return (
            <Card key={unit.id} style={{ gap: spacing.md }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" color="textMuted">
                    الوحدة {unit.order}
                  </AppText>
                  <AppText variant="h2">{unit.title}</AppText>
                </View>
                <AppText variant="label" color={c.fg} weight="bold">
                  {Math.round(comp.ratio * 100)}%
                </AppText>
              </Row>
              <ProgressBar value={comp.ratio} color={c.fg} height={6} />
              {unit.lessons.map((lesson) => {
                const best = lessonBest[lesson.id];
                const done = isLessonDone(best);
                return (
                  <Pressable
                    key={lesson.id}
                    onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.lesson, { backgroundColor: colors.surfaceAlt }, pressed && { opacity: 0.7 }]}>
                    <View style={[styles.num, { backgroundColor: done ? colors.success : colors.surface }]}>
                      {done ? (
                        <Icon name="check" size={18} color="#fff" />
                      ) : (
                        <AppText variant="caption" weight="bold">
                          {lesson.order}
                        </AppText>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="label">{lesson.title}</AppText>
                      {best && (
                        <AppText variant="caption" color="textMuted">
                          أفضل نتيجة {best.percent}%
                        </AppText>
                      )}
                    </View>
                    {best ? <Stars count={best.stars} size={16} /> : <Icon name="chevron-left" color="textMuted" />}
                  </Pressable>
                );
              })}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lesson: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md },
  num: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
