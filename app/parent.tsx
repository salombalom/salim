/**
 * لوحة ولي الأمر.
 * - الوضع المحلي (أو بلا حساب): تقرير تقدّم الطالب المحفوظ على هذا الجهاز، مع تصدير PDF لإرساله لولي الأمر.
 * - ولي أمر مسجّل: قائمة الأبناء المرتبطين برمز، وتقرير كل منهم من الخادم.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';

import { ReportView } from '@/components/parent/ReportView';
import { AppText, Button, Card, EmptyState, ListRow, Screen, Segmented, SectionTitle } from '@/components/ui';
import { gradeName } from '@/config/curriculum';
import { useAuth } from '@/lib/auth';
import { confirmAction } from '@/lib/confirm';
import { currentStreak, dayKey } from '@/lib/gamification';
import { fetchChildReport, fetchChildren, redeemLinkCode, removeLink, type LinkedChild } from '@/lib/parent';
import { localReport, type ChildReport } from '@/lib/report';
import { useProgress, useSettings } from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { borderWidth, fonts, radius, spacing, useAppTheme } from '@/lib/theme';

export default function ParentScreen() {
  const signedIn = useAuth((s) => s.status === 'signedIn');
  const role = useSettings((s) => s.role);
  if (isSupabaseConfigured && signedIn && role === 'parent') return <LinkedChildren />;
  return <DeviceReport />;
}

/** تقرير هذا الجهاز */
function DeviceReport() {
  const progress = useProgress();
  const settings = useSettings();
  const today = dayKey();
  const report = localReport(progress, today);
  const isParent = settings.role === 'parent';
  return (
    <Screen>
      <Card style={{ gap: spacing.sm }}>
        <AppText variant="label">{isParent ? 'كيف أتابع ابني؟' : 'تقرير لولي أمرك'}</AppText>
        <AppText variant="caption" color="textMuted">
          {isParent
            ? 'يُحفظ تقدّم الطالب على جهازه. افتح هذه الصفحة من «حسابي» على جهاز ابنك، أو اطلب منه تصدير التقرير PDF وإرساله إليك.'
            : 'هذا ملخص تقدّمك المحفوظ على هذا الجهاز. صدّره PDF وأرسله لولي أمرك ليتابع معك.'}
        </AppText>
      </Card>
      <ReportView
        report={report}
        today={today}
        header={{
          name: settings.displayName.trim() || 'الطالب',
          grade: settings.grade,
          points: progress.points,
          streak: currentStreak(progress.streak, today),
        }}
      />
    </Screen>
  );
}

/** ولي أمر مسجّل: أبناؤه المرتبطون */
function LinkedChildren() {
  const { colors } = useAppTheme();
  const [children, setChildren] = useState<LinkedChild[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [reports, setReports] = useState<Record<string, ChildReport>>({});
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const today = dayKey();

  // الابن المختار: اختيار المستخدم إن كان ما زال مرتبطاً، وإلا الأول
  const selected = children?.some((c) => c.studentId === picked) ? picked : (children?.[0]?.studentId ?? null);

  useEffect(() => {
    let live = true;
    fetchChildren()
      .then((list) => live && setChildren(list))
      .catch((e) => {
        if (!live) return;
        setError((e as Error).message);
        setChildren([]);
      });
    return () => {
      live = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!selected || reports[selected]) return;
    let live = true;
    fetchChildReport(selected)
      .then((r) => live && setReports((m) => ({ ...m, [selected]: r })))
      .catch((e) => live && setError((e as Error).message));
    return () => {
      live = false;
    };
  }, [selected, reports]);

  const reload = (select?: string) => {
    if (select) setPicked(select);
    setReports({});
    setReloadKey((k) => k + 1);
  };

  const link = async () => {
    setLinking(true);
    setError('');
    try {
      const id = await redeemLinkCode(code);
      setCode('');
      reload(id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLinking(false);
    }
  };

  const child = children?.find((c) => c.studentId === selected);
  const report = selected ? reports[selected] : undefined;

  return (
    <Screen>
      {children === null ? (
        <ActivityIndicator color={colors.gold} />
      ) : children.length === 0 ? (
        <EmptyState icon="Users" title="لم تربط أي حساب بعد" message="اطلب من ابنك فتح «حسابي ← ربط ولي الأمر» في تطبيقه، ثم أدخل الرمز الذي يظهر له." />
      ) : (
        <>
          {children.length > 1 && (
            <Segmented
              value={selected ?? ''}
              onChange={setPicked}
              options={children.map((c, i) => ({ value: c.studentId, label: c.displayName || `الابن ${i + 1}` }))}
            />
          )}
          {child && report ? (
            <ReportView
              report={report}
              today={today}
              header={{ name: child.displayName || 'ابني', grade: child.grade, points: child.points, streak: child.streak }}
            />
          ) : (
            <ActivityIndicator color={colors.gold} />
          )}
        </>
      )}

      <SectionTitle>ربط حساب ابن</SectionTitle>
      <Card style={{ gap: spacing.md }}>
        <AppText variant="caption" color="textMuted">
          أدخل الرمز المكوّن من 8 خانات الذي يظهر في تطبيق ابنك. الرمز صالح 24 ساعة ويُستخدم مرة واحدة.
        </AppText>
        <TextInput
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
          placeholder="مثال: K7M2Q9XA"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          accessibilityLabel="رمز الربط"
          style={{
            borderWidth: borderWidth.hairline,
            borderColor: colors.border,
            borderRadius: radius.button,
            paddingHorizontal: spacing.lg,
            paddingVertical: 12,
            color: colors.text,
            fontFamily: fonts.heading,
            fontSize: 22,
            letterSpacing: 4,
            textAlign: 'center',
          }}
        />
        {!!error && (
          <AppText variant="caption" color="dangerText">
            {error}
          </AppText>
        )}
        <Button title="ربط" onPress={link} loading={linking} disabled={code.length !== 8} />
      </Card>

      {children && children.length > 0 && (
        <Card style={{ paddingVertical: spacing.xs }}>
          {children.map((c, i) => (
            <ListRow
              key={c.studentId}
              icon="UserRound"
              title={c.displayName || `الابن ${i + 1}`}
              subtitle={`${c.grade ? gradeName(c.grade) : ''} · اضغط لإلغاء الربط`}
              onPress={() =>
                confirmAction('إلغاء الربط', `لن تتمكن من رؤية تقرير ${c.displayName || 'هذا الابن'} حتى تربطه برمز جديد.`, 'إلغاء الربط', () =>
                  removeLink(c.studentId)
                    .then(() => reload())
                    .catch((e) => setError((e as Error).message)),
                )
              }
              last={i === children.length - 1}
            />
          ))}
        </Card>
      )}
      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}
