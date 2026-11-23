import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from '@/components/ui';
import { useAppTheme } from '@/lib/theme';

export function Logo({ size = 96 }: { size?: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <MaterialCommunityIcons name="book-open-page-variant" size={size * 0.55} color={colors.primaryText} />
      </View>
      <AppText variant="display" color="primary">
        دَرْسي
      </AppText>
    </View>
  );
}
