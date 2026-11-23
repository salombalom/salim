import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View, useWindowDimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

import { radius, spacing, useAppTheme } from '@/lib/theme';

/** مشغّل يوتيوب الرسمي (iframe) — لا نحمّل الفيديو ولا نعيد رفعه */
export function VideoPlayer({ youtubeId }: { youtubeId: string }) {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const [ready, setReady] = useState(false);
  const w = Math.min(width - spacing.xl * 2, 720);
  const h = Math.round((w * 9) / 16);
  return (
    <View style={[styles.frame, { width: w, height: h, backgroundColor: colors.surface, borderColor: colors.border }]}>
      <YoutubePlayer
        key={youtubeId}
        width={w}
        height={h}
        videoId={youtubeId}
        onReady={() => setReady(true)}
        initialPlayerParams={{ rel: false, modestbranding: true, iv_load_policy: 3 }}
        webViewProps={{ allowsFullscreenVideo: true, allowsInlineMediaPlayback: true }}
      />
      {!ready && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <ActivityIndicator color={colors.gold} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { borderRadius: radius.card - 4, overflow: 'hidden', borderWidth: 1, alignSelf: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
