import { EmptyState, Screen } from '@/components/ui';

export default function ParentScreen() {
  return (
    <Screen>
      <EmptyState
        icon="Users"
        title="لوحة ولي الأمر"
        message="قريباً: اربط حساب ابنك برمز، وتابع وقت الدراسة والدرجات في كل مادة ومواطن الضعف. تتطلب هذه الميزة تسجيل الدخول."
      />
    </Screen>
  );
}
