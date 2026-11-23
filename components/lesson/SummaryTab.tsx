import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Chip, EmptyState, Icon, Row, Toast } from '@/components/ui';
import { LOCAL_ONLY } from '@/config/app';
import type { LessonSummary } from '@/lib/data/summaries';
import { exportPdf } from '@/lib/pdfExport';
import { useProgress } from '@/lib/store';
import { buildSummaryHtml } from '@/lib/summaryPdf';
import { syncFavorite } from '@/lib/sync';
import { spacing, useAppTheme } from '@/lib/theme';

export function SummaryTab({
  summary,
  lessonId,
  lessonTitle,
  objectives,
  unitTitle,
  subjectName,
  gradeName,
  accent,
  ltr,
}: {
  summary: LessonSummary | null;
  lessonId: string;
  lessonTitle: string;
  objectives: string[];
  unitTitle: string;
  subjectName: string;
  gradeName: string;
  accent: string;
  ltr: boolean;
}) {
  const { colors } = useAppTheme();
  const saved = useProgress((s) => s.favorites.some((f) => f.type === 'summary' && f.id === lessonId));
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const flash = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(''), 2200);
  };

  const toggleSave = () => {
    const fav = { type: 'summary' as const, id: lessonId, title: lessonTitle, subtitle: `${subjectName} · ${gradeName}`, lessonId };
    useProgress.getState().toggleFavorite(fav);
    syncFavorite(fav, !saved).catch(() => {});
    flash(saved ? 'أُزيل من المحفوظات' : 'حُفظ في المحفوظات');
  };

  const onExport = async () => {
    if (!summary) return;
    setBusy(true);
    try {
      await exportPdf(buildSummaryHtml({ lessonTitle, subjectName, gradeName, unitTitle, objectives, summary: summary.content, ltr }), `ملخص: ${lessonTitle}`);
    } catch {
      flash('تعذّر إنشاء ملف PDF');
    } finally {
      setBusy(false);
    }
  };

  const bullet = <View style={[styles.bullet, { borderColor: colors.gold }]} />;
  const s = summary?.content;

  return (
    <View style={{ gap: spacing.lg }}>
      <Card accent={accent}>
        <AppText variant="h2">أهداف الدرس</AppText>
        {objectives.map((o, i) => (
          <Row key={i} style={{ alignItems: 'flex-start' }} gap={spacing.md}>
            {bullet}
            <AppText style={{ flex: 1 }} ltr={ltr}>
              {o}
            </AppText>
          </Row>
        ))}
      </Card>

      {!s ? (
        <EmptyState icon="FileText" title="الملخص قيد الإعداد" message="يظهر ملخص الدرس هنا بعد مراجعته واعتماده." />
      ) : (
        <>
          <Card style={{ gap: spacing.md }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <AppText variant="h2">الملخص</AppText>
              <Row gap={spacing.md}>
                {summary.status === 'draft' && !LOCAL_ONLY && <Chip label="مسودة" icon="Info" />}
                <Pressable onPress={toggleSave} accessibilityRole="button" accessibilityLabel={saved ? 'إزالة من المحفوظات' : 'حفظ الملخص'} hitSlop={8}>
                  <Icon name={saved ? 'BookmarkCheck' : 'Bookmark'} />
                </Pressable>
              </Row>
            </Row>
            <AppText ltr={ltr}>{s.overview}</AppText>
          </Card>

          <Card style={{ gap: spacing.md }}>
            <AppText variant="label" color="goldText">
              {ltr ? 'Key ideas' : 'أهم الأفكار'}
            </AppText>
            {s.concepts.map((c, i) => (
              <Row key={i} style={{ alignItems: 'flex-start' }} gap={spacing.md}>
                {bullet}
                <AppText style={{ flex: 1 }} ltr={ltr}>
                  {c}
                </AppText>
              </Row>
            ))}
          </Card>

          {s.definitions.length > 0 && (
            <Card style={{ gap: spacing.md }}>
              <AppText variant="label" color="goldText">
                {ltr ? 'Key terms' : 'مصطلحات'}
              </AppText>
              {s.definitions.map((d, i) => (
                <View key={i} style={{ gap: 2 }}>
                  <AppText variant="label" ltr={ltr}>
                    {d.term}
                  </AppText>
                  <AppText color="textMuted" ltr={ltr}>
                    {d.meaning}
                  </AppText>
                </View>
              ))}
            </Card>
          )}

          {!!s.example && (
            <Card accent={colors.gold} style={{ gap: spacing.sm }}>
              <Row gap={spacing.sm}>
                <Icon name="Lightbulb" size={18} />
                <AppText variant="label" color="goldText">
                  {ltr ? 'Example' : 'مثال'}
                </AppText>
              </Row>
              <AppText ltr={ltr}>{s.example}</AppText>
            </Card>
          )}

          <Card style={{ gap: spacing.md }}>
            <AppText variant="label" color="goldText">
              {ltr ? 'Check yourself' : 'راجع نفسك'}
            </AppText>
            {s.review.map((r, i) => (
              <Row key={i} style={{ alignItems: 'flex-start' }} gap={spacing.md}>
                <AppText variant="label" font="heading" color="goldText">
                  {i + 1}
                </AppText>
                <AppText style={{ flex: 1 }} ltr={ltr}>
                  {r}
                </AppText>
              </Row>
            ))}
          </Card>

          <Button title="تصدير الملخص PDF" kind="secondary" icon="FileDown" loading={busy} onPress={onExport} />
          <AppText variant="caption" color="textMuted" center>
            ملخص أصلي للمراجعة، وليس نصاً من الكتاب المدرسي.
          </AppText>
        </>
      )}
      {!!toast && <Toast text={toast} visible style={{ position: 'absolute', bottom: 0, alignSelf: 'center', zIndex: 10 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bullet: { width: 7, height: 7, borderWidth: 1, transform: [{ rotate: '45deg' }], marginTop: 10 },
});
