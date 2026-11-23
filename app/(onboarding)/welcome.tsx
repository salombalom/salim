import { router } from 'expo-router';
import { View } from 'react-native';

import { Logo } from '@/components/Logo';
import { AppText, Button, Icon, Row, Screen } from '@/components/ui';
import { spacing } from '@/lib/theme';

const FEATURES = [
  { icon: 'school', text: 'كل الصفوف من الأول إلى الثاني عشر' },
  { icon: 'clipboard-check-outline', text: 'اختبارات قصيرة مع شرح فوري للإجابة' },
  { icon: 'play-circle-outline', text: 'فيديوهات شرح وملخصات مراجَعة' },
  { icon: 'gift-outline', text: 'مجاني بالكامل، بلا إعلانات' },
] as const;

export default function Welcome() {
  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ flexGrow: 1, justifyContent: 'center', gap: spacing.xl }}>
      <Logo />
      <AppText variant="h2" center color="textMuted">
        رفيقك في المذاكرة لكل المواد
      </AppText>
      <View style={{ gap: spacing.md }}>
        {FEATURES.map((f) => (
          <Row key={f.text} gap={spacing.md}>
            <Icon name={f.icon} color="primary" />
            <AppText style={{ flex: 1 }}>{f.text}</AppText>
          </Row>
        ))}
      </View>
      <Button title="ابدأ" icon="arrow-left" onPress={() => router.push('/login')} />
    </Screen>
  );
}
