import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, EmptyState, Icon, IconCircle, Mastery, Num, ProgressBar, Row, Screen, Segmented } from '@/components/ui';
import { gradeName, TERMS, type TermNumber } from '@/config/curriculum';
import { useContent } from '@/lib/data/contentStore';
import { getSubject } from '@/lib/data/repository';
import { completionFor, isLessonDone } from '@/lib/progress';
import { useProgress } from '@/lib/store';
import { borderWidth, fonts, spacing, useAppTheme } from '@/lib/theme';

export default function SubjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subject = getSubject(id);
  const { colors, fontScale } = useAppTheme();
  useContent((c) => c.version); // يعيد العرض بعد تنزيل محتوى جديد
  const lessonBest = useProgress((s) => s.lessonBest);
  const [term, setTerm] = useState<TermNumber>(1);

  if (!subject) return <EmptyState icon="CircleAlert" title="المادة غير موجودة" />;
  const units = subject.units.filter((u) => u.term === term);
  const all = completionFor(
    subject.units.flatMap((u) => u.lessons.map((l) => l.id)),
    lessonBest,
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: '' }} />
      {/* رأس المادة */}
      <View style={{ gap: spacing.lg }}>
        <Row gap={spacing.lg}>
          <IconCircle name={subject.meta.icon} size={56} tint={subject.meta.color} />
          <View style={{ flex: 1 }}>
            <AppText variant="display">{subject.meta.nameAr}</AppText>
            <AppText color="textMuted">{gradeName(subject.grade)}</AppText>
          </View>
        </Row>
        <View style={{ gap: spacing.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <AppText variant="caption" color="textMuted">
              نسبة الإنجاز
            </AppText>
            <Num variant="label">{`${Math.round(all.ratio * 100)}%`}</Num>
          </Row>
          <ProgressBar value={all.ratio} />
        </View>
      </View>

      <Segmented value={term} onChange={setTerm} options={TERMS.map((t) => ({ value: t.number, label: t.nameAr }))} />

      {units.length === 0 ? (
        <EmptyState icon="BookOpen" title="لا توجد وحدات بعد" message="سيُضاف محتوى هذا الفصل قريباً." />
      ) : (
        units.map((unit) => {
          const comp = completionFor(
            unit.lessons.map((l) => l.id),
            lessonBest,
          );
          return (
            <Card key={unit.id} accent={subject.meta.color} style={{ gap: spacing.sm, paddingVertical: spacing.lg }}>
              <Row style={{ justifyContent: 'space-between', paddingBottom: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="overline" color="goldText">
                    الوحدة {unit.order}
                  </AppText>
                  <AppText variant="h2">{unit.title}</AppText>
                </View>
                <AppText variant="caption" color="textMuted">
                  {comp.done} / {comp.total}
                </AppText>
              </Row>
              {unit.lessons.map((lesson, i) => {
                const best = lessonBest[lesson.id];
                const done = isLessonDone(best);
                return (
                  <Pressable
                    key={lesson.id}
                    onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.lesson,
                      { borderTopColor: colors.border, borderTopWidth: i === 0 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.border },
                      i === unit.lessons.length - 1 && { borderBottomWidth: 0 },
                      pressed && { opacity: 0.6 },
                    ]}>
                    <View style={[styles.num, { borderColor: colors.gold, backgroundColor: done ? colors.goldFaint : 'transparent' }]}>
                      {done ? (
                        <Icon name="Check" size={16} />
                      ) : (
                        <AppText color="goldText" style={{ fontFamily: fonts.heading, fontSize: 15 * fontScale, lineHeight: 22 * fontScale }}>
                          {lesson.order}
                        </AppText>
                      )}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="label">{lesson.title}</AppText>
                      {best ? (
                        <Row gap={spacing.sm}>
                          <Mastery count={best.stars} size={7} />
                          <AppText variant="caption" color="textMuted">
                            أفضل نتيجة {best.percent}%
                          </AppText>
                        </Row>
                      ) : (
                        <AppText variant="caption" color="textMuted">
                          لم يبدأ بعد
                        </AppText>
                      )}
                    </View>
                    <Icon name="ChevronLeft" size={18} color="textMuted" />
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
  lesson: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth },
  num: { width: 36, height: 36, borderRadius: 18, borderWidth: borderWidth.hairline, alignItems: 'center', justifyContent: 'center' },
});
