import { router } from 'expo-router';
import { View } from 'react-native';

import { AnswerReview } from '@/components/AnswerReview';
import { HeroBackground } from '@/components/HeroBackground';
import { AppText, Button, Chip, EmptyState, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { getSubject } from '@/lib/data/repository';
import { useProgress } from '@/lib/store';
import { radius, spacing, subjectColors, useAppTheme } from '@/lib/theme';

export default function MistakesScreen() {
  const mistakes = useProgress((s) => s.mistakes);
  const { isDark, gradients } = useAppTheme();
  const list = Object.values(mistakes).sort((a, b) => b.lastAt - a.lastAt);

  if (list.length === 0) {
    return (
      <Screen>
        <EmptyState icon="check-decagram" title="لا توجد أخطاء! 🎯" message="عندما تخطئ في سؤال سيظهر هنا لتعيد حله وتتقنه." />
      </Screen>
    );
  }

  const bySubject = new Map<string, typeof list>();
  for (const m of list) bySubject.set(m.subjectId, [...(bySubject.get(m.subjectId) ?? []), m]);

  return (
    <Screen>
      <HeroBackground colors={gradients.sunset} style={{ borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md }}>
        <Row gap={spacing.md}>
          <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="target" size={32} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="title" color="#FFFFFF">
              {list.length} سؤالاً للإتقان
            </AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.9)">
              كل سؤال تحله بشكل صحيح يُحذف من القائمة.
            </AppText>
          </View>
        </Row>
        <Button title="حلّ كل أخطائي" kind="white" icon="refresh" onPress={() => router.push({ pathname: '/quiz', params: { mode: 'mistakes' } })} />
      </HeroBackground>
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
                  size="sm"
                  icon="play"
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
