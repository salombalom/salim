/**
 * تسجيل الدخول برمز يُرسل إلى البريد الإلكتروني أو رقم الهاتف (Supabase Auth OTP).
 */
import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { useSettings } from '@/lib/store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { afterSignIn, clearLocalAccountData, flushPending, pullFromServer } from '@/lib/sync';

export type AuthTarget = { kind: 'email'; value: string } | { kind: 'phone'; value: string };

interface AuthState {
  status: 'loading' | 'signedOut' | 'signedIn';
  session: Session | null;
}

export const useAuth = create<AuthState>()(() => ({
  status: isSupabaseConfigured ? 'loading' : 'signedOut',
  session: null,
}));

export const isSignedIn = () => useAuth.getState().status === 'signedIn';
export const currentUserId = () => useAuth.getState().session?.user.id ?? null;

let initialized = false;

/** يُستدعى مرة واحدة عند تشغيل التطبيق */
export function initAuth() {
  if (initialized || !supabase) return;
  initialized = true;
  supabase.auth.getSession().then(({ data }) => {
    useAuth.setState({ session: data.session, status: data.session ? 'signedIn' : 'signedOut' });
    if (data.session) {
      // مزامنة في الخلفية عند فتح التطبيق
      flushPending().finally(() => pullFromServer().catch(() => {}));
    }
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuth.setState({ session, status: session ? 'signedIn' : 'signedOut' });
  });
}

/* ───────────── أدوات الإدخال ───────────── */

export function normalizeEmail(input: string): string | null {
  const v = input.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? v : null;
}

/** يقبل الأرقام العُمانية (8 أرقام تبدأ بـ 7 أو 9) أو رقماً دولياً يبدأ بـ + */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[\s\-()]/g, '');
  if (/^[79]\d{7}$/.test(digits)) return `+968${digits}`;
  if (/^00\d{8,15}$/.test(digits)) return `+${digits.slice(2)}`;
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  if (/^968[79]\d{7}$/.test(digits)) return `+${digits}`;
  return null;
}

/* ───────────── العمليات ───────────── */

function authError(e: { message?: string; status?: number } | null): string {
  const m = e?.message ?? '';
  if (/rate limit|security purposes|seconds/i.test(m)) return 'طلبت رمزاً قبل قليل. انتظر دقيقة ثم حاول مرة أخرى.';
  if (/expired|invalid|token/i.test(m)) return 'الرمز غير صحيح أو انتهت صلاحيته.';
  if (/sms|phone provider|unsupported phone/i.test(m)) return 'الدخول برقم الهاتف غير مفعّل بعد. استخدم البريد الإلكتروني.';
  if (/network|fetch/i.test(m)) return 'تعذّر الاتصال. تحقق من الإنترنت ثم حاول مرة أخرى.';
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}

export async function sendCode(target: AuthTarget): Promise<string | null> {
  if (!supabase) return 'لم يُربط التطبيق بـ Supabase بعد.';
  const s = useSettings.getState();
  // تُحفظ هذه القيم في الملف الشخصي عند إنشاء حساب جديد
  const data = { role: s.role ?? 'student', grade: s.grade ? String(s.grade) : undefined, display_name: s.displayName || undefined };
  const { error } =
    target.kind === 'email'
      ? await supabase.auth.signInWithOtp({ email: target.value, options: { shouldCreateUser: true, data } })
      : await supabase.auth.signInWithOtp({ phone: target.value, options: { shouldCreateUser: true, data } });
  return error ? authError(error) : null;
}

export async function verifyCode(target: AuthTarget, token: string): Promise<string | null> {
  if (!supabase) return 'لم يُربط التطبيق بـ Supabase بعد.';
  const { data, error } =
    target.kind === 'email'
      ? await supabase.auth.verifyOtp({ email: target.value, token, type: 'email' })
      : await supabase.auth.verifyOtp({ phone: target.value, token, type: 'sms' });
  if (error || !data.session) return authError(error);
  useAuth.setState({ session: data.session, status: 'signedIn' });
  await afterSignIn();
  return null;
}

export async function signOut() {
  await flushPending().catch(() => {});
  await supabase?.auth.signOut();
  clearLocalAccountData();
  useAuth.setState({ session: null, status: 'signedOut' });
}

/** حذف الحساب نهائياً مع كل بياناته */
export async function deleteAccount(): Promise<string | null> {
  if (!supabase) return null;
  const { error } = await supabase.rpc('delete_my_account');
  if (error) return 'تعذّر حذف الحساب. حاول مرة أخرى.';
  await supabase.auth.signOut();
  clearLocalAccountData();
  useAuth.setState({ session: null, status: 'signedOut' });
  return null;
}
