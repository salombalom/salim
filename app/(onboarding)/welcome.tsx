import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GeometricPattern } from '@/components/GeometricPattern';
import { Logo } from '@/components/Logo';
import { AppText, Button, FadeIn } from '@/components/ui';
import { spacing, useAppTheme } from '@/lib/theme';

export default function Welcome() {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GeometricPattern />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <FadeIn style={styles.center}>
          <Logo size={72} tagline="رفيقك الهادئ في رحلة التعلّم" />
        </FadeIn>
        <FadeIn delay={200} style={{ gap: spacing.lg }}>
          <Button title="ابدأ" onPress={() => router.push('/login')} />
          <AppText variant="caption" color="textMuted" center>
            من الصف الأول إلى الثاني عشر · مجاني بالكامل · بلا إعلانات
          </AppText>
        </FadeIn>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
