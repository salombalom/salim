/**
 * فرض اتجاه الواجهة من اليمين إلى اليسار (RTL).
 *
 * - في نسخ المتجر: يُفعَّل تلقائياً عبر إعداد expo-localization (forcesRTL) في app.json.
 * - في Expo Go: نستخدم I18nManager.forceRTL ثم نعيد تحميل التطبيق مرة واحدة فقط.
 * - على الويب: نضبط dir="rtl" على صفحة HTML.
 */
import * as Updates from 'expo-updates';
import { DevSettings, I18nManager, Platform } from 'react-native';

export function ensureRTL() {
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    }
    return;
  }
  if (I18nManager.isRTL) return;
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  // نحتاج إعادة تحميل حتى يطبّق النظام الاتجاه الجديد
  Updates.reloadAsync().catch(() => {
    if (__DEV__) DevSettings.reload();
  });
}
