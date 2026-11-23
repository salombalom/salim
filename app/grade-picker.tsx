import { router } from 'expo-router';

import { GradeGrid } from '@/components/GradeGrid';
import { Screen } from '@/components/ui';
import { syncProfile } from '@/lib/sync';
import { useSettings } from '@/lib/store';

export default function GradePicker() {
  const { grade, set } = useSettings();
  return (
    <Screen>
      <GradeGrid
        value={grade}
        onSelect={(g) => {
          set({ grade: g });
          syncProfile().catch(() => {});
          router.back();
        }}
      />
    </Screen>
  );
}
