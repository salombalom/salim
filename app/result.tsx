import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { HeroBackground } from '@/components/HeroBackground';
import { AppText, Button, Card, EmptyState, Icon, Row, Screen, type IconName } from '@/components/ui';
import { getLesson } from '@/lib/data/repository';
import { useSession } from '@/lib/store';
import { alpha, radius, spacing, useAppTheme } from '@/lib/theme';

const MESSAGES = ['حاول مرة أخرى، أنت قادر! 💪', 'بداية جيدة، استمر! 👍', 'أحسنت! عمل رائع 👏', 'ممتاز! أداء مثالي 🌟'];
const TROPHY: IconName[] = ['emoticon-cool-outline', 'medal-outline', 'medal', 'trophy'];

export default function ResultScreen() {
  const last = useSession((s) => s.lastResult);
  const { colors, gradients } = useAppTheme();
  const [scales] = useState(() => [0, 1, 2].map(() => new Animated.Value(0)));
  const [pop] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    if (!last) return;
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
    Animated.stagger(
      200,
      scales.map((v, i) => Animated.spring(v, { toValue: i < last.attempt.score.stars ? 1 : 0.7, useNativeDriver: true, friction: 4 })),
    ).start();
  }, [last, scales, pop]);

  if (!last) return <EmptyState icon="clipboard-off-outline" title="لا توجد نتيجة" />;
  const { attempt, answers } = last;
  const { score } = attempt;
  const wrong = answers.filter((a) => !a.correct).length;
  const lesson = attempt.lessonId ? getLesson(attempt.lessonId) : undefined;
  const heroColors = score.stars >= 2 ? gradients.hero : score.stars === 1 ? gradients.sunset : (['#38BDF8', '#6366F1'] as const);

  const backToLesson = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  const tile = (icon: IconName, value: string, label: string, color: string) => (
    <Card style={{ flex: 1, alignItems: 'center', gap: 2, padding: spacing.md }}>
      <View style={[styles.tileIcon, { backgroundColor: alpha(color, 0.15) }]}>
        <Icon name={icon} color={color} size={22} />
      </View>
      <AppText variant="h2">{value}</AppText>
      <AppText variant="tiny" color="textMuted">
        {label}
      </AppText>
    </Card>
  );

  return (
    <Screen>
      <HeroBackground colors={heroColors} style={styles.hero}>
        <Animated.View style={[styles.trophy, { transform: [{ scale: pop }] }]}>
          <MaterialCommunityIcons name={TROPHY[score.stars]} size={58} color="#FFC93C" />
        </Animated.View>
        <Row gap={spacing.sm} style={{ alignItems: 'flex-end' }}>
          {scales.map((v, i) => (
            <Animated.View key={i} style={{ transform: [{ scale: v }, { translateY: i === 1 ? -10 : 0 }] }}>
              <MaterialCommunityIcons name="star" size={i === 1 ? 64 : 48} color={i < score.stars ? '#FFC93C' : 'rgba(255,255,255,0.3)'} />
            </Animated.View>
          ))}
        </Row>
        <AppText variant="display" color="#FFFFFF" style={{ fontSize: 52, lineHeight: 70 }}>
          {score.percent}%
        </AppText>
        <AppText variant="h2" color="#FFFFFF" center>
          {MESSAGES[score.stars]}
        </AppText>
        {lesson && (
          <AppText variant="caption" color="rgba(255,255,255,0.85)" center>
            {lesson.meta.nameAr} • {lesson.lesson.title}
          </AppText>
        )}
      </HeroBackground>

      <Row gap={spacing.sm}>
        {tile('check-circle', `${score.correct}/${score.total}`, 'إجابات صحيحة', colors.success)}
        {tile('star-four-points', `+${score.points}`, 'نقطة', colors.star)}
        {tile('timer-sand', `${Math.max(1, Math.round(attempt.durationSec / 60))}`, 'دقيقة', colors.sky)}
      </Row>

      <View style={{ gap: spacing.sm }}>
        {wrong > 0 && <Button title={`راجع أخطائي (${wrong})`} icon="target" onPress={() => router.push('/review')} />}
        {attempt.lessonId && (
          <Button title="أعد الاختبار" kind="secondary" icon="refresh" onPress={() => router.replace({ pathname: '/quiz', params: { lessonId: attempt.lessonId! } })} />
        )}
        <Button title={attempt.lessonId ? 'العودة إلى الدرس' : 'العودة'} kind="ghost" onPress={backToLesson} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.xl, alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.xs },
  trophy: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  tileIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
