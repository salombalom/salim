import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { AppText, Button, Card, EmptyState, Icon, Row, Screen } from '@/components/ui';
import { getLesson } from '@/lib/data/repository';
import { useSession } from '@/lib/store';
import { spacing, useAppTheme } from '@/lib/theme';

const MESSAGES = ['حاول مرة أخرى، أنت قادر! 💪', 'بداية جيدة، استمر! 👍', 'أحسنت! عمل رائع 👏', 'ممتاز! أداء مثالي 🌟'];

export default function ResultScreen() {
  const last = useSession((s) => s.lastResult);
  const { colors } = useAppTheme();
  const [scales] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));

  useEffect(() => {
    if (!last) return;
    Animated.stagger(
      180,
      scales.map((v, i) =>
        Animated.spring(v, { toValue: i < last.attempt.score.stars ? 1 : 0.6, useNativeDriver: true, friction: 5 }),
      ),
    ).start();
  }, [last, scales]);

  if (!last) return <EmptyState icon="clipboard-off-outline" title="لا توجد نتيجة" />;
  const { attempt, answers } = last;
  const { score } = attempt;
  const wrong = answers.filter((a) => !a.correct).length;
  const lesson = attempt.lessonId ? getLesson(attempt.lessonId) : undefined;

  const backToLesson = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  return (
    <Screen contentStyle={{ alignItems: 'stretch' }}>
      <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
        <Row gap={spacing.md}>
          {scales.map((v, i) => (
            <Animated.View key={i} style={{ transform: [{ scale: v }] }}>
              <Icon name={i < score.stars ? 'star' : 'star-outline'} size={i === 1 ? 64 : 48} color={i < score.stars ? colors.star : colors.textMuted} />
            </Animated.View>
          ))}
        </Row>
        <AppText variant="display">{score.percent}%</AppText>
        <AppText variant="h2" center>
          {MESSAGES[score.stars]}
        </AppText>
        <AppText color="textMuted" center>
          أجبت عن {score.correct} من {score.total} إجابة صحيحة
        </AppText>
        {lesson && (
          <AppText variant="caption" color="textMuted" center>
            {lesson.meta.nameAr} • {lesson.lesson.title}
          </AppText>
        )}
      </Card>

      <Row gap={spacing.sm}>
        <Card style={{ flex: 1, alignItems: 'center' }}>
          <Icon name="star-four-points" color={colors.star} />
          <AppText variant="h2">+{score.points}</AppText>
          <AppText variant="caption" color="textMuted">
            نقطة
          </AppText>
        </Card>
        <Card style={{ flex: 1, alignItems: 'center' }}>
          <Icon name="timer-outline" color="primary" />
          <AppText variant="h2">{Math.max(1, Math.round(attempt.durationSec / 60))}</AppText>
          <AppText variant="caption" color="textMuted">
            دقيقة
          </AppText>
        </Card>
      </Row>

      <View style={{ gap: spacing.sm }}>
        {wrong > 0 && <Button title={`راجع أخطائي (${wrong})`} icon="alert-circle-outline" onPress={() => router.push('/review')} />}
        {attempt.lessonId && (
          <Button
            title="أعد الاختبار"
            kind="secondary"
            icon="refresh"
            onPress={() => router.replace({ pathname: '/quiz', params: { lessonId: attempt.lessonId! } })}
          />
        )}
        <Button title={attempt.lessonId ? 'العودة إلى الدرس' : 'العودة'} kind="ghost" onPress={backToLesson} />
      </View>
    </Screen>
  );
}
