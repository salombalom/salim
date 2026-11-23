import { StyleSheet, View } from 'react-native';
import Svg, { Defs, G, Path, Pattern, Rect } from 'react-native-svg';

import { patternOpacity, useAppTheme } from '@/lib/theme';

/**
 * نقشة هندسية إسلامية/عُمانية خفيفة (نجمة ثمانية «خاتم» متكررة).
 * تُستخدم فقط في خلفية شاشة الترحيب وأعلى الرئيسية، بشفافية 5٪.
 */
export function GeometricPattern({ size = 64 }: { size?: number }) {
  const { colors } = useAppTheme();
  const h = size / 2;
  const q = size / 4;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="khatam" width={size} height={size} patternUnits="userSpaceOnUse">
            <G stroke={colors.pattern} strokeWidth={1} fill="none">
              <Rect x={q} y={q} width={h} height={h} />
              <Rect x={q} y={q} width={h} height={h} transform={`rotate(45 ${h} ${h})`} />
              <Path d={`M0 0 L${q} ${q} M${size} 0 L${size - q} ${q} M0 ${size} L${q} ${size - q} M${size} ${size} L${size - q} ${size - q}`} />
              <Path d={`M${h} 0 L${h} ${q * 0.6} M${h} ${size} L${h} ${size - q * 0.6} M0 ${h} L${q * 0.6} ${h} M${size} ${h} L${size - q * 0.6} ${h}`} />
            </G>
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#khatam)" opacity={patternOpacity} />
      </Svg>
    </View>
  );
}
