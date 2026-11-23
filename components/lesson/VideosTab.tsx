import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useParentalGate } from '@/components/ParentalGate';
import { VideoPlayer } from '@/components/VideoPlayer';
import { AppText, Card, EmptyState, Icon, Row } from '@/components/ui';
import { formatDuration, type LessonVideo } from '@/lib/data/media';
import { openExternal } from '@/lib/openLink';
import { useProgress } from '@/lib/store';
import { syncFavorite, syncVideoRating } from '@/lib/sync';
import { borderWidth, radius, spacing, useAppTheme } from '@/lib/theme';

export function VideosTab({
  lessonVideos,
  subjectVideos,
  subjectName,
  lessonId,
  lessonTitle,
}: {
  lessonVideos: LessonVideo[];
  subjectVideos: LessonVideo[];
  subjectName: string;
  lessonId: string;
  lessonTitle: string;
}) {
  const videos = [...lessonVideos, ...subjectVideos];
  const { colors } = useAppTheme();
  const [current, setCurrent] = useState(0);
  const gate = useParentalGate();
  const favorites = useProgress((s) => s.favorites);
  const ratings = useProgress((s) => s.videoRatings);

  if (videos.length === 0) {
    return <EmptyState icon="CirclePlay" title="لا توجد مقاطع شرح بعد" message="تظهر هنا مقاطع مختارة من قنوات تعليمية موثوقة بعد مراجعتها واعتمادها." />;
  }

  const v = videos[Math.min(current, videos.length - 1)];
  const saved = favorites.some((f) => f.type === 'video' && f.id === v.youtubeId);
  const rating = ratings[v.youtubeId];

  const toggleSave = () => {
    const fav = { type: 'video' as const, id: v.youtubeId, title: v.title, subtitle: lessonTitle, lessonId };
    useProgress.getState().toggleFavorite(fav);
    syncFavorite(fav, !saved).catch(() => {});
  };

  const rate = (helpful: boolean) => {
    useProgress.getState().rateVideo(v.youtubeId, helpful);
    const next = useProgress.getState().videoRatings[v.youtubeId];
    syncVideoRating(v.dbId, next === undefined ? null : next).catch(() => {});
  };

  const openChannel = () =>
    gate.request(() => {
      openExternal(v.channelUrl, { controls: colors.gold, toolbar: colors.background });
    });

  return (
    <View style={{ gap: spacing.lg }}>
      {gate.element}
      <VideoPlayer youtubeId={v.youtubeId} />

      <View style={{ gap: spacing.sm }}>
        <AppText variant="label">{v.title}</AppText>
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable onPress={v.channelUrl ? openChannel : undefined} disabled={!v.channelUrl} accessibilityRole="link" hitSlop={8}>
            <Row gap={6}>
              <Icon name="CirclePlay" size={16} />
              <AppText variant="caption" color="goldText">
                {v.channelName || 'يوتيوب'}
              </AppText>
              {!!v.channelUrl && <Icon name="ExternalLink" size={14} color="textMuted" />}
            </Row>
          </Pressable>
          <Row gap={spacing.lg}>
            <Pressable onPress={() => rate(true)} accessibilityRole="button" accessibilityLabel="مفيد" accessibilityState={{ selected: rating === true }} hitSlop={8}>
              <Icon name="ThumbsUp" size={20} color={rating === true ? 'gold' : 'textMuted'} />
            </Pressable>
            <Pressable onPress={() => rate(false)} accessibilityRole="button" accessibilityLabel="غير مفيد" accessibilityState={{ selected: rating === false }} hitSlop={8}>
              <Icon name="ThumbsDown" size={20} color={rating === false ? 'gold' : 'textMuted'} />
            </Pressable>
            <Pressable onPress={toggleSave} accessibilityRole="button" accessibilityLabel={saved ? 'إزالة من المحفوظات' : 'حفظ'} hitSlop={8}>
              <Icon name={saved ? 'BookmarkCheck' : 'Bookmark'} size={20} color={saved ? 'gold' : 'textMuted'} />
            </Pressable>
          </Row>
        </Row>
        {rating !== undefined && (
          <AppText variant="caption" color="textMuted">
            شكراً، سجّلنا تقييمك.
          </AppText>
        )}
      </View>

      {[
        { title: 'مقاطع أخرى لهذا الدرس', from: 0, to: lessonVideos.length },
        { title: `من مقاطع ${subjectName}`, from: lessonVideos.length, to: videos.length },
      ].map((group) => {
        const items = videos.map((x, i) => ({ x, i })).filter(({ i }) => i >= group.from && i < group.to && i !== current);
        if (items.length === 0) return null;
        return (
        <View key={group.title} style={{ gap: spacing.sm }}>
          <AppText variant="overline" color="textMuted">
            {group.title}
          </AppText>
          {items.map(({ x, i }) => (
              <Card key={x.youtubeId} onPress={() => setCurrent(i)} style={styles.item}>
                <View style={[styles.thumb, { borderColor: colors.border }]}>
                  <Image source={{ uri: x.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  {!!x.durationSec && (
                    <View style={[styles.duration, { backgroundColor: colors.overlay }]}>
                      <AppText variant="overline" color="text">
                        {formatDuration(x.durationSec)}
                      </AppText>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="caption" numberOfLines={2}>
                    {x.title}
                  </AppText>
                  <AppText variant="overline" color="textMuted">
                    {x.channelName}
                  </AppText>
                </View>
              </Card>
          ))}
        </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  thumb: { width: 112, height: 63, borderRadius: radius.small, overflow: 'hidden', borderWidth: borderWidth.hairline },
  duration: { position: 'absolute', bottom: 4, end: 4, paddingHorizontal: 4, borderRadius: 4 },
});
