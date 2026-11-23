import { Stack } from 'expo-router';

import { motion } from '@/lib/theme';

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: motion.normal }} />;
}
