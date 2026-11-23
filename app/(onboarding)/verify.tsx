import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppText, Button, Screen } from '@/components/ui';
import { sendCode, verifyCode, type AuthTarget } from '@/lib/auth';
import { useSettings } from '@/lib/store';
import { borderWidth, fonts, radius, spacing, useAppTheme } from '@/lib/theme';

const RESEND_AFTER = 60;

export default function Verify() {
  const { colors, fontScale } = useAppTheme();
  const params = useLocalSearchParams<{ kind: 'email' | 'phone'; value: string }>();
  const target: AuthTarget = { kind: params.kind === 'phone' ? 'phone' : 'email', value: params.value ?? '' };
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_AFTER);
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const submit = async (token = code) => {
    if (token.length !== 6) return;
    setBusy(true);
    setError(null);
    const err = await verifyCode(target, token);
    setBusy(false);
    if (err) {
      setError(err);
      setCode('');
      return;
    }
    const { role, grade } = useSettings.getState();
    router.replace(role && grade ? '/home' : role ? '/grade' : '/role');
  };

  const resend = async () => {
    setWait(RESEND_AFTER);
    const err = await sendCode(target);
    setError(err);
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="display">رمز التحقق</AppText>
        <AppText color="textMuted">أرسلنا رمزاً من 6 أرقام إلى</AppText>
        <AppText variant="label" color="goldText" style={{ writingDirection: 'ltr', textAlign: 'right' }}>
          {target.value}
        </AppText>
      </View>

      <Pressable onPress={() => input.current?.focus()} accessibilityLabel="أدخل الرمز">
        <View style={{ flexDirection: 'row', gap: spacing.sm, direction: 'ltr', justifyContent: 'center' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              style={{
                width: 46,
                height: 56,
                borderRadius: radius.button,
                borderWidth: borderWidth.hairline,
                borderColor: error ? colors.danger : i === code.length ? colors.gold : colors.border,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <AppText color="goldText" style={{ fontFamily: fonts.heading, fontSize: 24 * fontScale, lineHeight: 34 * fontScale }}>
                {code[i] ?? ''}
              </AppText>
            </View>
          ))}
        </View>
      </Pressable>
      <TextInput
        ref={input}
        value={code}
        onChangeText={(t) => {
          const digits = t.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/\D/g, '').slice(0, 6);
          setCode(digits);
          if (digits.length === 6) submit(digits);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
        accessibilityLabel="رمز التحقق"
      />

      {error && (
        <AppText variant="caption" color="dangerText" center>
          {error}
        </AppText>
      )}

      <Button title="تأكيد" onPress={() => submit()} loading={busy} disabled={code.length !== 6} />
      <Button title={wait > 0 ? `إعادة الإرسال بعد ${wait} ث` : 'إعادة إرسال الرمز'} kind="ghost" disabled={wait > 0} onPress={resend} />
      <Button title="تغيير البريد أو الرقم" kind="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
