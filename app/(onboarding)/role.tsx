import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText, Card, Gradient, Icon, Screen, type IconName } from '@/components/ui';
import { useSettings, type Role } from '@/lib/store';
import { spacing, useAppTheme } from '@/lib/theme';

const ROLES: { role: Role; title: string; text: string; icon: IconName; colors: [string, string] }[] = [
  { role: 'student', title: 'أنا طالب', text: 'أذاكر دروسي وأحل الاختبارات وأجمع النقاط', icon: 'account-school', colors: ['#8B5CF6', '#5B3FE0'] },
  { role: 'parent', title: 'أنا ولي أمر', text: 'أتابع تقدم أبنائي ونقاط ضعفهم', icon: 'account-child', colors: ['#FF8A4C', '#FF4F7B'] },
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
      <View style={{ gap: 4 }}>
        <AppText variant="title">من أنت؟ 🤔</AppText>
        <AppText color="textMuted">اختر ما يناسبك لنجهّز لك التجربة.</AppText>
      </View>
      <View style={{ gap: spacing.md }}>
        {ROLES.map((r) => (
          <Card
            key={r.role}
            onPress={() => choose(r.role)}
            accessibilityLabel={r.title}
            style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg }, current === r.role && { borderColor: colors.primary, borderWidth: 2 }]}>
            <Gradient colors={r.colors} style={{ width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={r.icon} size={40} color="#FFFFFF" />
            </Gradient>
            <View style={{ flex: 1 }}>
              <AppText variant="h2">{r.title}</AppText>
              <AppText variant="caption" color="textMuted">
                {r.text}
              </AppText>
            </View>
            <Icon name="chevron-left" color="textMuted" />
          </Card>
        ))}
      </View>
    </Screen>
  );
}
