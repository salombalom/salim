/** عرض تقرير ولي الأمر (مشترك بين التقرير المحلي وتقرير الخادم) */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { WeeklyChart } from '@/components/parent/WeeklyChart';
import { StatRow } from '@/components/StatRow';
import { AppText, Button, Card, EmptyState, Icon, ListRow, ProgressBar, Row, SectionTitle } from '@/components/ui';
import { gradeName, SUBJECTS, type GradeNumber } from '@/config/curriculum';
import { getLessonIdsForSubject, getSubject } from '@/lib/data/repository';
import { exportPdf } from '@/lib/pdfExport';
import { formatDuration } from '@/lib/progress';
import { activeDaysIn, studySecondsIn, type ChildReport } from '@/lib/report';
import { buildReportHtml } from '@/lib/reportPdf';
import { spacing } from '@/lib/theme';

export interface ReportHeader {
  name: string;
  grade: GradeNumber | null;
  points: number;
  streak: number;
}

export function ReportView({ report, header, today }: { report: ChildReport; header: ReportHeader; today: string }) {
  const [busy, setBusy] = useState(false);
  const week = studySecondsIn(report, today, 7);
  const month = studySecondsIn(report, today, 30);
  const active = activeDaysIn(report, today, 7);
  const totalDone = report.subjects.reduce((s, x) => s + x.lessonsDone, 0);
  const empty = report.subjects.length === 0 && month === 0;

  const onExport = async () => {
    setBusy(true);
    try {
      await exportPdf(buildReportHtml({ report, header, today }), `تقرير ${header.name}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Card style={{ gap: spacing.lg }}>
        <View>
          <AppText variant="title">{header.name}</AppText>
          <AppText variant="caption" color="textMuted">
            {header.grade ? gradeName(header.grade) : ''}
          </AppText>
        </View>
        <StatRow
          items={[
            { value: String(Math.round(week / 60)), label: 'دقيقة هذا الأسبوع' },
            { value: `${active}/7`, label: 'أيام نشطة' },
            { value: String(totalDone), label: 'درساً منجزاً' },
          ]}
        />
        <StatRow
          items={[
            { value: String(header.points), label: 'النقاط' },
            { value: String(header.streak), label: 'أيام متتالية' },
            { value: String(report.openMistakes), label: 'خطأً للمراجعة' },
          ]}
        />
      </Card>

      {empty ? (
        <EmptyState icon="ChartColumn" title="لا يوجد نشاط بعد" message="يظهر هنا وقت الدراسة والدرجات بعد أول اختبار." />
      ) : (
        <>
          <SectionTitle>وقت الدراسة</SectionTitle>
          <Card style={{ gap: spacing.md }}>
            <WeeklyChart study={report.study} today={today} />
            <AppText variant="caption" color="textMuted">
              آخر 30 يوماً: {formatDuration(month)}
            </AppText>
          </Card>

          <SectionTitle>المواد</SectionTitle>
          <Card style={{ gap: spacing.lg }}>
            {report.subjects.map((s) => {
              const subj = getSubject(s.subjectId);
              const total = getLessonIdsForSubject(s.subjectId).length;
              return (
                <View key={s.subjectId} style={{ gap: spacing.xs }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Row gap={spacing.sm}>
                      {subj && <Icon name={subj.meta.icon} size={18} />}
                      <AppText variant="label">{subj ? SUBJECTS[subj.key].nameAr : s.subjectId}</AppText>
                    </Row>
                    <AppText variant="label" font="heading" color={s.avgPercent >= 70 ? 'successText' : s.avgPercent >= 50 ? 'goldText' : 'dangerText'}>
                      {s.avgPercent}%
                    </AppText>
                  </Row>
                  <ProgressBar value={total ? s.lessonsDone / total : 0} />
                  <AppText variant="caption" color="textMuted">
                    {s.lessonsDone} من {total} دروس منجزة · {s.attempts} اختبار
                  </AppText>
                </View>
              );
            })}
          </Card>

          <SectionTitle>تحتاج مراجعة</SectionTitle>
          {report.weakLessons.length === 0 ? (
            <Card>
              <AppText color="textMuted">لا توجد دروس ضعيفة. كل النتائج 70% فأكثر.</AppText>
            </Card>
          ) : (
            <Card style={{ paddingVertical: spacing.xs }}>
              {report.weakLessons.map((w, i) => (
                <ListRow
                  key={w.lessonId}
                  icon="Target"
                  title={w.title}
                  subtitle={`${getSubject(w.subjectId)?.meta.nameAr ?? ''} · أفضل نتيجة ${w.bestPercent}%`}
                  onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: w.lessonId } })}
                  last={i === report.weakLessons.length - 1}
                />
              ))}
            </Card>
          )}

          {report.recent.length > 0 && (
            <>
              <SectionTitle>آخر النشاط</SectionTitle>
              <Card style={{ paddingVertical: spacing.xs }}>
                {report.recent.slice(0, 6).map((r, i, arr) => (
                  <ListRow
                    key={`${r.at}-${i}`}
                    icon="ClipboardCheck"
                    title={r.title ?? 'مراجعة الأخطاء'}
                    subtitle={`${r.percent}% · ${new Date(r.at).toLocaleDateString('ar-OM', { day: 'numeric', month: 'long' })}`}
                    last={i === arr.length - 1}
                  />
                ))}
              </Card>
            </>
          )}
        </>
      )}

      <Button title="تصدير التقرير PDF" kind="secondary" icon="FileDown" loading={busy} onPress={onExport} />
    </View>
  );
}
