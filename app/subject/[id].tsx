import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { HeroBackground } from '@/components/HeroBackground';
import { AppText, Card, EmptyState, Gradient, Icon, ProgressBar, Row, Screen, Segmented, Stars } from '@/components/ui';
import { gradeName, TERMS, type TermNumber } from '@/config/curriculum';
import { getSubject } from '@/lib/data/repository';
import { completionFor, isLessonDone } from '@/lib/progress';
import { useProgress } from '@/lib/store';
import { alpha, radius, spacing, useAppTheme } from '@/lib/theme';

export default function SubjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subject = getSubject(id);
  const { colors } = useAppTheme();
  const lessonBest = useProgress((s) => s.lessonBest);
  const [term, setTerm] = useState<TermNumber>(1);

  if (!subject) return <EmptyState icon="alert-circle-outline" title="المادة غير موجودة" />;
  const [from, to] = subject.meta.gradient;
  const units = subject.units.filter((u) => u.term === term);
  const all = completionFor(
    subject.units.flatMap((u) => u.lessons.map((l) => l.id)),
    lessonBest,
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: subject.meta.nameAr }} />
      <HeroBackground colors={[from, to]} style={styles.hero}>
        <Row gap={spacing.md}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name={subject.meta.icon as never} size={36} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="title" color="#FFFFFF">
              {subject.meta.nameAr}
            </AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.9)">
              {gradeName(subject.grade)}
            </AppText>
          </View>
          <View style={styles.percent}>
            <AppText variant="h2" color="#FFFFFF">
              {Math.round(all.ratio * 100)}%
            </AppText>
            <AppText variant="tiny" color="rgba(255,255,255,0.9)">
              الإنجاز
            </AppText>
          </View>
        </Row>
        <ProgressBar value={all.ratio} color="#FFFFFF" trackColor="rgba(255,255,255,0.28)" />
      </HeroBackground>

      <Segmented value={term} onChange={setTerm} activeColor={to} options={TERMS.map((t) => ({ value: t.number, label: t.nameAr }))} />

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
                  <AppText variant="tiny" weight="bold" color={to}>
                    الوحدة {unit.order}
                  </AppText>
                  <AppText variant="h2">{unit.title}</AppText>
                </View>
                <View style={[styles.unitBadge, { backgroundColor: alpha(to, 0.12) }]}>
                  <AppText variant="label" weight="bold" color={to}>
                    {comp.done}/{comp.total}
                  </AppText>
                </View>
              </Row>
              <ProgressBar value={comp.ratio} color={to} height={8} />

              <View style={{ gap: 0 }}>
                {unit.lessons.map((lesson, i) => {
                  const best = lessonBest[lesson.id];
                  const done = isLessonDone(best);
                  const lastItem = i === unit.lessons.length - 1;
                  return (
                    <View key={lesson.id} style={styles.pathRow}>
                      {/* العقدة والخط الواصل */}
                      <View style={styles.pathCol}>
                        {done ? (
                          <Gradient colors={[from, to]} style={styles.node}>
                            <Icon name="check-bold" size={20} color="#FFFFFF" />
                          </Gradient>
                        ) : (
                          <View style={[styles.node, { backgroundColor: colors.surface, borderWidth: 3, borderColor: alpha(to, 0.35) }]}>
                            <AppText variant="label" weight="black" color={to}>
                              {lesson.order}
                            </AppText>
                          </View>
                        )}
                        {!lastItem && <View style={[styles.line, { backgroundColor: done ? to : colors.border }]} />}
                      </View>
                      <Pressable
                        onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}
                        accessibilityRole="button"
                        style={({ pressed }) => [styles.lesson, { backgroundColor: colors.surfaceAlt }, pressed && { transform: [{ scale: 0.98 }] }]}>
                        <View style={{ flex: 1 }}>
                          <AppText variant="label" weight="bold">
                            {lesson.title}
                          </AppText>
                          {best ? (
                            <Row gap={6}>
                              <Stars count={best.stars} size={14} />
                              <AppText variant="tiny" color="textMuted">
                                أفضل نتيجة {best.percent}%
                              </AppText>
                            </Row>
                          ) : (
                            <AppText variant="tiny" color="textMuted">
                              {lesson.objectives.length} أهداف • اختبار قصير
                            </AppText>
                          )}
                        </View>
                        <Icon name="chevron-left" color="textMuted" />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  heroIcon: { width: 62, height: 62, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  percent: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.14)', borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 4 },
  unitBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill },
  pathRow: { flexDirection: 'row', gap: spacing.md },
  pathCol: { alignItems: 'center', width: 44 },
  node: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  line: { width: 4, flex: 1, minHeight: 14, borderRadius: 2, marginVertical: 2 },
  lesson: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
});
