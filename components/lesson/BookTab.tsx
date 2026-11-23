import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';

import { useParentalGate } from '@/components/ParentalGate';
import { AppText, Card, Chip, EmptyState, Icon, IconCircle, Row } from '@/components/ui';
import type { Textbook } from '@/lib/data/media';
import { spacing, useAppTheme } from '@/lib/theme';

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** نحذف من العنوان الصف والفصل (معروفان من سياق الدرس) لتبقى أسماء الكتب قصيرة وواضحة */
function shortTitle(title: string) {
  return title
    .split(' - ')
    .filter((p) => !/^الصف |^الفصل /.test(p.trim()))
    .join(' — ');
}

/** «افتح الكتاب»: يفتح صفحة الكتاب الرسمية في متصفح داخل التطبيق (روابط فقط، لا ملفات) */
export function BookTab({ books, termName }: { books: Textbook[]; termName: string }) {
  const { colors } = useAppTheme();
  const gate = useParentalGate();

  if (books.length === 0) {
    return <EmptyState icon="BookOpen" title="الكتاب المدرسي" message={`لم يُضف بعد رابط الكتاب الرسمي لهذه المادة (${termName}).`} />;
  }

  const open = (url: string) =>
    gate.request(() => {
      WebBrowser.openBrowserAsync(url, {
        controlsColor: colors.gold,
        toolbarColor: colors.background,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      }).catch(() => {});
    });

  return (
    <View style={{ gap: spacing.md }}>
      {gate.element}
      <Row gap={spacing.md}>
        <IconCircle name="BookOpen" size={44} />
        <View style={{ flex: 1 }}>
          <AppText variant="label">الكتب المدرسية · {termName}</AppText>
          <AppText variant="caption" color="textMuted">
            من المصدر الرسمي: {domainOf(books[0].officialUrl)}
          </AppText>
        </View>
      </Row>
      {books.map((b) => (
        <Card key={b.officialUrl} onPress={() => open(b.officialUrl)} accessibilityLabel={`افتح ${b.title}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="label" ltr={/^English/.test(b.title) ? false : undefined}>
              {shortTitle(b.title)}
            </AppText>
            <Chip label={b.licenseStatus === 'permission_granted' ? 'بإذن رسمي' : 'رابط رسمي'} icon="ShieldCheck" tone="gold" />
          </View>
          <Row gap={6}>
            <AppText variant="caption" color="goldText">
              افتح
            </AppText>
            <Icon name="ExternalLink" size={18} />
          </Row>
        </Card>
      ))}
      <AppText variant="caption" color="textMuted" center>
        تُفتح الكتب من موقعها الرسمي داخل التطبيق، ولا تُحفظ على الجهاز.
      </AppText>
    </View>
  );
}
