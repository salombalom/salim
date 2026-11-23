import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { HeroBackground } from '@/components/HeroBackground';
import { AppText, Button, Card, Chip, EmptyState, Gradient, Icon, Row, Screen, Segmented, Stars } from '@/components/ui';
import { gradeName } from '@/config/curriculum';
import { GENERATED_MATH_COUNT, getLesson, getLessonQuestions } from '@/lib/data/repository';
import { useProgress, useSettings } from '@/lib/store';
import { alpha, radius, spacing, useAppTheme } from '@/lib/theme';
import { useStudyTimer } from '@/lib/useStudyTimer';

type Tab = 'summary' | 'videos' | 'quiz' | 'book';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const info = getLesson(id);
  const [tab, setTab] = useState<Tab>('summary');
  const { colors } = useAppTheme();
  const showUnreviewed = useSettings((s) => s.showUnreviewed);
  const best = useProgress((s) => s.lessonBest[id]);
  useStudyTimer();

  if (!info) return <EmptyState icon="alert-circle-outline" title="الدرس غير موجود" />;
  const { lesson, unit, subject, meta } = info;
  const [from, to] = meta.gradient;
  const isMath = subject.key === 'math';
  const fixed = getLessonQuestions(lesson.id, { includeUnreviewed: showUnreviewed });
  const unreviewedCount = fixed.filter((q) => !q.reviewed).length;
  const quizCount = Math.min(10, fixed.length + (isMath ? GENERATED_MATH_COUNT : 0));

  return (
    <Screen>
      <Stack.Screen options={{ title: meta.nameAr }} />
      <HeroBackground colors={[from, to]} style={styles.hero}>
        <Row gap={6}>
          <MaterialCommunityIcons name={meta.icon as never} size={16} color="rgba(255,255,255,0.9)" />
          <AppText variant="caption" weight="semibold" color="rgba(255,255,255,0.9)">
            {gradeName(subject.grade)} • الوحدة {unit.order}: {unit.title}
          </AppText>
        </Row>
        <AppText variant="title" color="#FFFFFF">
          {lesson.title}
        </AppText>
        {best && (
          <Row gap={6} style={styles.bestPill}>
            <Stars count={best.stars} size={16} emptyColor="rgba(255,255,255,0.35)" />
            <AppText variant="caption" weight="bold" color="#FFFFFF">
              أفضل نتيجة {best.percent}%
            </AppText>
          </Row>
        )}
      </HeroBackground>

      <Segmented
        value={tab}
        onChange={setTab}
        activeColor={to}
        options={[
          { value: 'summary', label: 'الملخص', icon: 'text-box-outline' },
          { value: 'videos', label: 'فيديو', icon: 'play-circle-outline' },
          { value: 'quiz', label: 'اختبار', icon: 'lightning-bolt' },
          { value: 'book', label: 'الكتاب', icon: 'book-open-variant' },
        ]}
      />

      {tab === 'summary' && (
        <>
          <Card>
            <Row>
              <Icon name="bullseye-arrow" color={to} size={24} />
              <AppText variant="h2">أهداف الدرس</AppText>
            </Row>
            {lesson.objectives.map((o, i) => (
              <Row key={i} style={{ alignItems: 'flex-start' }} gap={spacing.sm}>
                <View style={[styles.objNum, { backgroundColor: alpha(to, 0.14) }]}>
                  <AppText variant="tiny" weight="bold" color={to}>
                    {i + 1}
                  </AppText>
                </View>
                <AppText style={{ flex: 1 }} ltr={meta.direction === 'ltr'}>
                  {o}
                </AppText>
              </Row>
            ))}
          </Card>
          <EmptyState icon="text-box-search-outline" title="الملخص قيد الإعداد" message="سيظهر ملخص الدرس هنا بعد مراجعته والموافقة عليه." />
        </>
      )}

      {tab === 'videos' && (
        <EmptyState icon="youtube" title="لا توجد فيديوهات بعد" message="ستظهر هنا فيديوهات شرح مختارة من قنوات تعليمية موثوقة بعد مراجعتها." />
      )}

      {tab === 'quiz' && (
        <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
          <Gradient colors={[from, to]} style={styles.quizIcon}>
            <Icon name="lightning-bolt" size={52} color="#FFFFFF" />
          </Gradient>
          {quizCount === 0 ? (
            <>
              <AppText variant="h2" center>
                لا توجد أسئلة مراجَعة بعد
              </AppText>
              <AppText color="textMuted" center>
                ستتوفر أسئلة هذا الدرس بعد مراجعتها.
              </AppText>
            </>
          ) : (
            <>
              <AppText variant="title" center>
                تحدَّ نفسك! 💪
              </AppText>
              <Row gap={spacing.sm} style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip label={`${quizCount} أسئلة`} icon="help-circle-outline" color={to} bg={alpha(to, 0.12)} />
                <Chip label={`حتى ${quizCount * 20} نقطة`} icon="star-four-points" color={colors.warning} bg={colors.starSoft} />
                {isMath && <Chip label="أسئلة جديدة كل مرة" icon="refresh" color={colors.sky} bg={colors.skySoft} />}
              </Row>
              {unreviewedCount > 0 && <Chip label={`يشمل ${unreviewedCount} أسئلة غير مراجَعة (وضع التطوير)`} icon="flask-outline" color={colors.warning} bg={colors.warningSoft} />}
              <Button
                title={best ? 'أعد الاختبار' : 'ابدأ الاختبار'}
                icon="play"
                style={{ alignSelf: 'stretch' }}
                onPress={() => router.push({ pathname: '/quiz', params: { lessonId: lesson.id } })}
              />
            </>
          )}
        </Card>
      )}

      {tab === 'book' && (
        <EmptyState icon="book-open-page-variant" title="الكتاب المدرسي" message="سيتوفر هنا رابط الكتاب الرسمي من المصدر المعتمد، ويُفتح داخل التطبيق." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.xs },
  bestPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.16)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  objNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  quizIcon: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
});
