import { useState } from 'react';
import { Pressable } from 'react-native';

import { AppText, Card, EmptyState, Icon, Row, Screen, Segmented } from '@/components/ui';
import { useProgress } from '@/lib/store';

export default function FavoritesScreen() {
  const [tab, setTab] = useState<'video' | 'summary'>('video');
  const { favorites, toggleFavorite } = useProgress();
  const items = favorites.filter((f) => f.type === tab);

  return (
    <Screen>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'video', label: 'الفيديوهات', icon: 'play-circle-outline' },
          { value: 'summary', label: 'الملخصات', icon: 'text-box-outline' },
        ]}
      />
      {items.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title={tab === 'video' ? 'لا توجد فيديوهات محفوظة' : 'لا توجد ملخصات محفوظة'}
          message="اضغط على رمز القلب في الدرس لحفظه هنا."
        />
      ) : (
        items.map((f) => (
          <Card key={f.id}>
            <Row>
              <AppText variant="label" style={{ flex: 1 }}>
                {f.title}
              </AppText>
              <Pressable onPress={() => toggleFavorite(f)} accessibilityLabel="إزالة من المفضلة" hitSlop={10}>
                <Icon name="heart" color="accent" />
              </Pressable>
            </Row>
            {f.subtitle && (
              <AppText variant="caption" color="textMuted">
                {f.subtitle}
              </AppText>
            )}
          </Card>
        ))
      )}
    </Screen>
  );
}
