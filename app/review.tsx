import { router } from 'expo-router';

import { AnswerReview } from '@/components/AnswerReview';
import { AppText, Button, EmptyState, Screen } from '@/components/ui';
import { useSession } from '@/lib/store';

export default function ReviewScreen() {
  const last = useSession((s) => s.lastResult);
  const wrong = last?.answers.filter((a) => !a.correct) ?? [];
  if (wrong.length === 0) return <EmptyState icon="CircleCheck" title="لا توجد أخطاء" message="أجبت عن جميع الأسئلة إجابة صحيحة." />;
  return (
    <Screen>
      <AppText color="textMuted">راجع الشرح، ثم أعد حل هذه الأسئلة لتثبيت المعلومة.</AppText>
      {wrong.map((a, i) => (
        <AnswerReview key={a.question.id + i} question={a.question} response={a.response} />
      ))}
      <Button
        title="أعد حل هذه الأسئلة"
        onPress={() => router.replace({ pathname: '/quiz', params: { mode: 'mistakes', ids: wrong.map((a) => a.question.id).join(',') } })}
      />
    </Screen>
  );
}
