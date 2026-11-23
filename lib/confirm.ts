import { Alert, Platform } from 'react-native';

/** نافذة تأكيد بسيطة (تعمل على الجوال والويب) */
export function confirmAction(title: string, message: string, action: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: 'إلغاء', style: 'cancel' },
    { text: action, style: 'destructive', onPress: onOk },
  ]);
}
