import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Card, Screen, Segmented } from '@/components/ui';
import { PRIVACY_POLICY } from '@/config/privacy';
import { spacing } from '@/lib/theme';

export default function PrivacyScreen() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const policy = PRIVACY_POLICY[lang];
  const ltr = lang === 'en';
  return (
    <Screen>
      <Segmented
        value={lang}
        onChange={setLang}
        options={[
          { value: 'ar', label: 'العربية' },
          { value: 'en', label: 'English' },
        ]}
      />
      <AppText variant="title" ltr={ltr}>
        {policy.title}
      </AppText>
      <AppText variant="caption" color="textMuted" ltr={ltr}>
        {policy.updated}
      </AppText>
      {policy.sections.map((s) => (
        <Card key={s.heading} style={ltr ? { direction: 'ltr' } : undefined}>
          <AppText variant="h2" ltr={ltr}>
            {s.heading}
          </AppText>
          <View style={{ gap: spacing.xs }}>
            {s.body.map((p, i) => (
              <AppText key={i} ltr={ltr}>
                {p}
              </AppText>
            ))}
          </View>
        </Card>
      ))}
    </Screen>
  );
}
