/** الطالب: إنشاء رمز لربط ولي الأمر، وإدارة أولياء الأمور المرتبطين */
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, IconCircle, ListRow, Screen, SectionTitle } from '@/components/ui';
import { confirmAction } from '@/lib/confirm';
import { createLinkCode, fetchParents, removeLink, type LinkedParent } from '@/lib/parent';
import { spacing } from '@/lib/theme';

export default function LinkParentScreen() {
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [parents, setParents] = useState<LinkedParent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [reloadKey, setReloadKey] = useState(0);
  const load = () => setReloadKey((k) => k + 1);
  useEffect(() => {
    let live = true;
    fetchParents()
      .then((p) => live && setParents(p))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [reloadKey]);

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      setCode(await createLinkCode());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Card style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxl }}>
        <IconCircle name="KeyRound" size={64} />
        <AppText color="textMuted" center>
          أنشئ رمزاً وأعطه لولي أمرك ليدخله في تطبيقه. سيرى ولي أمرك وقت دراستك ودرجاتك في كل مادة، ولا يرى إجاباتك.
        </AppText>
        {code && (
          <View style={{ alignItems: 'center', gap: spacing.xs }}>
            <AppText variant="display" font="heading" color="goldText" ltr style={{ letterSpacing: 6 }} selectable accessibilityLabel={`الرمز ${code.code.split('').join(' ')}`}>
              {code.code}
            </AppText>
            <AppText variant="caption" color="textMuted">
              صالح حتى {new Date(code.expiresAt).toLocaleString('ar-OM', { weekday: 'long', hour: 'numeric', minute: '2-digit' })}، ويُستخدم مرة واحدة
            </AppText>
          </View>
        )}
        {!!error && (
          <AppText variant="caption" color="dangerText" center>
            {error}
          </AppText>
        )}
        <Button title={code ? 'رمز جديد' : 'إنشاء رمز'} kind={code ? 'secondary' : 'primary'} loading={busy} onPress={generate} style={{ alignSelf: 'stretch' }} />
      </Card>

      {parents.length > 0 && (
        <>
          <SectionTitle>أولياء الأمور المرتبطون</SectionTitle>
          <Card style={{ paddingVertical: spacing.xs }}>
            {parents.map((p, i) => (
              <ListRow
                key={p.parentId}
                icon="Users"
                title={p.displayName || 'ولي أمر'}
                subtitle="اضغط لإلغاء الربط"
                onPress={() =>
                  confirmAction('إلغاء الربط', 'لن يتمكن ولي الأمر هذا من رؤية تقريرك بعد الآن.', 'إلغاء الربط', () =>
                    removeLink(p.parentId)
                      .then(load)
                      .catch((e) => setError((e as Error).message)),
                  )
                }
                last={i === parents.length - 1}
              />
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}
