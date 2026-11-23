import { router, Stack, useLocalSearchParams, useNavigation, usePreventRemove } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';

import { QuestionView } from '@/components/quiz/QuestionView';
import { AppText, Button, Card, EmptyState, FadeIn, Icon, ProgressBar, Row, Screen, Toast } from '@/components/ui';
import { buildLessonQuiz, getLesson } from '@/lib/data/repository';
import { answerFeedback, playSound } from '@/lib/feedback';
import { POINTS_BY_DIFFICULTY, scoreQuiz } from '@/lib/gamification';
import { correctAnswerText } from '@/lib/quiz/grading';
import { gradePrepared, prepareQuiz, type PreparedQuestion } from '@/lib/quiz/prepare';
import { randomSeed } from '@/lib/random';
import { subjectIdFromLesson, useProgress, useSession, useSettings, type AnswerRecord } from '@/lib/store';
import { spacing, useAppTheme } from '@/lib/theme';
import { SUBJECTS } from '@/config/curriculum';
import type { QuestionResponse } from '@/lib/types';
import { queueAttempt } from '@/lib/sync';
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
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);

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
        <EmptyState icon="ClipboardCheck" title="لا توجد أسئلة" message="لا توجد أسئلة متاحة الآن.">
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
    if (correct) {
      setCorrectCount((n) => n + 1);
      setToast({ text: `+${POINTS_BY_DIFFICULTY[item.question.difficulty]} نقطة`, key: Date.now() });
    }
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
    // الرفع إلى الخادم (إن كان المستخدم مسجلاً) — لا ينتظر حتى لا يتأخر عرض النتيجة
    queueAttempt(attempt, [...answers.current]).catch(() => {});
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
  const progress = (index + (result !== null ? 1 : 0)) / items.length;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: mode === 'mistakes' ? 'مراجعة الأخطاء' : (lessonInfo?.lesson.title ?? 'الاختبار'),
          headerLeft: () => (
            <Pressable onPress={() => router.back()} accessibilityLabel="إغلاق الاختبار" hitSlop={12}>
              <Icon name="X" size={22} color="textMuted" />
            </Pressable>
          ),
        }}
      />
      <View style={{ gap: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText variant="caption" color="textMuted">
            السؤال {index + 1} من {items.length}
          </AppText>
          <AppText variant="caption" color="goldText">
            {correctCount} إجابات صحيحة
          </AppText>
        </Row>
        <ProgressBar value={progress} />
        {/* إشعار النقاط يطفو فوق المحتوى دون أن يزيحه */}
        {toast && <Toast key={toast.key} text={toast.text} visible style={{ position: 'absolute', top: 40, zIndex: 10 }} />}
      </View>

      <FadeIn key={item.question.id + index}>
        <QuestionView item={item} ltr={ltr} response={response} result={result} onChange={setResponse} onSubmit={submit} />
      </FadeIn>

      {result !== null && (
        <FadeIn>
          <Card style={{ borderColor: result ? colors.success : colors.danger, gap: spacing.md }}>
            <Row gap={spacing.sm}>
              <Icon name={result ? 'CircleCheck' : 'CircleX'} color={result ? 'success' : 'danger'} />
              <AppText variant="h2" color={result ? 'successText' : 'dangerText'}>
                {result ? (ltr ? 'Correct' : 'إجابة صحيحة') : ltr ? 'Not quite' : 'ليست الإجابة الصحيحة'}
              </AppText>
            </Row>
            {!result && (
              <View style={{ gap: 2 }}>
                <AppText variant="caption" color="textMuted">
                  {ltr ? 'Correct answer' : 'الإجابة الصحيحة'}
                </AppText>
                <AppText variant="label" color="successText" ltr={ltr}>
                  {correctAnswerText(item.question)}
                </AppText>
              </View>
            )}
            <AppText color="textMuted" ltr={ltr}>
              {item.question.explanation}
            </AppText>
            <Button title={isLast ? 'عرض النتيجة' : 'متابعة'} onPress={next} style={{ marginTop: spacing.xs }} />
          </Card>
        </FadeIn>
      )}
    </Screen>
  );
}
