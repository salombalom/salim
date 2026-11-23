/**
 * اتصال Supabase. المفاتيح تُقرأ من .env (EXPO_PUBLIC_SUPABASE_URL و EXPO_PUBLIC_SUPABASE_ANON_KEY).
 * المفتاح «anon» عام بطبيعته ومحمي بسياسات RLS في قاعدة البيانات.
 * إذا لم تُضبط المفاتيح يعمل التطبيق في «وضع التجربة» فقط.
 */
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// تحديث الجلسة تلقائياً فقط عندما يكون التطبيق في المقدمة
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
