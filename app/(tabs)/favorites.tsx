import { useState } from 'react';
import { Pressable, View } from 'react-native';

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
          { value: 'video', label: 'مقاطع الشرح' },
          { value: 'summary', label: 'الملخصات' },
        ]}
      />
      {items.length === 0 ? (
        <EmptyState
          icon="Bookmark"
          title={tab === 'video' ? 'لا توجد مقاطع محفوظة' : 'لا توجد ملخصات محفوظة'}
          message="احفظ ما تحتاج الرجوع إليه من داخل الدرس، وستجده هنا."
        />
      ) : (
        items.map((f) => (
          <Card key={f.id}>
            <Row>
              <View style={{ flex: 1 }}>
                <AppText variant="label">{f.title}</AppText>
                {f.subtitle && (
                  <AppText variant="caption" color="textMuted">
                    {f.subtitle}
                  </AppText>
                )}
              </View>
              <Pressable onPress={() => toggleFavorite(f)} accessibilityLabel="إزالة من المحفوظات" hitSlop={10}>
                <Icon name="Bookmark" />
              </Pressable>
            </Row>
          </Card>
        ))
      )}
    </Screen>
  );
}
