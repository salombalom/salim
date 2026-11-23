import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Gradient, type IconName } from '@/components/ui';
import { useAppTheme } from '@/lib/theme';

const DECOR: { icon: IconName; top: string; start: string; size: number; rotate: string }[] = [
  { icon: 'star-four-points', top: '8%', start: '8%', size: 26, rotate: '12deg' },
  { icon: 'pencil', top: '20%', start: '82%', size: 34, rotate: '-20deg' },
  { icon: 'calculator-variant', top: '70%', start: '6%', size: 30, rotate: '-12deg' },
  { icon: 'atom', top: '82%', start: '78%', size: 36, rotate: '18deg' },
  { icon: 'lightbulb-on-outline', top: '45%', start: '90%', size: 24, rotate: '8deg' },
  { icon: 'star-four-points', top: '55%', start: '14%', size: 16, rotate: '0deg' },
];

/** خلفية متدرجة مع رموز تعليمية مزخرفة خفيفة */
export function HeroBackground({ children, style, colors: custom }: { children?: ReactNode; style?: StyleProp<ViewStyle>; colors?: readonly [string, string, ...string[]] }) {
  const { gradients } = useAppTheme();
  return (
    <Gradient colors={custom ?? gradients.hero} style={[{ overflow: 'hidden' }, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {DECOR.map((d, i) => (
          <View key={i} style={{ position: 'absolute', top: d.top as `${number}%`, start: d.start as `${number}%`, transform: [{ rotate: d.rotate }] }}>
            <MaterialCommunityIcons name={d.icon} size={d.size} color="rgba(255,255,255,0.14)" />
          </View>
        ))}
      </View>
      {children}
    </Gradient>
  );
}
