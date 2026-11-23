import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const configured = Boolean(url && key);

export const supabase: SupabaseClient = configured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'darsi-admin' } })
  : (null as unknown as SupabaseClient);

export const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

export const SUBJECT_NAMES: Record<string, string> = {
  islamic: 'التربية الإسلامية',
  arabic: 'اللغة العربية',
  math: 'الرياضيات',
  science: 'العلوم',
  english: 'اللغة الإنجليزية',
  social: 'الدراسات الاجتماعية',
  physics: 'الفيزياء',
  chemistry: 'الكيمياء',
  biology: 'الأحياء',
  national: 'هذا وطني',
};

export const TYPE_NAMES: Record<string, string> = {
  mcq: 'اختيار من متعدد',
  true_false: 'صح أو خطأ',
  fill_blank: 'أكمل الفراغ',
  word_order: 'ترتيب كلمات',
};

export function errorText(e: unknown): string {
  if (!e) return '';
  if (typeof e === 'object' && e && 'message' in e) return String((e as { message: string }).message);
  return String(e);
}
