import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { AppState } from 'react-native';

import { useProgress } from '@/lib/store';

/** يحسب وقت الدراسة أثناء ظهور الشاشة (يتوقف عند الخروج أو إرسال التطبيق للخلفية) */
export function useStudyTimer() {
  useFocusEffect(
    useCallback(() => {
      let start = Date.now();
      const flush = () => {
        const secs = (Date.now() - start) / 1000;
        // نتجاهل الفترات الطويلة جداً (مثل نسيان الجهاز مفتوحاً)
        useProgress.getState().addStudyTime(Math.min(secs, 30 * 60));
        start = Date.now();
      };
      const sub = AppState.addEventListener('change', (s) => {
        if (s === 'active') start = Date.now();
        else flush();
      });
      return () => {
        sub.remove();
        flush();
      };
    }, []),
  );
}
