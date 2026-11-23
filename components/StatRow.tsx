import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Num } from '@/components/ui';
import { spacing, useAppTheme } from '@/lib/theme';

/** صف إحصائيات أنيق: أرقام ذهبية بخط العناوين تفصلها خطوط رفيعة */
export function StatRow({ items }: { items: { value: string; label: string }[] }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      {items.map((it, i) => (
        <Fragment key={it.label}>
          {i > 0 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
          <View style={styles.cell}>
            <Num variant="display">{it.value}</Num>
            <AppText variant="caption" color="textMuted" numberOfLines={1}>
              {it.label}
            </AppText>
          </View>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  cell: { flex: 1, alignItems: 'center', gap: 0, paddingVertical: spacing.xs },
  sep: { width: StyleSheet.hairlineWidth },
});
