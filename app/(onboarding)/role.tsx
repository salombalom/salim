import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText, Card, Icon, IconCircle, Screen, type IconName } from '@/components/ui';
import { useSettings, type Role } from '@/lib/store';
import { syncProfile } from '@/lib/sync';
import { spacing, useAppTheme } from '@/lib/theme';

const ROLES: { role: Role; title: string; text: string; icon: IconName }[] = [
  { role: 'student', title: 'طالب', text: 'أذاكر دروسي وأختبر فهمي', icon: 'GraduationCap' },
  { role: 'parent', title: 'ولي أمر', text: 'أتابع تقدّم أبنائي', icon: 'Users' },
];

export default function RoleScreen() {
  const { colors } = useAppTheme();
  const { role: current, set } = useSettings();

  const choose = (role: Role) => {
    set({ role, onboarded: true });
    syncProfile().catch(() => {});
    router.push('/grade');
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="display">مرحباً بك</AppText>
        <AppText color="textMuted">اختر صفتك لنهيّئ التجربة لك.</AppText>
      </View>
      <View style={{ gap: spacing.md }}>
        {ROLES.map((r) => (
          <Card
            key={r.role}
            onPress={() => choose(r.role)}
            accessibilityLabel={r.title}
            style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }, current === r.role && { borderColor: colors.gold }]}>
            <IconCircle name={r.icon} size={52} />
            <View style={{ flex: 1 }}>
              <AppText variant="h2">{r.title}</AppText>
              <AppText variant="caption" color="textMuted">
                {r.text}
              </AppText>
            </View>
            <Icon name="ChevronLeft" color="textMuted" />
          </Card>
        ))}
      </View>
    </Screen>
  );
}
