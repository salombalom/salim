import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText, Gradient } from '@/components/ui';
import { useAppTheme } from '@/lib/theme';

/** شعار «دَرْسي». `onDark` للعرض فوق خلفية متدرجة */
export function Logo({ size = 96, onDark, showName = true }: { size?: number; onDark?: boolean; showName?: boolean }) {
  const { gradients, colors } = useAppTheme();
  const badge = (
    <>
      <MaterialCommunityIcons name="book-open-page-variant" size={size * 0.52} color={onDark ? colors.primary : '#FFFFFF'} />
      <View style={{ position: 'absolute', top: size * 0.1, end: size * 0.1 }}>
        <MaterialCommunityIcons name="star-four-points" size={size * 0.2} color="#FFC93C" />
      </View>
    </>
  );
  const box = { width: size, height: size, borderRadius: size * 0.32, alignItems: 'center' as const, justifyContent: 'center' as const, transform: [{ rotate: '-6deg' }] };
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      {onDark ? (
        <View style={[box, { backgroundColor: '#FFFFFF', borderBottomWidth: 6, borderBottomColor: 'rgba(0,0,0,0.15)' }]}>{badge}</View>
      ) : (
        <Gradient colors={gradients.hero} style={box}>
          {badge}
        </Gradient>
      )}
      {showName && (
        <AppText variant="display" color={onDark ? '#FFFFFF' : 'primary'} style={{ fontSize: size * 0.45, lineHeight: size * 0.66 }}>
          دَرْسي
        </AppText>
      )}
    </View>
  );
}
