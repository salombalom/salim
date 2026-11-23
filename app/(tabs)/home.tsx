import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SubjectCard } from '@/components/SubjectCard';
import { AppText, Card, Icon, Row, Screen, SectionTitle, type IconName } from '@/components/ui';
import { gradeName } from '@/config/curriculum';
import { getSubjectsForGrade } from '@/lib/data/repository';
import { currentStreak, dayKey } from '@/lib/gamification';
import { formatDuration } from '@/lib/progress';
import { useProgress, useSettings } from '@/lib/store';
import { spacing, useAppTheme } from '@/lib/theme';

function Stat({ icon, value, label, color }: { icon: IconName; value: string; label: string; color: string }) {
  return (
    <Card style={styles.stat}>
      <Icon name={icon} color={color} size={26} />
      <AppText variant="title">{value}</AppText>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
    </Card>
  );
}

export default function Home() {
  const { colors } = useAppTheme();
  const { grade, role } = useSettings();
  const { points, streak, studySeconds } = useProgress();
  if (!grade) return null;
  const subjects = getSubjectsForGrade(grade);
  const today = dayKey();
  const streakNow = currentStreak(streak, today);

  return (
    <Screen edges={['top']}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <AppText variant="title">أهلاً بك 👋</AppText>
          <AppText color="textMuted">{gradeName(grade)}</AppText>
        </View>
        <Card onPress={() => router.push('/grade-picker')} style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md }} accessibilityLabel="تغيير الصف">
          <Row gap={4}>
            <Icon name="swap-horizontal" size={18} color="primary" />
            <AppText variant="caption" color="primary" weight="semibold">
              تغيير الصف
            </AppText>
          </Row>
        </Card>
      </Row>

      <Row gap={spacing.sm}>
        <Stat icon="fire" value={String(streakNow)} label="أيام متتالية" color={colors.accent} />
        <Stat icon="star-four-points" value={String(points)} label="نقطة" color={colors.star} />
        <Stat icon="timer-outline" value={formatDuration(studySeconds[today] ?? 0).replace('أقل من دقيقة', '0 د')} label="اليوم" color={colors.primary} />
      </Row>

      {role === 'parent' && (
        <Card onPress={() => router.push('/parent')} style={{ backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }}>
          <Row>
            <Icon name="account-child-outline" color="primary" />
            <AppText variant="label" weight="semibold" color="primary" style={{ flex: 1 }}>
              لوحة ولي الأمر
            </AppText>
            <Icon name="chevron-left" color="primary" />
          </Row>
          <AppText variant="caption" color="primary">
            اربط حساب ابنك لمتابعة تقدمه (قريباً).
          </AppText>
        </Card>
      )}

      <SectionTitle>المواد الدراسية</SectionTitle>
      <View style={styles.grid}>
        {subjects.map((s) => (
          <SubjectCard key={s.id} subject={s} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stat: { flex: 1, alignItems: 'center', gap: 2, padding: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
