import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, Chip, EmptyState, Icon, Row, Screen, Segmented, Stars } from '@/components/ui';
import { gradeName } from '@/config/curriculum';
import { GENERATED_MATH_COUNT, getLesson, getLessonQuestions } from '@/lib/data/repository';
import { useProgress, useSettings } from '@/lib/store';
import { spacing, subjectColors, useAppTheme } from '@/lib/theme';
import { useStudyTimer } from '@/lib/useStudyTimer';

type Tab = 'summary' | 'videos' | 'quiz' | 'book';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const info = getLesson(id);
  const [tab, setTab] = useState<Tab>('summary');
  const { isDark } = useAppTheme();
  const showUnreviewed = useSettings((s) => s.showUnreviewed);
  const best = useProgress((s) => s.lessonBest[id]);
  useStudyTimer();

  if (!info) return <EmptyState icon="alert-circle-outline" title="الدرس غير موجود" />;
  const { lesson, unit, subject, meta } = info;
  const c = subjectColors(meta.color, meta.tint, isDark);
  const isMath = subject.key === 'math';
  const fixed = getLessonQuestions(lesson.id, { includeUnreviewed: showUnreviewed });
  const unreviewedCount = fixed.filter((q) => !q.reviewed).length;
  const quizCount = Math.min(10, fixed.length + (isMath ? GENERATED_MATH_COUNT : 0));

  return (
    <Screen>
      <Stack.Screen options={{ title: meta.nameAr }} />
      <View style={{ gap: 4 }}>
        <AppText variant="caption" color={c.fg} weight="semibold">
          {gradeName(subject.grade)} • الوحدة {unit.order}: {unit.title}
        </AppText>
        <AppText variant="title">{lesson.title}</AppText>
      </View>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'summary', label: 'الملخص', icon: 'text-box-outline' },
          { value: 'videos', label: 'الفيديوهات', icon: 'play-circle-outline' },
          { value: 'quiz', label: 'الاختبار', icon: 'clipboard-check-outline' },
          { value: 'book', label: 'الكتاب', icon: 'book-open-variant' },
        ]}
      />

      {tab === 'summary' && (
        <>
          <Card>
            <Row>
              <Icon name="target" color={c.fg} />
              <AppText variant="h2">أهداف الدرس</AppText>
            </Row>
            {lesson.objectives.map((o, i) => (
              <Row key={i} style={{ alignItems: 'flex-start' }}>
                <AppText color={c.fg} weight="bold">
                  •
                </AppText>
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
          <Icon name="clipboard-check-outline" size={48} color={c.fg} />
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
              <AppText variant="h2" center>
                اختبار قصير: {quizCount} أسئلة
              </AppText>
              {isMath && <Chip label="أسئلة رياضيات جديدة في كل مرة" icon="refresh" color={c.fg} bg={c.bg} />}
              {unreviewedCount > 0 && <Chip label={`يشمل ${unreviewedCount} أسئلة غير مراجَعة (وضع التطوير)`} icon="flask-outline" />}
              {best && (
                <Row>
                  <AppText color="textMuted">أفضل نتيجة: {best.percent}%</AppText>
                  <Stars count={best.stars} />
                </Row>
              )}
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
