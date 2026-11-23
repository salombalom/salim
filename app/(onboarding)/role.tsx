import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText, Card, Icon, Screen, type IconName } from '@/components/ui';
import { useSettings, type Role } from '@/lib/store';
import { spacing, useAppTheme } from '@/lib/theme';

const ROLES: { role: Role; title: string; text: string; icon: IconName }[] = [
  { role: 'student', title: 'أنا طالب', text: 'أذاكر دروسي وأحل الاختبارات', icon: 'account-school-outline' },
  { role: 'parent', title: 'أنا ولي أمر', text: 'أتابع تقدم أبنائي', icon: 'account-child-outline' },
];

export default function RoleScreen() {
  const { colors } = useAppTheme();
  const { role: current, set } = useSettings();

  const choose = (role: Role) => {
    set({ role, onboarded: true });
    router.push('/grade');
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <AppText variant="title">من أنت؟</AppText>
      <View style={{ gap: spacing.md }}>
        {ROLES.map((r) => (
          <Card
            key={r.role}
            onPress={() => choose(r.role)}
            accessibilityLabel={r.title}
            style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }, current === r.role && { borderColor: colors.primary, borderWidth: 2 }]}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={r.icon} size={30} color="primary" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h2">{r.title}</AppText>
              <AppText color="textMuted">{r.text}</AppText>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
