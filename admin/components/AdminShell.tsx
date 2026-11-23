'use client';

/**
 * بوابة الدخول: تسجيل الدخول برمز يصل إلى البريد، ثم التحقق من is_admin().
 * غير المشرف لا يرى شيئاً — وحتى لو تجاوز الواجهة فقاعدة البيانات ترفض (RLS).
 */
import type { Session } from '@supabase/supabase-js';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { configured, errorText, supabase } from '@/lib/supabase';

const NAV = [
  { href: '/', label: 'الرئيسية' },
  { href: '/questions/', label: 'الأسئلة' },
  { href: '/summaries/', label: 'الملخصات' },
  { href: '/videos/', label: 'الفيديوهات' },
  { href: '/textbooks/', label: 'الكتب' },
  { href: '/channels/', label: 'القنوات' },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const path = usePathname();

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    let live = true;
    supabase.rpc('is_admin').then(({ data }) => live && setAdmin(data === true));
    return () => {
      live = false;
    };
  }, [session]);

  if (!configured)
    return (
      <div className="center">
        <div className="card stack" style={{ maxWidth: 480 }}>
          <h2>اللوحة غير مهيأة</h2>
          <p className="muted">أنشئ الملف admin/.env.local وفيه NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY (انظر admin/README.md).</p>
        </div>
      </div>
    );
  if (session === undefined || (session && admin === null)) return <div className="center muted">جارٍ التحميل…</div>;
  if (!session) return <Login />;
  if (!admin)
    return (
      <div className="center">
        <div className="card stack" style={{ maxWidth: 480 }}>
          <h2>لا تملك صلاحية المشرف</h2>
          <p className="muted">
            حسابك ({session.user.email}) غير مضاف إلى جدول المشرفين. أضفه من SQL Editor في Supabase:
          </p>
          <code className="ltr small">insert into public.admins (user_id) values (&apos;{session.user.id}&apos;);</code>
          <button onClick={() => supabase.auth.signOut()}>تسجيل الخروج</button>
        </div>
      </div>
    );

  return (
    <div className="shell">
      <nav className="side">
        <div className="brand">دَرْسي</div>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={path === n.href || (n.href !== '/' && path?.startsWith(n.href)) ? 'on' : ''}>
            {n.label}
          </Link>
        ))}
        <div className="spacer" />
        <span className="muted small">{session.user.email}</span>
        <button className="ghost" onClick={() => supabase.auth.signOut()}>
          تسجيل الخروج
        </button>
      </nav>
      <main>{children}</main>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: false } });
    setBusy(false);
    if (error) setError(errorText(error));
    else setSent(true);
  };
  const verify = async () => {
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) setError('الرمز غير صحيح أو منتهي.');
  };

  return (
    <div className="center">
      <div className="card stack" style={{ width: 380 }}>
        <div className="brand" style={{ padding: 0, margin: 0 }}>
          دَرْسي
        </div>
        <h2>لوحة الإدارة</h2>
        {!sent ? (
          <>
            <input className="ltr" type="email" placeholder="البريد الإلكتروني للمشرف" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            <button className="primary" onClick={send} disabled={busy || !email.includes('@')}>
              أرسل رمز الدخول
            </button>
          </>
        ) : (
          <>
            <p className="muted small">أرسلنا رمزاً من 6 أرقام إلى {email}.</p>
            <input className="ltr num" inputMode="numeric" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus />
            <button className="primary" onClick={verify} disabled={busy || code.length !== 6}>
              دخول
            </button>
            <button className="ghost" onClick={() => setSent(false)}>
              تغيير البريد
            </button>
          </>
        )}
        {error && <p className="error small">{error}</p>}
      </div>
    </div>
  );
}
