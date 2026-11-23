import { router } from 'expo-router';
import { View } from 'react-native';

import { AnswerReview } from '@/components/AnswerReview';
import { AppText, Button, Chip, EmptyState, Row, Screen, SectionTitle } from '@/components/ui';
import { getSubject } from '@/lib/data/repository';
import { useProgress } from '@/lib/store';
import { spacing, subjectColors, useAppTheme } from '@/lib/theme';

export default function MistakesScreen() {
  const mistakes = useProgress((s) => s.mistakes);
  const { isDark } = useAppTheme();
  const list = Object.values(mistakes).sort((a, b) => b.lastAt - a.lastAt);

  if (list.length === 0) {
    return (
      <Screen>
        <EmptyState icon="check-decagram-outline" title="لا توجد أخطاء" message="عندما تخطئ في سؤال سيظهر هنا لتعيد حله لاحقاً." />
      </Screen>
    );
  }

  const bySubject = new Map<string, typeof list>();
  for (const m of list) bySubject.set(m.subjectId, [...(bySubject.get(m.subjectId) ?? []), m]);

  return (
    <Screen>
      <AppText color="textMuted">لديك {list.length} سؤالاً لإعادة حله. كل سؤال تحله بشكل صحيح يُحذف من القائمة.</AppText>
      <Button title="حلّ كل أخطائي" icon="refresh" onPress={() => router.push({ pathname: '/quiz', params: { mode: 'mistakes' } })} />
      {[...bySubject.entries()].map(([subjectId, items]) => {
        const subject = getSubject(subjectId);
        const c = subject ? subjectColors(subject.meta.color, subject.meta.tint, isDark) : undefined;
        return (
          <View key={subjectId} style={{ gap: spacing.sm }}>
            <SectionTitle
              action={
                <Button
                  title="حلّها"
                  kind="secondary"
                  style={{ minHeight: 36, paddingVertical: 4 }}
                  onPress={() => router.push({ pathname: '/quiz', params: { mode: 'mistakes', subjectId } })}
                />
              }>
              {subject?.meta.nameAr ?? subjectId}
            </SectionTitle>
            {items.slice(0, 20).map((m) => (
              <AnswerReview
                key={m.question.id}
                question={m.question}
                footer={
                  <Row>
                    <Chip label={`أخطأت ${m.wrongCount} ${m.wrongCount === 1 ? 'مرة' : 'مرات'}`} color={c?.fg} bg={c?.bg} />
                  </Row>
                }
              />
            ))}
          </View>
        );
      })}
    </Screen>
  );
}
