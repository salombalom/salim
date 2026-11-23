import { EmptyState, Screen } from '@/components/ui';

export default function ParentScreen() {
  return (
    <Screen>
      <EmptyState
        icon="account-child-outline"
        title="لوحة ولي الأمر"
        message="قريباً: اربط حساب ابنك بكود، وتابع وقت الدراسة والدرجات لكل مادة ونقاط الضعف. تحتاج هذه الميزة إلى تسجيل الدخول."
      />
    </Screen>
  );
}
