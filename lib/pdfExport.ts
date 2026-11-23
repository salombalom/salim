/**
 * تصدير HTML إلى PDF ومشاركته (expo-print + expo-sharing).
 * على الويب نفتح نافذة الطباعة، ومنها «حفظ كـ PDF».
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/** يحوّل HTML إلى PDF ويفتح نافذة المشاركة. يرجع false إن لم تتوفر المشاركة. */
export async function exportPdf(html: string, dialogTitle: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return true;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) {
    await Print.printAsync({ uri });
    return true;
  }
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle });
  return true;
}
