import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppText, Button, Card, Chip, Screen, Segmented } from '@/components/ui';
import { useSettings } from '@/lib/store';
import { fonts, radius, spacing, useAppTheme } from '@/lib/theme';

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

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 16,
    textAlign: 'right' as const,
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <AppText variant="title">تسجيل الدخول</AppText>
      <AppText color="textMuted">سجّل الدخول لحفظ تقدمك على أكثر من جهاز ولربط حسابك بولي الأمر.</AppText>

      <Card>
        <Segmented
          value={method}
          onChange={setMethod}
          options={[
            { value: 'email', label: 'البريد الإلكتروني', icon: 'email-outline' },
            { value: 'phone', label: 'رقم الهاتف', icon: 'phone-outline' },
          ]}
        />
        {method === 'email' ? (
          <TextInput
            style={inputStyle}
            placeholder="example@mail.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
          />
        ) : (
          <TextInput style={inputStyle} placeholder="+968 9XXXXXXX" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" editable={false} />
        )}
        <Button title="إرسال رمز التحقق" disabled />
        <View style={{ alignItems: 'center' }}>
          <Chip label="تسجيل الدخول يتوفر في المرحلة القادمة" icon="clock-outline" />
        </View>
      </Card>

      <Button title="تجربة بدون حساب" kind="secondary" icon="account-question-outline" onPress={continueAsGuest} />
      <AppText variant="caption" color="textMuted" center>
        في وضع التجربة يُحفظ تقدمك على هذا الجهاز فقط.
      </AppText>
    </Screen>
  );
}
