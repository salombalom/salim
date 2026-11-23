import { router } from 'expo-router';

import { GradeGrid } from '@/components/GradeGrid';
import { AppText, Screen } from '@/components/ui';
import { useSettings } from '@/lib/store';

export default function GradeScreen() {
  const { grade, role, set } = useSettings();
  return (
    <Screen edges={['top', 'bottom']}>
      <AppText variant="title">{role === 'parent' ? 'في أي صف ابنك؟' : 'في أي صف أنت؟'}</AppText>
      <AppText color="textMuted">يمكنك تغيير الصف لاحقاً من الإعدادات.</AppText>
      <GradeGrid
        value={grade}
        onSelect={(g) => {
          set({ grade: g });
          router.replace('/home');
        }}
      />
    </Screen>
  );
}
