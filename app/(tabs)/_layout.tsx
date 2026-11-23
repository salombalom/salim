import { Tabs } from 'expo-router/tabs';
import { Platform } from 'react-native';

import { ICONS, type IconName } from '@/components/icons';
import { useProgress } from '@/lib/store';
import { fonts, iconStroke, useAppTheme } from '@/lib/theme';

function tabIcon(name: IconName) {
  const C = ICONS[name];
  // eslint-disable-next-line react/display-name
  return ({ color, size }: { color: unknown; size: number }) => <C color={color as string} size={size - 2} strokeWidth={iconStroke} absoluteStrokeWidth />;
}

export default function TabsLayout() {
  const { colors } = useAppTheme();
  const mistakes = useProgress((s) => Object.keys(s.mistakes).length);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 4,
          ...(Platform.OS === 'web' ? { height: 66 } : null),
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 16 },
        tabBarBadgeStyle: { backgroundColor: colors.gold, color: colors.onGold, fontFamily: fonts.medium, fontSize: 10 },
        headerTitleStyle: { fontFamily: fonts.heading, fontSize: 19, color: colors.text },
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}>
      <Tabs.Screen name="home" options={{ title: 'الرئيسية', headerShown: false, tabBarIcon: tabIcon('House') }} />
      <Tabs.Screen name="mistakes" options={{ title: 'أخطائي', tabBarBadge: mistakes > 0 ? mistakes : undefined, tabBarIcon: tabIcon('Target') }} />
      <Tabs.Screen name="favorites" options={{ title: 'المحفوظات', tabBarIcon: tabIcon('Bookmark') }} />
      <Tabs.Screen name="profile" options={{ title: 'حسابي', tabBarIcon: tabIcon('UserRound') }} />
    </Tabs>
  );
}
