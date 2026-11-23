/**
 * فتح رابط خارجي بأمان:
 * 1) متصفح داخل التطبيق (expo-web-browser)
 * 2) إن فشل: متصفح الجهاز (Linking)
 * 3) إن فشل أيضاً: رسالة واضحة بدل الفشل الصامت
 */
import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking, Platform } from 'react-native';

export async function openExternal(url: string, colors?: { controls?: string; toolbar?: string }): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url, { controlsColor: colors?.controls, toolbarColor: colors?.toolbar });
    return;
  } catch {
    // ننتقل للخيار التالي
  }
  try {
    await Linking.openURL(url);
  } catch {
    const msg = 'تعذّر فتح الرابط. تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى.';
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('تعذّر الفتح', msg);
  }
}
