import { router } from 'expo-router';
import { Alert, Platform, StyleSheet, Switch, View } from 'react-native';

import { HeroBackground } from '@/components/HeroBackground';
import { AppText, Card, Icon, ListRow, Row, Screen, Segmented, SectionTitle } from '@/components/ui';
import { gradeName } from '@/config/curriculum';
import { currentStreak, dayKey } from '@/lib/gamification';
import { useProgress, useSettings, type ThemeMode } from '@/lib/store';
import { radius, spacing, useAppTheme } from '@/lib/theme';

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
      <HeroBackground style={styles.hero}>
        <Row gap={spacing.md}>
          <View style={styles.avatar}>
            <Icon name={settings.role === 'parent' ? 'account-child' : 'account-school'} size={40} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="title" color="#FFFFFF">
              {settings.role === 'parent' ? 'ولي أمر' : 'طالب مجتهد'}
            </AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.9)">
              {settings.grade ? gradeName(settings.grade) : '—'} • وضع التجربة
            </AppText>
          </View>
        </Row>
        <Row gap={spacing.sm}>
          {[
            { icon: 'star-four-points' as const, value: String(progress.points), label: 'نقطة' },
            { icon: 'fire' as const, value: String(currentStreak(progress.streak, dayKey())), label: `يوم (الأفضل ${progress.streak.best})` },
            { icon: 'timer-sand' as const, value: String(Math.round(totalStudy / 60)), label: 'دقيقة دراسة' },
          ].map((s) => (
            <View key={s.icon} style={styles.stat}>
              <Icon name={s.icon} size={18} color="#FFD34D" />
              <AppText variant="h2" color="#FFFFFF" style={{ lineHeight: 26 }}>
                {s.value}
              </AppText>
              <AppText variant="tiny" color="rgba(255,255,255,0.85)" numberOfLines={1}>
                {s.label}
              </AppText>
            </View>
          ))}
        </Row>
      </HeroBackground>

      <SectionTitle icon="school">الدراسة</SectionTitle>
      <Card style={{ paddingVertical: 0 }}>
        <ListRow icon="school-outline" title="تغيير الصف" subtitle={settings.grade ? gradeName(settings.grade) : undefined} onPress={() => router.push('/grade-picker')} />
        <ListRow icon="account-switch-outline" iconColor="#FF8A4C" last title="تغيير الدور" subtitle={settings.role === 'parent' ? 'ولي أمر' : 'طالب'} onPress={() => router.push('/role')} />
      </Card>

      <SectionTitle icon="palette">المظهر</SectionTitle>
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

      <SectionTitle icon="volume-high">الصوت والاهتزاز</SectionTitle>
      <Card style={{ paddingVertical: 0 }}>
        <ToggleRow title="الأصوات" value={settings.soundOn} onChange={(soundOn) => settings.set({ soundOn })} />
        <ToggleRow title="الاهتزاز الخفيف" value={settings.hapticsOn} onChange={(hapticsOn) => settings.set({ hapticsOn })} />
      </Card>

      <SectionTitle icon="code-tags">للمطوّر</SectionTitle>
      <Card style={{ paddingVertical: 0 }}>
        <ToggleRow
          title="عرض الأسئلة غير المراجَعة"
          subtitle="للتجربة أثناء التطوير فقط. أطفئه قبل النشر."
          value={settings.showUnreviewed}
          onChange={(showUnreviewed) => settings.set({ showUnreviewed })}
        />
      </Card>

      <SectionTitle icon="information">عن التطبيق</SectionTitle>
      <Card style={{ paddingVertical: 0 }}>
        <ListRow icon="information-outline" title="عن التطبيق" onPress={() => router.push('/about')} />
        <ListRow icon="shield-lock-outline" iconColor="#16B364" title="سياسة الخصوصية" onPress={() => router.push('/privacy')} />
        <ListRow icon="logout" iconColor="#F0405F" title="تسجيل الخروج" onPress={signOut} last />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.lg },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  stat: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md, paddingVertical: spacing.sm },
});
