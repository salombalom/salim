import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppText, Button, Card, Chip, Divider, Icon, Row, Screen, Segmented } from '@/components/ui';
import { normalizeEmail, normalizePhone, sendCode } from '@/lib/auth';
import { useSettings } from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { borderWidth, fonts, radius, spacing, useAppTheme } from '@/lib/theme';

export default function Login() {
  const { colors } = useAppTheme();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = useSettings((s) => s.set);

  const continueAsGuest = () => {
    set({ onboarded: true });
    router.replace('/role');
  };

  const submit = async () => {
    const normalized = method === 'email' ? normalizeEmail(value) : normalizePhone(value);
    if (!normalized) {
      setError(method === 'email' ? 'تحقق من كتابة البريد الإلكتروني.' : 'اكتب رقم هاتف صحيحاً، مثل 9XXXXXXX.');
      return;
    }
    setError(null);
    setBusy(true);
    const err = await sendCode({ kind: method, value: normalized });
    setBusy(false);
    if (err) return setError(err);
    router.push({ pathname: '/verify', params: { kind: method, value: normalized } });
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="display">تسجيل الدخول</AppText>
        <AppText color="textMuted">نرسل إليك رمزاً من 6 أرقام. لا حاجة لكلمة مرور.</AppText>
      </View>

      <Card style={{ gap: spacing.lg }}>
        <Segmented
          value={method}
          onChange={(m) => {
            setMethod(m);
            setValue('');
            setError(null);
          }}
          options={[
            { value: 'email', label: 'البريد الإلكتروني', icon: 'Mail' },
            { value: 'phone', label: 'رقم الهاتف', icon: 'Phone' },
          ]}
        />
        <Row
          gap={spacing.md}
          style={{ borderWidth: borderWidth.hairline, borderColor: error ? colors.danger : colors.border, borderRadius: radius.button, paddingHorizontal: spacing.lg }}>
          <Icon name={method === 'email' ? 'Mail' : 'Phone'} color="textMuted" />
          <TextInput
            value={value}
            onChangeText={setValue}
            onSubmitEditing={submit}
            style={{ flex: 1, paddingVertical: 14, color: colors.text, fontFamily: fonts.regular, fontSize: 16, textAlign: 'right' }}
            placeholder={method === 'email' ? 'example@mail.com' : '9XXXXXXX'}
            placeholderTextColor={colors.textMuted}
            keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
            autoCapitalize="none"
            autoComplete={method === 'email' ? 'email' : 'tel'}
            editable={isSupabaseConfigured && !busy}
            accessibilityLabel={method === 'email' ? 'البريد الإلكتروني' : 'رقم الهاتف'}
          />
        </Row>
        {error && (
          <AppText variant="caption" color="dangerText">
            {error}
          </AppText>
        )}
        <Button title="إرسال الرمز" onPress={submit} loading={busy} disabled={!isSupabaseConfigured || !value.trim()} />
        {!isSupabaseConfigured && (
          <View style={{ alignItems: 'center' }}>
            <Chip label="لم يُربط التطبيق بـ Supabase بعد (راجع README)" icon="Info" />
          </View>
        )}
      </Card>

      <Divider ornament />
      <View style={{ gap: spacing.sm }}>
        <Button title="تجربة بدون حساب" kind="secondary" onPress={continueAsGuest} />
        <AppText variant="caption" color="textMuted" center>
          في وضع التجربة يُحفظ تقدّمك على هذا الجهاز فقط، ويمكنك إنشاء حساب لاحقاً دون أن تفقده.
        </AppText>
      </View>
    </Screen>
  );
}
