import { View } from 'react-native';

import { AppText, Card, Icon, Row } from '@/components/ui';
import { SUBJECTS } from '@/config/curriculum';
import { correctAnswerText, responseText } from '@/lib/quiz/grading';
import { subjectIdFromLesson } from '@/lib/store';
import type { Question, QuestionResponse } from '@/lib/types';
import { radius, spacing, useAppTheme } from '@/lib/theme';

export function isLtrQuestion(q: Question) {
  const key = subjectIdFromLesson(q.lessonId).split('-')[1] as keyof typeof SUBJECTS;
  return SUBJECTS[key]?.direction === 'ltr';
}

/** بطاقة تعرض السؤال، إجابة الطالب، الإجابة الصحيحة، والشرح */
export function AnswerReview({ question, response, footer }: { question: Question; response?: QuestionResponse | null; footer?: React.ReactNode }) {
  const { colors } = useAppTheme();
  const ltr = isLtrQuestion(question);
  const box = (bg: string, icon: 'close-circle' | 'check-circle', color: 'danger' | 'success', text: string) => (
    <Row style={{ alignItems: 'flex-start', backgroundColor: bg, borderRadius: radius.sm, padding: spacing.sm }}>
      <Icon name={icon} color={color} size={20} />
      <AppText color={color === 'success' ? 'successDeep' : 'dangerDeep'} weight="semibold" style={{ flex: 1 }} ltr={ltr}>
        {text}
      </AppText>
    </Row>
  );
  return (
    <Card style={{ gap: spacing.sm }}>
      <AppText variant="label" weight="bold" ltr={ltr}>
        {question.prompt}
      </AppText>
      {response !== undefined && box(colors.dangerSoft, 'close-circle', 'danger', responseText(response))}
      {box(colors.successSoft, 'check-circle', 'success', correctAnswerText(question))}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Icon name="lightbulb-on-outline" size={16} color="star" />
        <AppText variant="caption" color="textMuted" style={{ flex: 1 }} ltr={ltr}>
          {question.explanation}
        </AppText>
      </View>
      {footer}
    </Card>
  );
}
