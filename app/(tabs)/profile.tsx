import { router } from 'expo-router';
import { Alert, Platform, Switch, View } from 'react-native';

import { AppText, Card, Chip, ListRow, Row, Screen, Segmented, SectionTitle } from '@/components/ui';
import { gradeName } from '@/config/curriculum';
import { currentStreak, dayKey } from '@/lib/gamification';
import { formatDuration } from '@/lib/progress';
import { useProgress, useSettings, type ThemeMode } from '@/lib/store';
import { spacing, useAppTheme } from '@/lib/theme';

function ToggleRow({ title, subtitle, value, onChange }: { title: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useAppTheme();
  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      right={<Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} accessibilityLabel={title} />}
    />
  );
}

export default function ProfileScreen() {
  const settings = useSettings();
  const progress = useProgress();
  const totalStudy = Object.values(progress.studySeconds).reduce((a, b) => a + b, 0);

  const signOut = () => {
    const doIt = () => {
      useProgress.getState().reset();
      useSettings.getState().reset();
      router.replace('/welcome');
    };
    const msg = 'أنت في وضع التجربة؛ سيُحذف تقدمك المحفوظ على هذا الجهاز.';
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) doIt();
      return;
    }
    Alert.alert('تسجيل الخروج', msg, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تسجيل الخروج', style: 'destructive', onPress: doIt },
    ]);
  };

  return (
    <Screen>
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <AppText variant="h2">{settings.role === 'parent' ? 'ولي أمر' : 'طالب'}</AppText>
            <AppText color="textMuted">{settings.grade ? gradeName(settings.grade) : '—'}</AppText>
          </View>
          <Chip label="وضع التجربة" icon="account-question-outline" />
        </Row>
        <View style={{ marginTop: spacing.sm, gap: 2 }}>
          <AppText variant="caption" color="textMuted">
            النقاط: {progress.points}
          </AppText>
          <AppText variant="caption" color="textMuted">
            السلسلة اليومية: {currentStreak(progress.streak, dayKey())} يوم (أفضل سلسلة: {progress.streak.best})
          </AppText>
          <AppText variant="caption" color="textMuted">
            إجمالي وقت الدراسة: {formatDuration(totalStudy)}
          </AppText>
        </View>
      </Card>

      <SectionTitle>الدراسة</SectionTitle>
      <Card style={{ paddingVertical: 0 }}>
        <ListRow icon="school-outline" title="تغيير الصف" subtitle={settings.grade ? gradeName(settings.grade) : undefined} onPress={() => router.push('/grade-picker')} />
        <ListRow icon="account-switch-outline" title="تغيير الدور" subtitle={settings.role === 'parent' ? 'ولي أمر' : 'طالب'} onPress={() => router.push('/role')} />
      </Card>

      <SectionTitle>المظهر</SectionTitle>
      <Card>
        <AppText variant="label">الوضع</AppText>
        <Segmented<ThemeMode>
          value={settings.themeMode}
          onChange={(themeMode) => settings.set({ themeMode })}
          options={[
            { value: 'system', label: 'تلقائي', icon: 'theme-light-dark' },
            { value: 'light', label: 'فاتح', icon: 'white-balance-sunny' },
            { value: 'dark', label: 'ليلي', icon: 'weather-night' },
          ]}
        />
        <AppText variant="label" style={{ marginTop: spacing.sm }}>
          حجم الخط
        </AppText>
        <Segmented
          value={settings.fontScale}
          onChange={(fontScale) => settings.set({ fontScale })}
          options={[
            { value: 'sm', label: 'صغير' },
            { value: 'md', label: 'متوسط' },
            { value: 'lg', label: 'كبير' },
            { value: 'xl', label: 'كبير جداً' },
          ]}
        />
      </Card>

      <SectionTitle>الصوت والاهتزاز</SectionTitle>
      <Card style={{ paddingVertical: 0 }}>
        <ToggleRow title="الأصوات" value={settings.soundOn} onChange={(soundOn) => settings.set({ soundOn })} />
        <ToggleRow title="الاهتزاز الخفيف" value={settings.hapticsOn} onChange={(hapticsOn) => settings.set({ hapticsOn })} />
      </Card>

      <SectionTitle>للمطوّر</SectionTitle>
      <Card style={{ paddingVertical: 0 }}>
        <ToggleRow
          title="عرض الأسئلة غير المراجَعة"
          subtitle="للتجربة أثناء التطوير فقط. أطفئه قبل النشر."
          value={settings.showUnreviewed}
          onChange={(showUnreviewed) => settings.set({ showUnreviewed })}
        />
      </Card>

      <SectionTitle>عن التطبيق</SectionTitle>
      <Card style={{ paddingVertical: 0 }}>
        <ListRow icon="information-outline" title="عن التطبيق" onPress={() => router.push('/about')} />
        <ListRow icon="shield-lock-outline" title="سياسة الخصوصية" onPress={() => router.push('/privacy')} />
        <ListRow icon="logout" title="تسجيل الخروج" onPress={signOut} />
      </Card>
    </Screen>
  );
}
