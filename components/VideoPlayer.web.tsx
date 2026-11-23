import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { radius, spacing, useAppTheme } from '@/lib/theme';

/** نسخة الويب: مشغّل يوتيوب الرسمي عبر iframe (youtube-nocookie للخصوصية) */
export function VideoPlayer({ youtubeId }: { youtubeId: string }) {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const w = Math.min(width - spacing.xl * 2, 720);
  const h = Math.round((w * 9) / 16);
  return (
    <View style={[styles.frame, { width: w, height: h, backgroundColor: colors.surface, borderColor: colors.border }]}>
      <iframe
        title="video"
        width={w}
        height={h}
        style={{ border: 0 }}
        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&iv_load_policy=3`}
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.card - 4, overflow: 'hidden', borderWidth: 1, alignSelf: 'center' },
});
