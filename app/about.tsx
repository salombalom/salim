import Constants from 'expo-constants';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Logo } from '@/components/Logo';
import { AppText, Card, ListRow, Screen } from '@/components/ui';
import { spacing, useAppTheme } from '@/lib/theme';

/** يُدار شعار الراعي لاحقاً من لوحة الإدارة (جدول sponsors). لا يظهر شيء إذا لم يوجد راعٍ. */
const sponsor: { name: string; logoUrl: string } | null = null;

export default function AboutScreen() {
  const { colors } = useAppTheme();
  return (
    <Screen>
      <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        <Logo size={80} />
        <AppText color="textMuted">الإصدار {Constants.expoConfig?.version ?? '1.0.0'}</AppText>
      </View>
      <Card>
        <AppText>
          «دَرْسي» تطبيق تعليمي مجاني بالكامل لطلاب المدارس في سلطنة عُمان، من الصف الأول إلى الثاني عشر. لا اشتراكات، ولا محتوى مقفل، ولا إعلانات.
        </AppText>
      </Card>
      <Card>
        <AppText variant="caption" color="textMuted">
          فكرة وتطوير
        </AppText>
        <AppText variant="h2">سالم الحبسي</AppText>
      </Card>
      {sponsor && (
        <Card style={{ alignItems: 'center', borderColor: colors.border }}>
          <AppText variant="caption" color="textMuted">
            بدعم من
          </AppText>
        </Card>
      )}
      <Card style={{ paddingVertical: 0 }}>
        <ListRow icon="shield-lock-outline" title="سياسة الخصوصية" onPress={() => router.push('/privacy')} />
      </Card>
      <AppText variant="caption" color="textMuted" center>
        المحتوى التعليمي في التطبيق أصلي، وروابط الكتب المدرسية تُفتح من مصادرها الرسمية.
      </AppText>
    </Screen>
  );
}
