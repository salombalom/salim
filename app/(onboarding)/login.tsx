import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppText, Button, Card, Chip, Divider, Icon, Row, Screen, Segmented } from '@/components/ui';
import { useSettings } from '@/lib/store';
import { borderWidth, fonts, radius, spacing, useAppTheme } from '@/lib/theme';

/**
 * شاشة تسجيل الدخول.
 * المرحلة 1: الحقول للعرض فقط، و«تجربة بدون حساب» تعمل.
 * المرحلة 2: ربط البريد ورقم الهاتف بـ Supabase Auth.
 */
export default function Login() {
  const { colors } = useAppTheme();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const set = useSettings((s) => s.set);

  const continueAsGuest = () => {
    set({ onboarded: true });
    router.replace('/role');
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="display">تسجيل الدخول</AppText>
        <AppText color="textMuted">احفظ تقدّمك على أكثر من جهاز، واربط حسابك بولي الأمر.</AppText>
      </View>

      <Card style={{ gap: spacing.lg }}>
        <Segmented
          value={method}
          onChange={setMethod}
          options={[
            { value: 'email', label: 'البريد الإلكتروني', icon: 'Mail' },
            { value: 'phone', label: 'رقم الهاتف', icon: 'Phone' },
          ]}
        />
        <Row
          gap={spacing.md}
          style={{ borderWidth: borderWidth.hairline, borderColor: colors.border, borderRadius: radius.button, paddingHorizontal: spacing.lg }}>
          <Icon name={method === 'email' ? 'Mail' : 'Phone'} color="textMuted" />
          <TextInput
            style={{ flex: 1, paddingVertical: 14, color: colors.text, fontFamily: fonts.regular, fontSize: 16, textAlign: 'right' }}
            placeholder={method === 'email' ? 'example@mail.com' : '+968 9XXXXXXX'}
            placeholderTextColor={colors.textMuted}
            keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
            autoCapitalize="none"
            editable={false}
          />
        </Row>
        <Button title="إرسال رمز التحقق" disabled />
        <View style={{ alignItems: 'center' }}>
          <Chip label="يتوفر تسجيل الدخول في المرحلة القادمة" icon="Clock" />
        </View>
      </Card>

      <Divider ornament />
      <View style={{ gap: spacing.sm }}>
        <Button title="تجربة بدون حساب" kind="secondary" onPress={continueAsGuest} />
        <AppText variant="caption" color="textMuted" center>
          في وضع التجربة يُحفظ تقدّمك على هذا الجهاز فقط.
        </AppText>
      </View>
    </Screen>
  );
}
