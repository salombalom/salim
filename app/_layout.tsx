import { BalooBhaijaan2_700Bold } from '@expo-google-fonts/baloo-bhaijaan-2/700Bold';
import { BalooBhaijaan2_800ExtraBold } from '@expo-google-fonts/baloo-bhaijaan-2/800ExtraBold';
import { IBMPlexSansArabic_400Regular } from '@expo-google-fonts/ibm-plex-sans-arabic/400Regular';
import { IBMPlexSansArabic_500Medium } from '@expo-google-fonts/ibm-plex-sans-arabic/500Medium';
import { IBMPlexSansArabic_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-arabic/600SemiBold';
import { IBMPlexSansArabic_700Bold } from '@expo-google-fonts/ibm-plex-sans-arabic/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ensureRTL } from '@/lib/rtl';
import { useProgress, useSettings } from '@/lib/store';
import { fonts, useAppTheme } from '@/lib/theme';

ensureRTL();
SplashScreen.preventAutoHideAsync().catch(() => {});

/** ننتظر تحميل الإعدادات المحفوظة قبل عرض الشاشات */
function useHydrated() {
  const [ready, setReady] = useState(useSettings.persist.hasHydrated() && useProgress.persist.hasHydrated());
  useEffect(() => {
    const check = () => setReady(useSettings.persist.hasHydrated() && useProgress.persist.hasHydrated());
    const a = useSettings.persist.onFinishHydration(check);
    const b = useProgress.persist.onFinishHydration(check);
    check();
    return () => {
      a();
      b();
    };
  }, []);
  return ready;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [fonts.regular]: IBMPlexSansArabic_400Regular,
    [fonts.medium]: IBMPlexSansArabic_500Medium,
    [fonts.semibold]: IBMPlexSansArabic_600SemiBold,
    [fonts.bold]: IBMPlexSansArabic_700Bold,
    [fonts.heading]: BalooBhaijaan2_700Bold,
    [fonts.black]: BalooBhaijaan2_800ExtraBold,
  });
  const hydrated = useHydrated();
  const { isDark, colors } = useAppTheme();
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerTitleStyle: { fontFamily: fonts.heading, fontSize: 20 },
              headerBackTitleStyle: { fontFamily: fonts.regular },
              headerTitleAlign: 'center',
              headerShadowVisible: false,
              headerStyle: { backgroundColor: colors.background },
              contentStyle: { backgroundColor: colors.background },
            }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="subject/[id]" options={{ title: '' }} />
            <Stack.Screen name="lesson/[id]" options={{ title: '' }} />
            <Stack.Screen name="quiz" options={{ title: 'الاختبار', gestureEnabled: false }} />
            <Stack.Screen name="result" options={{ title: 'النتيجة', headerBackVisible: false, gestureEnabled: false }} />
            <Stack.Screen name="review" options={{ title: 'راجع أخطائي' }} />
            <Stack.Screen name="grade-picker" options={{ title: 'تغيير الصف', presentation: 'modal' }} />
            <Stack.Screen name="parent" options={{ title: 'لوحة ولي الأمر' }} />
            <Stack.Screen name="about" options={{ title: 'عن التطبيق' }} />
            <Stack.Screen name="privacy" options={{ title: 'سياسة الخصوصية' }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
