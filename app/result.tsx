import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { StatRow } from '@/components/StatRow';
import { AppText, Button, Card, Divider, EmptyState, Mastery, Screen } from '@/components/ui';
import { getLesson } from '@/lib/data/repository';
import { useSession } from '@/lib/store';
import { fonts, motion, spacing, useAppTheme } from '@/lib/theme';

const MESSAGES = [
  'كل محاولة خطوة نحو الإتقان. راجع الشرح وأعد المحاولة بهدوء.',
  'بداية طيبة، والمراجعة تصنع الفرق.',
  'أداء متميز، أحسنت.',
  'إتقان رفيع، أحسنت صنعاً.',
];

export default function ResultScreen() {
  const last = useSession((s) => s.lastResult);
  const { colors, fontScale } = useAppTheme();
  const [v] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: motion.slow, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v]);

  if (!last) return <EmptyState icon="ClipboardCheck" title="لا توجد نتيجة" />;
  const { attempt, answers } = last;
  const { score } = attempt;
  const wrong = answers.filter((a) => !a.correct).length;
  const lesson = attempt.lessonId ? getLesson(attempt.lessonId) : undefined;

  const backToLesson = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: spacing.xl, paddingTop: spacing.lg }}>
        {lesson && (
          <AppText variant="overline" color="goldText" center>
            {lesson.meta.nameAr} · {lesson.lesson.title}
          </AppText>
        )}
        <Animated.View style={[styles.ring, { borderColor: colors.gold, opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>
          <View style={[styles.innerRing, { borderColor: colors.goldLine }]}>
            <AppText color="goldText" style={{ fontFamily: fonts.display, fontSize: 52 * fontScale, lineHeight: 76 * fontScale }}>
              {score.percent}%
            </AppText>
            <AppText variant="caption" color="textMuted">
              {score.correct} من {score.total}
            </AppText>
          </View>
        </Animated.View>
        <Mastery count={score.stars} size={10} />
        <AppText variant="h2" center style={{ maxWidth: 300 }}>
          {MESSAGES[score.stars]}
        </AppText>
      </View>

      <Divider ornament />

      <Card>
        <StatRow
          items={[
            { value: `${score.correct}`, label: 'إجابات صحيحة' },
            { value: `${score.points}`, label: 'نقطة مكتسبة' },
            { value: `${Math.max(1, Math.round(attempt.durationSec / 60))}`, label: 'دقيقة' },
          ]}
        />
      </Card>

      <View style={{ gap: spacing.md }}>
        {wrong > 0 && <Button title={`راجع أخطائي (${wrong})`} onPress={() => router.push('/review')} />}
        {attempt.lessonId && <Button title="إعادة الاختبار" kind="secondary" onPress={() => router.replace({ pathname: '/quiz', params: { lessonId: attempt.lessonId! } })} />}
        <Button title={attempt.lessonId ? 'العودة إلى الدرس' : 'العودة'} kind="ghost" onPress={backToLesson} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  ring: { width: 196, height: 196, borderRadius: 98, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  innerRing: { width: 176, height: 176, borderRadius: 88, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
