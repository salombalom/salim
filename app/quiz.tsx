import { router, Stack, useLocalSearchParams, useNavigation, usePreventRemove } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { QuestionView } from '@/components/quiz/QuestionView';
import { AppText, Button, EmptyState, Icon, ProgressBar, Row, Screen } from '@/components/ui';
import { buildLessonQuiz, getLesson } from '@/lib/data/repository';
import { answerFeedback, playSound } from '@/lib/feedback';
import { scoreQuiz } from '@/lib/gamification';
import { correctAnswerText } from '@/lib/quiz/grading';
import { gradePrepared, prepareQuiz, type PreparedQuestion } from '@/lib/quiz/prepare';
import { randomSeed } from '@/lib/random';
import { subjectIdFromLesson, useProgress, useSession, useSettings, type AnswerRecord } from '@/lib/store';
import { alpha, radius, spacing, useAppTheme } from '@/lib/theme';
import { SUBJECTS } from '@/config/curriculum';
import type { QuestionResponse } from '@/lib/types';
import { useStudyTimer } from '@/lib/useStudyTimer';

/**
 * شاشة الاختبار — سؤال في كل مرة.
 * params:
 *  - lessonId: اختبار درس
 *  - mode=mistakes (+ subjectId اختياري): إعادة حل الأخطاء
 */
export default function QuizScreen() {
  const params = useLocalSearchParams<{ lessonId?: string; mode?: string; subjectId?: string; ids?: string }>();
  const mode = params.mode === 'mistakes' ? 'mistakes' : 'lesson';
  const showUnreviewed = useSettings((s) => s.showUnreviewed);
  const { colors } = useAppTheme();
  const navigation = useNavigation();
  useStudyTimer();

  const [seed] = useState(randomSeed);
  const items = useMemo<PreparedQuestion[]>(() => {
    if (mode === 'mistakes') {
      const all = Object.values(useProgress.getState().mistakes)
        .filter((m) => !params.subjectId || m.subjectId === params.subjectId)
        .filter((m) => !params.ids || params.ids.split(',').includes(m.question.id))
        .sort((a, b) => b.lastAt - a.lastAt)
        .map((m) => m.question);
      return prepareQuiz(all, seed);
    }
    if (!params.lessonId) return [];
    return prepareQuiz(buildLessonQuiz(params.lessonId, { includeUnreviewed: showUnreviewed }, seed), seed);
    // الأسئلة تُبنى مرة واحدة عند فتح الشاشة
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState<QuestionResponse | null>(null);
  const [result, setResult] = useState<boolean | null>(null);
  const answers = useRef<AnswerRecord[]>([]);
  const [startedAt] = useState(() => Date.now());
  const [correctCount, setCorrectCount] = useState(0);

  const lessonInfo = params.lessonId ? getLesson(params.lessonId) : undefined;
  const item = items[index];
  const subjectKey = item ? subjectIdFromLesson(item.question.lessonId).split('-')[1] : undefined;
  const ltr = (subjectKey && SUBJECTS[subjectKey as keyof typeof SUBJECTS]?.direction === 'ltr') || false;

  const [answeredCount, setAnsweredCount] = useState(0);
  const [done, setDone] = useState(false);

  // تأكيد قبل الخروج من منتصف الاختبار
  usePreventRemove(answeredCount > 0 && !done, ({ data }) => {
    const leave = () => navigation.dispatch(data.action);
    if (Platform.OS === 'web') {
      if (window.confirm('هل تريد الخروج؟ لن تُحفظ نتيجة هذا الاختبار.')) leave();
      return;
    }
    Alert.alert('الخروج من الاختبار', 'لن تُحفظ نتيجة هذا الاختبار.', [
      { text: 'متابعة الاختبار', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: leave },
    ]);
  });

  // ننتقل لشاشة النتيجة بعد إيقاف تأكيد الخروج
  useEffect(() => {
    if (done) router.replace('/result');
  }, [done]);

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState icon="clipboard-off-outline" title="لا توجد أسئلة" message="لا توجد أسئلة متاحة الآن.">
          <Button title="رجوع" kind="secondary" onPress={() => router.back()} />
        </EmptyState>
      </Screen>
    );
  }

  const submit = (r: QuestionResponse) => {
    if (result !== null) return;
    const { gradable, correct } = gradePrepared(item, r);
    setResponse(r);
    setResult(correct);
    answers.current.push({ question: item.question, response: gradable, correct });
    setAnsweredCount((n) => n + 1);
    if (correct) setCorrectCount((n) => n + 1);
    answerFeedback(correct);
  };

  const finish = () => {
    const score = scoreQuiz(answers.current.map((a) => ({ correct: a.correct, difficulty: a.question.difficulty })));
    const attempt = useProgress.getState().recordQuiz({
      lessonId: mode === 'lesson' ? (params.lessonId ?? null) : null,
      subjectId: mode === 'lesson' && params.lessonId ? subjectIdFromLesson(params.lessonId) : (params.subjectId ?? null),
      mode,
      answers: answers.current,
      score,
      durationSec: Math.round((Date.now() - startedAt) / 1000),
    });
    useSession.getState().setLastResult({ attempt, answers: [...answers.current] });
    playSound('finish');
    setDone(true);
  };

  const next = () => {
    if (index + 1 >= items.length) return finish();
    setIndex(index + 1);
    setResponse(null);
    setResult(null);
  };

  const isLast = index + 1 >= items.length;
  const subjectMeta = subjectKey ? SUBJECTS[subjectKey as keyof typeof SUBJECTS] : undefined;
  const accent = subjectMeta?.gradient[1] ?? colors.primary;
  const progress = (index + (result !== null ? 1 : 0)) / items.length;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: mode === 'mistakes' ? 'حلّ أخطائي' : (lessonInfo?.lesson.title ?? 'الاختبار'),
          headerLeft: () => (
            <Pressable onPress={() => router.back()} accessibilityLabel="إغلاق الاختبار" hitSlop={12}>
              <Icon name="close" size={26} color="textMuted" />
            </Pressable>
          ),
        }}
      />
      <Row gap={spacing.md}>
        <View style={{ flex: 1 }}>
          <ProgressBar value={progress} color={accent} height={14} />
        </View>
        <Row gap={4} style={[styles.scorePill, { backgroundColor: colors.starSoft }]}>
          <Icon name="star-four-points" size={16} color={colors.star} />
          <AppText variant="label" weight="black" color={colors.warning}>
            {correctCount}
          </AppText>
        </Row>
      </Row>
      <AppText variant="caption" weight="bold" color="textMuted">
        السؤال {index + 1} من {items.length}
      </AppText>

      <QuestionView key={item.question.id + index} item={item} ltr={ltr} accent={accent} response={response} result={result} onChange={setResponse} onSubmit={submit} />

      {result !== null && (
        <View
          style={[
            styles.feedback,
            {
              backgroundColor: result ? colors.successSoft : colors.dangerSoft,
              borderColor: result ? colors.success : colors.danger,
            },
          ]}>
          <Row gap={spacing.md}>
            <View style={[styles.feedbackIcon, { backgroundColor: result ? colors.success : colors.danger }]}>
              <Icon name={result ? 'check-bold' : 'close-thick'} size={28} color="#FFFFFF" />
            </View>
            <AppText variant="title" color={result ? 'successDeep' : 'dangerDeep'} style={{ flex: 1 }}>
              {result ? (ltr ? 'Excellent! 🎉' : PRAISE[index % PRAISE.length]) : ltr ? 'Not quite!' : 'لا بأس، تعلّمنا شيئاً! 💡'}
            </AppText>
          </Row>
          {!result && (
            <View style={[styles.answerBox, { borderColor: alpha(colors.danger, 0.3), backgroundColor: colors.surface }]}>
              <AppText variant="caption" color="textMuted">
                {ltr ? 'Correct answer' : 'الإجابة الصحيحة'}
              </AppText>
              <AppText weight="bold" color="successDeep" ltr={ltr}>
                {correctAnswerText(item.question)}
              </AppText>
            </View>
          )}
          <AppText ltr={ltr}>{item.question.explanation}</AppText>
          <Button
            title={isLast ? 'عرض النتيجة' : 'متابعة'}
            kind={result ? 'success' : 'danger'}
            icon={isLast ? 'flag-checkered' : 'arrow-left'}
            onPress={next}
          />
        </View>
      )}
    </Screen>
  );
}

const PRAISE = ['رائع! 🎉', 'أحسنت! 🌟', 'ممتاز! 👏', 'إجابة بطل! 🏆', 'استمر هكذا! 🚀'];

const styles = StyleSheet.create({
  scorePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  feedback: { borderRadius: radius.lg, borderWidth: 2, padding: spacing.lg, gap: spacing.md },
  feedbackIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  answerBox: { borderRadius: radius.md, padding: spacing.md, borderWidth: 1 },
});
