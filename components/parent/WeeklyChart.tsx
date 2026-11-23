/**
 * أعمدة دقائق الدراسة لآخر 7 أيام — سلسلة واحدة باللون الذهبي (لا حاجة لمفتاح ألوان).
 * الضغط على عمود يعرض قيمته؛ وللقارئ الصوتي وصف نصي كامل للقيم.
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Row } from '@/components/ui';
import { lastDays } from '@/lib/report';
import { spacing, useAppTheme } from '@/lib/theme';

const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const SHORT = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const HEIGHT = 120;

const weekday = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay();

export function WeeklyChart({ study, today }: { study: Record<string, number>; today: string }) {
  const { colors } = useAppTheme();
  const days = lastDays(today, 7);
  const minutes = days.map((d) => Math.round((study[d] ?? 0) / 60));
  const max = Math.max(...minutes, 1);
  const [sel, setSel] = useState<number>(6);

  const describe = days.map((d, i) => `${DAY_NAMES[weekday(d)]}: ${minutes[i]} دقيقة`).join('، ');

  return (
    <View style={{ gap: spacing.sm }} accessible accessibilityLabel={`دقائق الدراسة في آخر 7 أيام. ${describe}`}>
      <AppText variant="caption" color="textMuted">
        {DAY_NAMES[weekday(days[sel])]}
        {sel === 6 ? ' (اليوم)' : ''}: {minutes[sel]} دقيقة
      </AppText>
      <View style={{ height: HEIGHT, justifyContent: 'flex-end' }}>
        {/* خط الأساس */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: colors.border }} />
        <Row gap={spacing.sm} style={{ alignItems: 'flex-end', height: HEIGHT }}>
          {minutes.map((m, i) => {
            const h = m === 0 ? 2 : Math.max(6, (m / max) * (HEIGHT - 8));
            const active = i === sel;
            return (
              <Pressable
                key={days[i]}
                onPress={() => setSel(i)}
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={{ flex: 1, height: HEIGHT, justifyContent: 'flex-end', alignItems: 'center' }}
                hitSlop={4}>
                <View
                  style={{
                    width: '56%',
                    maxWidth: 22,
                    height: h,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    backgroundColor: m === 0 ? colors.border : active ? colors.gold : colors.goldLine,
                  }}
                />
              </Pressable>
            );
          })}
        </Row>
      </View>
      <Row gap={spacing.sm}>
        {days.map((d, i) => (
          <AppText key={d} variant="caption" color={i === sel ? 'goldText' : 'textMuted'} center style={{ flex: 1, fontSize: 11 }}>
            {SHORT[weekday(d)]}
          </AppText>
        ))}
      </Row>
    </View>
  );
}
