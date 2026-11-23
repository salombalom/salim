import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GeometricPattern } from '@/components/GeometricPattern';
import { StatRow } from '@/components/StatRow';
import { SubjectCard } from '@/components/SubjectCard';
import { AppText, Card, FadeIn, Icon, IconCircle, ProgressBar, Row, SectionTitle } from '@/components/ui';
import { gradeName } from '@/config/curriculum';
import { getLesson, getSubjectsForGrade } from '@/lib/data/repository';
import { currentStreak, dayKey } from '@/lib/gamification';
import { useProgress, useSettings } from '@/lib/store';
import { spacing, useAppTheme } from '@/lib/theme';

const GOAL_MIN = 15;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'صباح الخير';
  return 'مساء الخير';
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { grade, role, displayName } = useSettings();
  const { points, streak, studySeconds, attempts } = useProgress();
  if (!grade) return null;
  const subjects = getSubjectsForGrade(grade);
  const today = dayKey();
  const minutesToday = Math.round((studySeconds[today] ?? 0) / 60);
  const lastAttempt = attempts.find((a) => a.lessonId && getLesson(a.lessonId)?.subject.grade === grade);
  const last = lastAttempt?.lessonId ? getLesson(lastAttempt.lessonId) : undefined;
  const name = displayName.trim();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
      {/* أعلى الشاشة مع النقشة الهندسية الخفيفة */}
      <View style={[styles.top, { paddingTop: insets.top + spacing.xl, borderColor: colors.border }]}>
        <GeometricPattern />
        <FadeIn style={{ gap: spacing.xs }}>
          <AppText variant="overline" color="goldText">
            {greeting()}
          </AppText>
          <AppText variant="display">{name ? name : role === 'parent' ? 'أهلاً بك' : 'أهلاً بك'}</AppText>
          <Pressable onPress={() => router.push('/grade-picker')} accessibilityRole="button" accessibilityLabel="تغيير الصف" hitSlop={8}>
            <Row gap={4}>
              <AppText variant="label" color="textMuted">
                {gradeName(grade)}
              </AppText>
              <Icon name="ChevronDown" size={16} color="textMuted" />
            </Row>
          </Pressable>
        </FadeIn>
      </View>

      <FadeIn delay={80} style={styles.body}>
        {/* بطاقة التقدّم */}
        <Card style={{ gap: spacing.xl }}>
          <StatRow
            items={[
              { value: String(points), label: 'النقاط' },
              { value: String(currentStreak(streak, today)), label: 'أيام متتالية' },
              { value: String(minutesToday), label: 'دقيقة اليوم' },
            ]}
          />
          <View style={{ gap: spacing.sm }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <AppText variant="caption" color="textMuted">
                هدف اليوم: {GOAL_MIN} دقيقة من المذاكرة
              </AppText>
              <AppText variant="caption" color="goldText">
                {Math.min(minutesToday, GOAL_MIN)} / {GOAL_MIN}
              </AppText>
            </Row>
            <ProgressBar value={minutesToday / GOAL_MIN} />
          </View>
        </Card>

        {last && (
          <Card onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: last.lesson.id } })} accent={last.meta.color} style={styles.rowCard}>
            <IconCircle name="Play" size={44} />
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color="textMuted">
                تابع من حيث توقفت · {last.meta.nameAr}
              </AppText>
              <AppText variant="label" numberOfLines={1}>
                {last.lesson.title}
              </AppText>
            </View>
            <Icon name="ChevronLeft" color="textMuted" />
          </Card>
        )}

        {role === 'parent' && (
          <Card onPress={() => router.push('/parent')} style={styles.rowCard}>
            <IconCircle name="Users" size={44} />
            <View style={{ flex: 1 }}>
              <AppText variant="label">لوحة ولي الأمر</AppText>
              <AppText variant="caption" color="textMuted">
                اربط حساب ابنك لمتابعة تقدّمه (قريباً)
              </AppText>
            </View>
            <Icon name="ChevronLeft" color="textMuted" />
          </Card>
        )}

        <SectionTitle>المواد</SectionTitle>
        <View style={styles.grid}>
          {subjects.map((s) => (
            <SubjectCard key={s.id} subject={s} />
          ))}
        </View>
      </FadeIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, overflow: 'hidden', borderBottomWidth: StyleSheet.hairlineWidth },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
});
