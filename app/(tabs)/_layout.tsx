import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/tabs';
import { Platform, View } from 'react-native';

import type { IconName } from '@/components/ui';
import { useProgress } from '@/lib/store';
import { alpha, fonts, useAppTheme } from '@/lib/theme';

function TabIcon({ name, focused, color }: { name: IconName; focused: boolean; color: string }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        width: 52,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? alpha(colors.primary, 0.14) : 'transparent',
      }}>
      <MaterialCommunityIcons name={name} size={24} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useAppTheme();
  const mistakes = useProgress((s) => Object.keys(s.mistakes).length);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 6,
          ...(Platform.OS === 'web' ? { height: 70 } : null),
        },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 16 },
        tabBarBadgeStyle: { backgroundColor: colors.accent, fontFamily: fonts.bold, fontSize: 11 },
        headerTitleStyle: { fontFamily: fonts.heading, fontSize: 20 },
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'الرئيسية',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'home-variant' : 'home-variant-outline'} focused={focused} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="mistakes"
        options={{
          title: 'أخطائي',
          tabBarBadge: mistakes > 0 ? mistakes : undefined,
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'target' : 'target'} focused={focused} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'المفضلة',
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'heart' : 'heart-outline'} focused={focused} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'account-circle' : 'account-circle-outline'} focused={focused} color={color as string} />,
        }}
      />
    </Tabs>
  );
}
