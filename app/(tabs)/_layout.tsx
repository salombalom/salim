import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/tabs';
import { Platform } from 'react-native';

import { useProgress } from '@/lib/store';
import { fonts, useAppTheme } from '@/lib/theme';

export default function TabsLayout() {
  const { colors } = useAppTheme();
  const mistakes = useProgress((s) => Object.keys(s.mistakes).length);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, ...(Platform.OS === 'web' ? { height: 62 } : null) },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
        headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
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
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-variant" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mistakes"
        options={{
          title: 'أخطائي',
          tabBarBadge: mistakes > 0 ? mistakes : undefined,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="alert-circle-outline" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'المفضلة',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="heart-outline" color={color as string} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle-outline" color={color as string} size={size} />,
        }}
      />
    </Tabs>
  );
}
