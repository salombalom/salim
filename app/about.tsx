import Constants from 'expo-constants';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Logo } from '@/components/Logo';
import { AppText, Card, ListRow, Screen } from '@/components/ui';
import { spacing } from '@/lib/theme';

/** يُدار شعار الراعي لاحقاً من لوحة الإدارة (جدول sponsors). لا يظهر شيء إذا لم يوجد راعٍ. */
const sponsor: { name: string; logoUrl: string } | null = null;

export default function AboutScreen() {
  return (
    <Screen>
      <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        <Logo size={56} tagline={`الإصدار ${Constants.expoConfig?.version ?? '1.0.0'}`} />
      </View>
      <Card>
        <AppText>
          «دَرْسي» تطبيق تعليمي مجاني بالكامل لطلاب المدارس في سلطنة عُمان، من الصف الأول إلى الثاني عشر. لا اشتراكات، ولا محتوى مقفل، ولا إعلانات.
        </AppText>
      </Card>
      <Card style={{ gap: spacing.xs }}>
        <AppText variant="overline" color="goldText">
          فكرة وتطوير
        </AppText>
        <AppText variant="title">سالم الحبسي</AppText>
      </Card>
      {sponsor && (
        <Card style={{ alignItems: 'center' }}>
          <AppText variant="overline" color="textMuted">
            بدعم من
          </AppText>
        </Card>
      )}
      <Card style={{ paddingVertical: spacing.xs }}>
        <ListRow icon="ShieldCheck" title="سياسة الخصوصية" onPress={() => router.push('/privacy')} last />
      </Card>
      <AppText variant="caption" color="textMuted" center>
        المحتوى التعليمي في التطبيق أصلي، وروابط الكتب المدرسية تُفتح من مصادرها الرسمية.
      </AppText>
    </Screen>
  );
}
