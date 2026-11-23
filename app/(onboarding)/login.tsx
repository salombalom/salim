import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Logo } from '@/components/Logo';
import { AppText, Button, Card, Chip, Icon, Row, Screen, Segmented } from '@/components/ui';
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

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <Logo size={72} showName={false} />
      <View style={{ gap: 4 }}>
        <AppText variant="title" center>
          أهلاً بك في دَرْسي 👋
        </AppText>
        <AppText color="textMuted" center>
          سجّل الدخول لحفظ تقدمك على أكثر من جهاز ولربط حسابك بولي الأمر.
        </AppText>
      </View>

      <Card style={{ gap: spacing.md }}>
        <Segmented
          value={method}
          onChange={setMethod}
          options={[
            { value: 'email', label: 'البريد', icon: 'email-outline' },
            { value: 'phone', label: 'رقم الهاتف', icon: 'phone-outline' },
          ]}
        />
        <Row
          style={{
            borderWidth: 2,
            borderColor: colors.border,
            backgroundColor: colors.surfaceAlt,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
          }}>
          <Icon name={method === 'email' ? 'email-outline' : 'phone-outline'} color="textMuted" />
          <TextInput
            style={{ flex: 1, paddingVertical: 14, color: colors.text, fontFamily: fonts.medium, fontSize: 16, textAlign: 'right' }}
            placeholder={method === 'email' ? 'example@mail.com' : '+968 9XXXXXXX'}
            placeholderTextColor={colors.textMuted}
            keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
            autoCapitalize="none"
            editable={false}
          />
        </Row>
        <Button title="إرسال رمز التحقق" disabled />
        <View style={{ alignItems: 'center' }}>
          <Chip label="تسجيل الدخول يتوفر في المرحلة القادمة" icon="clock-outline" color={colors.warning} bg={colors.warningSoft} />
        </View>
      </Card>

      <Button title="تجربة بدون حساب" kind="secondary" icon="rocket-launch-outline" onPress={continueAsGuest} />
      <AppText variant="caption" color="textMuted" center>
        في وضع التجربة يُحفظ تقدمك على هذا الجهاز فقط.
      </AppText>
    </Screen>
  );
}
