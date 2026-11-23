import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';

import { useParentalGate } from '@/components/ParentalGate';
import { AppText, Button, Card, Chip, EmptyState, IconCircle } from '@/components/ui';
import type { Textbook } from '@/lib/data/media';
import { spacing, useAppTheme } from '@/lib/theme';

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** زر «افتح الكتاب»: يفتح الرابط الرسمي في متصفح داخل التطبيق (لا نرفع ملفات الكتب) */
export function BookTab({ book, termName }: { book: Textbook | null; termName: string }) {
  const { colors } = useAppTheme();
  const gate = useParentalGate();

  if (!book) {
    return <EmptyState icon="BookOpen" title="الكتاب المدرسي" message={`لم يُضف بعد رابط الكتاب الرسمي لهذه المادة (${termName}).`} />;
  }

  const open = () =>
    gate.request(() => {
      WebBrowser.openBrowserAsync(book.officialUrl, {
        controlsColor: colors.gold,
        toolbarColor: colors.background,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      }).catch(() => {});
    });

  return (
    <Card style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxl }}>
      {gate.element}
      <IconCircle name="BookOpen" size={64} />
      <View style={{ gap: spacing.xs, alignItems: 'center' }}>
        <AppText variant="h2" center>
          {book.title}
        </AppText>
        <AppText variant="caption" color="textMuted" center>
          من المصدر الرسمي: {domainOf(book.officialUrl)}
        </AppText>
      </View>
      <Chip label={book.licenseStatus === 'permission_granted' ? 'بإذن رسمي' : 'رابط رسمي'} icon="ShieldCheck" tone="gold" />
      <Button title="افتح الكتاب" icon="ExternalLink" onPress={open} style={{ alignSelf: 'stretch' }} />
      <AppText variant="caption" color="textMuted" center>
        يُفتح الكتاب من موقعه الرسمي داخل التطبيق، ولا يُحفظ على الجهاز.
      </AppText>
    </Card>
  );
}
