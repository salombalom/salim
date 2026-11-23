import { router } from 'expo-router';
import { View } from 'react-native';

import { AnswerReview } from '@/components/AnswerReview';
import { AppText, Button, Card, Chip, EmptyState, Num, Row, Screen, SectionTitle } from '@/components/ui';
import { getSubject } from '@/lib/data/repository';
import { useProgress } from '@/lib/store';
import { spacing } from '@/lib/theme';

export default function MistakesScreen() {
  const mistakes = useProgress((s) => s.mistakes);
  const list = Object.values(mistakes).sort((a, b) => b.lastAt - a.lastAt);

  if (list.length === 0) {
    return (
      <Screen>
        <EmptyState icon="Target" title="لا توجد أخطاء" message="الأسئلة التي تخطئ فيها تظهر هنا لتعيد حلها حتى تتقنها." />
      </Screen>
    );
  }

  const bySubject = new Map<string, typeof list>();
  for (const m of list) bySubject.set(m.subjectId, [...(bySubject.get(m.subjectId) ?? []), m]);

  return (
    <Screen>
      <Card style={{ gap: spacing.lg }}>
        <Row gap={spacing.md}>
          <Num variant="display">{String(list.length)}</Num>
          <View style={{ flex: 1 }}>
            <AppText variant="label">سؤالاً بانتظار الإتقان</AppText>
            <AppText variant="caption" color="textMuted">
              يُحذف السؤال من القائمة عند حلّه بشكل صحيح.
            </AppText>
          </View>
        </Row>
        <Button title="حلّ جميع الأخطاء" onPress={() => router.push({ pathname: '/quiz', params: { mode: 'mistakes' } })} />
      </Card>
      {[...bySubject.entries()].map(([subjectId, items]) => {
        const subject = getSubject(subjectId);
        return (
          <View key={subjectId} style={{ gap: spacing.md }}>
            <SectionTitle
              action={<Button title="حلّها" kind="secondary" size="sm" onPress={() => router.push({ pathname: '/quiz', params: { mode: 'mistakes', subjectId } })} />}>
              {subject?.meta.nameAr ?? subjectId}
            </SectionTitle>
            {items.slice(0, 20).map((m) => (
              <AnswerReview key={m.question.id} question={m.question} footer={<Chip label={`أخطأت ${m.wrongCount} ${m.wrongCount === 1 ? 'مرة' : 'مرات'}`} />} />
            ))}
          </View>
        );
      })}
    </Screen>
  );
}
