import { router } from 'expo-router';

import { GradeGrid } from '@/components/GradeGrid';
import { Screen } from '@/components/ui';
import { useSettings } from '@/lib/store';

export default function GradePicker() {
  const { grade, set } = useSettings();
  return (
    <Screen>
      <GradeGrid
        value={grade}
        onSelect={(g) => {
          set({ grade: g });
          router.back();
        }}
      />
    </Screen>
  );
}
