import { router } from 'expo-router';
import { Alert, Platform, Switch, TextInput, View } from 'react-native';

import { StatRow } from '@/components/StatRow';
import { AppText, Card, IconCircle, ListRow, Row, Screen, Segmented, SectionTitle } from '@/components/ui';
import { gradeName } from '@/config/curriculum';
import { currentStreak, dayKey } from '@/lib/gamification';
import { useProgress, useSettings, type ThemeMode } from '@/lib/store';
import { borderWidth, fonts, radius, spacing, useAppTheme } from '@/lib/theme';

function ToggleRow({ title, subtitle, value, onChange, last }: { title: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <ListRow
      title={title}
      subtitle={subtitle}
      last={last}
      right={
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ true: colors.gold, false: colors.borderStrong }}
          thumbColor={colors.text}
          accessibilityLabel={title}
        />
      }
    />
  );
}

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const settings = useSettings();
  const progress = useProgress();
  const totalStudy = Object.values(progress.studySeconds).reduce((a, b) => a + b, 0);

  const signOut = () => {
    const doIt = () => {
      useProgress.getState().reset();
      useSettings.getState().reset();
      router.replace('/welcome');
    };
    const msg = 'أنت في وضع التجربة؛ سيُحذف تقدّمك المحفوظ على هذا الجهاز.';
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
      <Card style={{ gap: spacing.xl }}>
        <Row gap={spacing.lg}>
          <IconCircle name={settings.role === 'parent' ? 'Users' : 'UserRound'} size={56} />
          <View style={{ flex: 1 }}>
            <AppText variant="title">{settings.displayName.trim() || (settings.role === 'parent' ? 'ولي أمر' : 'طالب')}</AppText>
            <AppText variant="caption" color="textMuted">
              {settings.grade ? gradeName(settings.grade) : '—'} · وضع التجربة
            </AppText>
          </View>
        </Row>
        <StatRow
          items={[
            { value: String(progress.points), label: 'النقاط' },
            { value: String(currentStreak(progress.streak, dayKey())), label: `أيام (الأفضل ${progress.streak.best})` },
            { value: String(Math.round(totalStudy / 60)), label: 'دقيقة دراسة' },
          ]}
        />
      </Card>

      <SectionTitle>الحساب</SectionTitle>
      <Card style={{ paddingVertical: spacing.sm }}>
        <View style={{ gap: spacing.xs, paddingVertical: spacing.sm }}>
          <AppText variant="caption" color="textMuted">
            الاسم المعروض (اختياري)
          </AppText>
          <TextInput
            value={settings.displayName}
            onChangeText={(t) => settings.set({ displayName: t.slice(0, 20) })}
            placeholder="اسمك الأول أو اسم مستعار"
            placeholderTextColor={colors.textMuted}
            style={{
              borderWidth: borderWidth.hairline,
              borderColor: colors.border,
              borderRadius: radius.button,
              paddingHorizontal: spacing.lg,
              paddingVertical: 12,
              color: colors.text,
              fontFamily: fonts.regular,
              fontSize: 16,
              textAlign: 'right',
            }}
          />
        </View>
        <ListRow icon="GraduationCap" title="الصف الدراسي" subtitle={settings.grade ? gradeName(settings.grade) : undefined} onPress={() => router.push('/grade-picker')} />
        <ListRow icon="UserCog" title="الصفة" subtitle={settings.role === 'parent' ? 'ولي أمر' : 'طالب'} onPress={() => router.push('/role')} last />
      </Card>

      <SectionTitle>المظهر</SectionTitle>
      <Card style={{ gap: spacing.lg }}>
        <AppText variant="caption" color="textMuted">
          الوضع
        </AppText>
        <Segmented<ThemeMode>
          value={settings.themeMode}
          onChange={(themeMode) => settings.set({ themeMode })}
          options={[
            { value: 'dark', label: 'ليلي', icon: 'Moon' },
            { value: 'light', label: 'نهاري', icon: 'Sun' },
            { value: 'system', label: 'تلقائي', icon: 'SunMoon' },
          ]}
        />
        <AppText variant="caption" color="textMuted">
          حجم الخط
        </AppText>
        <Segmented
          value={settings.fontScale}
          onChange={(fontScale) => settings.set({ fontScale })}
          options={[
            { value: 'sm', label: 'صغير' },
            { value: 'md', label: 'متوسط' },
            { value: 'lg', label: 'كبير' },
            { value: 'xl', label: 'أكبر' },
          ]}
        />
      </Card>

      <SectionTitle>الصوت والاهتزاز</SectionTitle>
      <Card style={{ paddingVertical: spacing.xs }}>
        <ToggleRow title="الأصوات" value={settings.soundOn} onChange={(soundOn) => settings.set({ soundOn })} />
        <ToggleRow title="الاهتزاز الخفيف" value={settings.hapticsOn} onChange={(hapticsOn) => settings.set({ hapticsOn })} last />
      </Card>

      <SectionTitle>للمطوّر</SectionTitle>
      <Card style={{ paddingVertical: spacing.xs }}>
        <ToggleRow
          title="عرض الأسئلة غير المراجَعة"
          subtitle="للتجربة أثناء التطوير فقط، أطفئه قبل النشر."
          value={settings.showUnreviewed}
          onChange={(showUnreviewed) => settings.set({ showUnreviewed })}
          last
        />
      </Card>

      <Card style={{ paddingVertical: spacing.xs }}>
        <ListRow icon="Info" title="عن التطبيق" onPress={() => router.push('/about')} />
        <ListRow icon="ShieldCheck" title="سياسة الخصوصية" onPress={() => router.push('/privacy')} />
        <ListRow icon="LogOut" title="تسجيل الخروج" onPress={signOut} last />
      </Card>
    </Screen>
  );
}
