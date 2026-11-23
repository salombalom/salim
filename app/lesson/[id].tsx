import { LOCAL_ONLY } from '@/config/app';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Chip, EmptyState, IconCircle, Mastery, Row, Screen, Segmented } from '@/components/ui';
import { BookTab } from '@/components/lesson/BookTab';
import { VideosTab } from '@/components/lesson/VideosTab';
import { gradeName, TERMS } from '@/config/curriculum';
import { getLessonVideos, getSubjectVideos, getTextbooks } from '@/lib/data/media';
import { useContent } from '@/lib/data/contentStore';
import { GENERATED_MATH_COUNT, getLesson, getLessonQuestions } from '@/lib/data/repository';
import { useProgress, useSettings } from '@/lib/store';
import { spacing, useAppTheme } from '@/lib/theme';
import { useStudyTimer } from '@/lib/useStudyTimer';

type Tab = 'summary' | 'videos' | 'quiz' | 'book';

export default function LessonScreen() {
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: Tab }>();
  const info = getLesson(id);
  const [tab, setTab] = useState<Tab>(initialTab ?? 'summary');
  const { colors } = useAppTheme();
  useContent((c) => c.version); // يعيد العرض بعد تنزيل محتوى جديد
  const showUnreviewed = useSettings((s) => s.showUnreviewed);
  const best = useProgress((s) => s.lessonBest[id]);
  useStudyTimer();

  if (!info) return <EmptyState icon="CircleAlert" title="الدرس غير موجود" />;
  const { lesson, unit, subject, meta } = info;
  const isMath = subject.key === 'math';
  const fixed = getLessonQuestions(lesson.id, { includeUnreviewed: showUnreviewed });
  const unreviewedCount = fixed.filter((q) => !q.reviewed).length;
  const quizCount = Math.min(10, fixed.length + (isMath ? GENERATED_MATH_COUNT : 0));

  return (
    <Screen>
      <Stack.Screen options={{ title: '' }} />
      <View style={{ gap: spacing.sm }}>
        <AppText variant="overline" color="goldText">
          {meta.nameAr} · {gradeName(subject.grade)}
        </AppText>
        <AppText variant="display">{lesson.title}</AppText>
        <AppText color="textMuted">
          الوحدة {unit.order}: {unit.title}
        </AppText>
        {best && (
          <Row gap={spacing.sm} style={{ marginTop: spacing.xs }}>
            <Mastery count={best.stars} />
            <AppText variant="caption" color="textMuted">
              أفضل نتيجة {best.percent}%
            </AppText>
          </Row>
        )}
      </View>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'summary', label: 'الملخص' },
          { value: 'videos', label: 'الشرح' },
          { value: 'quiz', label: 'الاختبار' },
          { value: 'book', label: 'الكتاب' },
        ]}
      />

      {tab === 'summary' && (
        <>
          <Card accent={meta.color}>
            <AppText variant="h2">أهداف الدرس</AppText>
            {lesson.objectives.map((o, i) => (
              <Row key={i} style={{ alignItems: 'flex-start' }} gap={spacing.md}>
                <View style={[styles.bullet, { borderColor: colors.gold }]} />
                <AppText style={{ flex: 1 }} ltr={meta.direction === 'ltr'}>
                  {o}
                </AppText>
              </Row>
            ))}
          </Card>
          <EmptyState icon="FileText" title="الملخص قيد الإعداد" message="يظهر ملخص الدرس هنا بعد مراجعته واعتماده." />
        </>
      )}

      {tab === 'videos' && <VideosTab lessonVideos={getLessonVideos(lesson.id)} subjectVideos={getSubjectVideos(subject.id)} subjectName={meta.nameAr} lessonId={lesson.id} lessonTitle={lesson.title} />}

      {tab === 'quiz' && (
        <Card style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxl }}>
          <IconCircle name="ClipboardCheck" size={64} />
          {quizCount === 0 ? (
            <View style={{ gap: spacing.xs }}>
              <AppText variant="h2" center>
                لا توجد أسئلة معتمدة بعد
              </AppText>
              <AppText color="textMuted" center>
                تتوفر أسئلة هذا الدرس بعد مراجعتها.
              </AppText>
            </View>
          ) : (
            <>
              <View style={{ gap: spacing.xs }}>
                <AppText variant="title" center>
                  اختبار قصير
                </AppText>
                <AppText color="textMuted" center>
                  {quizCount} أسئلة · نحو {Math.max(2, Math.round(quizCount * 0.5))} دقائق
                </AppText>
              </View>
              <Row gap={spacing.sm} style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                {isMath && <Chip label="أسئلة متجددة في كل مرة" icon="Repeat" tone="gold" />}
                {unreviewedCount > 0 && !LOCAL_ONLY && <Chip label={`يشمل ${unreviewedCount} أسئلة غير مراجَعة`} icon="Info" />}
              </Row>
              <Button
                title={best ? 'إعادة الاختبار' : 'ابدأ الاختبار'}
                style={{ alignSelf: 'stretch' }}
                onPress={() => router.push({ pathname: '/quiz', params: { lessonId: lesson.id } })}
              />
            </>
          )}
        </Card>
      )}

      {tab === 'book' && <BookTab books={getTextbooks(subject.id, unit.term)} termName={TERMS.find((t) => t.number === unit.term)?.nameAr ?? ''} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bullet: { width: 7, height: 7, borderWidth: 1, transform: [{ rotate: '45deg' }], marginTop: 10 },
});
