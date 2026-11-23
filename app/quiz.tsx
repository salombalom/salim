import { router, Stack, useLocalSearchParams, useNavigation, usePreventRemove } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';

import { QuestionView } from '@/components/quiz/QuestionView';
import { AppText, Button, Card, EmptyState, Icon, ProgressBar, Row, Screen } from '@/components/ui';
import { buildLessonQuiz, getLesson } from '@/lib/data/repository';
import { answerFeedback, playSound } from '@/lib/feedback';
import { scoreQuiz } from '@/lib/gamification';
import { correctAnswerText } from '@/lib/quiz/grading';
import { gradePrepared, prepareQuiz, type PreparedQuestion } from '@/lib/quiz/prepare';
import { randomSeed } from '@/lib/random';
import { subjectIdFromLesson, useProgress, useSession, useSettings, type AnswerRecord } from '@/lib/store';
import { spacing, useAppTheme } from '@/lib/theme';
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

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: mode === 'mistakes' ? 'حلّ أخطائي' : (lessonInfo?.lesson.title ?? 'الاختبار'),
          headerLeft: () => (
            <Pressable onPress={() => router.back()} accessibilityLabel="إغلاق الاختبار" hitSlop={12}>
              <Icon name="close" />
            </Pressable>
          ),
        }}
      />
      <View style={{ gap: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText variant="caption" color="textMuted">
            السؤال {index + 1} من {items.length}
          </AppText>
          <Row gap={4}>
            <Icon name="check-circle" size={16} color="success" />
            <AppText variant="caption" color="textMuted">
              {correctCount}
            </AppText>
          </Row>
        </Row>
        <ProgressBar value={(index + (result !== null ? 1 : 0)) / items.length} />
      </View>

      <QuestionView key={item.question.id + index} item={item} ltr={ltr} response={response} result={result} onChange={setResponse} onSubmit={submit} />

      {result !== null && (
        <Card
          style={{
            backgroundColor: result ? colors.successSoft : colors.dangerSoft,
            borderColor: result ? colors.success : colors.danger,
          }}>
          <Row>
            <Icon name={result ? 'check-circle' : 'close-circle'} color={result ? 'success' : 'danger'} size={26} />
            <AppText variant="h2" color={result ? 'success' : 'danger'}>
              {result ? (ltr ? 'Correct! 🎉' : 'إجابة صحيحة! 🎉') : ltr ? 'Not quite' : 'إجابة خاطئة'}
            </AppText>
          </Row>
          {!result && (
            <AppText weight="semibold" ltr={ltr}>
              {ltr ? 'Correct answer: ' : 'الإجابة الصحيحة: '}
              {correctAnswerText(item.question)}
            </AppText>
          )}
          <AppText ltr={ltr}>{item.question.explanation}</AppText>
        </Card>
      )}

      {result !== null && <Button title={isLast ? 'عرض النتيجة' : 'السؤال التالي'} icon={isLast ? 'flag-checkered' : 'arrow-left'} onPress={next} />}
    </Screen>
  );
}
