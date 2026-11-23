import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, IconCircle, Row } from '@/components/ui';
import { makeGateQuestion } from '@/lib/parentalGate';
import { borderWidth, fonts, radius, spacing, useAppTheme } from '@/lib/theme';

/**
 * بوابة ولي الأمر: سؤال حسابي بسيط قبل مغادرة التطبيق إلى رابط خارجي.
 * الاستخدام: const gate = useParentalGate(); gate.request(() => openLink());  ثم ضع {gate.element} في الشاشة.
 */
export function useParentalGate() {
  const [pending, setPending] = useState<null | (() => void)>(null);
  const element = <ParentalGateModal visible={!!pending} onPass={() => { const fn = pending; setPending(null); fn?.(); }} onCancel={() => setPending(null)} />;
  return { request: (fn: () => void) => setPending(() => fn), element };
}

function ParentalGateModal({ visible, onPass, onCancel }: { visible: boolean; onPass: () => void; onCancel: () => void }) {
  const { colors, fontScale } = useAppTheme();
  const [q, setQ] = useState(makeGateQuestion);
  const [wrong, setWrong] = useState(false);

  const close = () => {
    setQ(makeGateQuestion());
    setWrong(false);
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <IconCircle name="Lock" size={52} />
            <AppText variant="h2" center>
              لولي الأمر
            </AppText>
            <AppText color="textMuted" center>
              هذا الرابط يفتح خارج التطبيق. للمتابعة، أجب عن السؤال التالي:
            </AppText>
            <AppText color="goldText" center style={{ fontFamily: fonts.heading, fontSize: 26 * fontScale, lineHeight: 42 * fontScale }}>
              {`كم يساوي ${q.a} × ${q.b}؟`}
            </AppText>
          </View>
          <Row gap={spacing.sm} style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {q.options.map((o) => (
              <Pressable
                key={o}
                accessibilityRole="button"
                onPress={() => {
                  if (o === q.answer) {
                    setQ(makeGateQuestion());
                    setWrong(false);
                    onPass();
                  } else {
                    setWrong(true);
                    setQ(makeGateQuestion());
                  }
                }}
                style={({ pressed }) => [styles.option, { borderColor: pressed ? colors.gold : colors.border }]}>
                <AppText variant="h2" color="text">
                  {String(o)}
                </AppText>
              </Pressable>
            ))}
          </Row>
          {wrong && (
            <AppText variant="caption" color="dangerText" center>
              إجابة غير صحيحة، جرّب السؤال الجديد.
            </AppText>
          )}
          <Button title="إلغاء" kind="ghost" onPress={close} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  sheet: { width: '100%', maxWidth: 420, borderRadius: radius.card, borderWidth: borderWidth.hairline, padding: spacing.xl, gap: spacing.lg },
  option: { width: '46%', alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.button, borderWidth: borderWidth.hairline },
});
