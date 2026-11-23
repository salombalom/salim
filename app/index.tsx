import { Redirect } from 'expo-router';

import { useSettings } from '@/lib/store';

export default function Index() {
  const { onboarded, role, grade } = useSettings();
  if (!onboarded) return <Redirect href="/welcome" />;
  if (!role) return <Redirect href="/role" />;
  if (!grade) return <Redirect href="/grade" />;
  return <Redirect href="/home" />;
}
