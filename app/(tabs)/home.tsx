import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeroBackground } from '@/components/HeroBackground';
import { SubjectCard } from '@/components/SubjectCard';
import { AppText, Card, Gradient, Icon, ProgressBar, Row, SectionTitle, type IconName } from '@/components/ui';
import { gradeName } from '@/config/curriculum';
import { getLesson, getSubjectsForGrade } from '@/lib/data/repository';
import { currentStreak, dayKey } from '@/lib/gamification';
import { useProgress, useSettings } from '@/lib/store';
import { radius, spacing, useAppTheme } from '@/lib/theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'صباح الخير';
  if (h < 18) return 'مساء الخير';
  return 'مساء النور';
}

function StatPill({ icon, value, label, tint }: { icon: IconName; value: string; label: string; tint: string }) {
  return (
    <View style={styles.pill}>
      <View style={[styles.pillIcon, { backgroundColor: tint }]}>
        <Icon name={icon} size={18} color="#FFFFFF" />
      </View>
      <View>
        <AppText variant="h2" color="#FFFFFF" style={{ lineHeight: 26 }}>
          {value}
        </AppText>
        <AppText variant="tiny" color="rgba(255,255,255,0.85)">
          {label}
        </AppText>
      </View>
    </View>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const { colors, gradients } = useAppTheme();
  const { grade, role } = useSettings();
  const { points, streak, studySeconds, attempts } = useProgress();
  if (!grade) return null;
  const subjects = getSubjectsForGrade(grade);
  const today = dayKey();
  const streakNow = currentStreak(streak, today);
  const minutesToday = Math.round((studySeconds[today] ?? 0) / 60);
  const lastLesson = attempts.find((a) => a.lessonId && getLesson(a.lessonId)?.subject.grade === grade);
  const last = lastLesson?.lessonId ? getLesson(lastLesson.lessonId) : undefined;
  const GOAL_MIN = 15;
  const goalDone = minutesToday >= GOAL_MIN;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
      <HeroBackground style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <AppText color="rgba(255,255,255,0.85)" weight="semibold">
              {greeting()} ☀️
            </AppText>
            <AppText variant="title" color="#FFFFFF">
              {role === 'parent' ? 'أهلاً بك!' : 'جاهز للتعلّم؟'}
            </AppText>
          </View>
          <Pressable onPress={() => router.push('/grade-picker')} accessibilityRole="button" accessibilityLabel="تغيير الصف" style={({ pressed }) => [styles.gradeChip, pressed && { opacity: 0.8 }]}>
            <Icon name="school" size={16} color="#FFFFFF" />
            <AppText variant="caption" weight="bold" color="#FFFFFF">
              {gradeName(grade)}
            </AppText>
            <Icon name="chevron-down" size={16} color="#FFFFFF" />
          </Pressable>
        </Row>

        <Row gap={spacing.sm}>
          <StatPill icon="fire" value={String(streakNow)} label="أيام متتالية" tint="#FF6A3D" />
          <StatPill icon="star-four-points" value={String(points)} label="نقطة" tint="#FFB61D" />
          <StatPill icon="timer-sand" value={`${minutesToday}`} label="دقيقة اليوم" tint="#22C1EE" />
        </Row>

        {/* هدف اليوم */}
        <View style={styles.goal}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap={6}>
              <Icon name={goalDone ? 'check-decagram' : 'flag-checkered'} size={18} color="#FFFFFF" />
              <AppText variant="label" weight="bold" color="#FFFFFF">
                {goalDone ? 'حققت هدف اليوم! 🎉' : `هدف اليوم: ${GOAL_MIN} دقيقة مذاكرة`}
              </AppText>
            </Row>
            <AppText variant="caption" weight="bold" color="#FFFFFF">
              {Math.min(minutesToday, GOAL_MIN)}/{GOAL_MIN} د
            </AppText>
          </Row>
          <ProgressBar value={minutesToday / GOAL_MIN} color="#FFD34D" trackColor="rgba(255,255,255,0.25)" height={10} />
        </View>
      </HeroBackground>

      <View style={styles.body}>
        {last && (
          <Card onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: last.lesson.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Gradient colors={last.meta.gradient} style={styles.continueIcon}>
              <Icon name="play" size={26} color="#FFFFFF" />
            </Gradient>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color="textMuted">
                تابع من حيث توقفت • {last.meta.nameAr}
              </AppText>
              <AppText variant="label" weight="bold" numberOfLines={1}>
                {last.lesson.title}
              </AppText>
            </View>
            <Icon name="chevron-left" color="textMuted" />
          </Card>
        )}

        {role === 'parent' && (
          <Card onPress={() => router.push('/parent')} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Gradient colors={gradients.sunset} style={styles.continueIcon}>
              <Icon name="account-child" size={26} color="#FFFFFF" />
            </Gradient>
            <View style={{ flex: 1 }}>
              <AppText variant="label" weight="bold">
                لوحة ولي الأمر
              </AppText>
              <AppText variant="caption" color="textMuted">
                اربط حساب ابنك لمتابعة تقدمه (قريباً)
              </AppText>
            </View>
            <Icon name="chevron-left" color="textMuted" />
          </Card>
        )}

        <SectionTitle icon="bookshelf">
          موادي
        </SectionTitle>
        <View style={styles.grid}>
          {subjects.map((s) => (
            <SubjectCard key={s.id} subject={s} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    borderBottomLeftRadius: radius.xl + 8,
    borderBottomRightRadius: radius.xl + 8,
  },
  gradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  pillIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  goal: { gap: 8, padding: spacing.md, borderRadius: radius.md, backgroundColor: 'rgba(0,0,0,0.16)' },
  body: { padding: spacing.lg, gap: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  continueIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
