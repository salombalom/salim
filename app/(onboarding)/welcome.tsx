import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeroBackground } from '@/components/HeroBackground';
import { Logo } from '@/components/Logo';
import { AppText, Button, Icon, Row } from '@/components/ui';
import { radius, spacing } from '@/lib/theme';

const FEATURES = [
  { icon: 'school', text: 'كل الصفوف من الأول إلى الثاني عشر' },
  { icon: 'lightning-bolt', text: 'اختبارات قصيرة مع شرح فوري' },
  { icon: 'play-circle', text: 'فيديوهات شرح وملخصات مراجَعة' },
  { icon: 'gift', text: 'مجاني بالكامل، بلا إعلانات' },
] as const;

export default function Welcome() {
  return (
    <HeroBackground style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <Logo size={110} onDark />
          <AppText variant="h2" color="#FFFFFF" center style={{ opacity: 0.92 }}>
            رفيقك الذكي في المذاكرة ✨
          </AppText>
        </View>
        <View style={{ gap: spacing.sm }}>
          {FEATURES.map((f) => (
            <Row key={f.text} gap={spacing.md} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Icon name={f.icon} color="#FFFFFF" size={20} />
              </View>
              <AppText color="#FFFFFF" weight="semibold" style={{ flex: 1 }}>
                {f.text}
              </AppText>
            </Row>
          ))}
        </View>
        <Button title="هيا نبدأ" kind="white" icon="arrow-left" onPress={() => router.push('/login')} />
      </SafeAreaView>
    </HeroBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: spacing.xl, justifyContent: 'space-between', gap: spacing.xl },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  feature: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  featureIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
