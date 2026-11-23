import { View } from 'react-native';

import { AppText, Card, Icon, Row } from '@/components/ui';
import { SUBJECTS } from '@/config/curriculum';
import { correctAnswerText, responseText } from '@/lib/quiz/grading';
import { subjectIdFromLesson } from '@/lib/store';
import type { Question, QuestionResponse } from '@/lib/types';
import { spacing } from '@/lib/theme';

export function isLtrQuestion(q: Question) {
  const key = subjectIdFromLesson(q.lessonId).split('-')[1] as keyof typeof SUBJECTS;
  return SUBJECTS[key]?.direction === 'ltr';
}

/** بطاقة تعرض السؤال، إجابة الطالب، الإجابة الصحيحة، والشرح */
export function AnswerReview({ question, response, footer }: { question: Question; response?: QuestionResponse | null; footer?: React.ReactNode }) {
  const ltr = isLtrQuestion(question);
  return (
    <Card style={{ gap: spacing.md }}>
      <AppText variant="label" ltr={ltr}>
        {question.prompt}
      </AppText>
      {response !== undefined && (
        <Row style={{ alignItems: 'flex-start' }}>
          <Icon name="X" size={18} color="danger" />
          <AppText color="dangerText" style={{ flex: 1 }} ltr={ltr}>
            {responseText(response)}
          </AppText>
        </Row>
      )}
      <Row style={{ alignItems: 'flex-start' }}>
        <Icon name="Check" size={18} color="success" />
        <AppText color="successText" style={{ flex: 1 }} ltr={ltr}>
          {correctAnswerText(question)}
        </AppText>
      </Row>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Icon name="Lightbulb" size={16} />
        <AppText variant="caption" color="textMuted" style={{ flex: 1 }} ltr={ltr}>
          {question.explanation}
        </AppText>
      </View>
      {footer}
    </Card>
  );
}
