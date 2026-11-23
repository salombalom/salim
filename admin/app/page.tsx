'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

type Counts = Record<string, number | null>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function count(table: string, filter?: (q: any) => any): Promise<number | null> {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  return error ? null : count;
}

export default function Dashboard() {
  const [c, setC] = useState<Counts>({});
  const [lastRun, setLastRun] = useState<{ started_at: string; new_videos: number; suggested: number; quota_units: number; error: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const entries = await Promise.all([
        ['lessons', count('lessons')],
        ['questions', count('questions')],
        ['reviewed', count('questions', (q) => q.eq('reviewed', true))],
        ['pendingVideos', count('videos', (q) => q.eq('status', 'pending'))],
        ['approvedVideos', count('videos', (q) => q.eq('status', 'approved'))],
        ['drafts', count('summaries', (q) => q.eq('status', 'draft'))],
        ['approvedSummaries', count('summaries', (q) => q.eq('status', 'approved'))],
        ['textbooks', count('textbooks')],
        ['students', count('profiles', (q) => q.eq('role', 'student'))],
      ].map(async ([k, p]) => [k, await p] as const));
      setC(Object.fromEntries(entries));
      const { data } = await supabase.from('video_fetch_runs').select('*').order('started_at', { ascending: false }).limit(1).maybeSingle();
      setLastRun(data);
    })();
  }, []);

  const n = (k: string) => (c[k] === undefined ? '…' : c[k] === null ? '—' : c[k]!.toLocaleString('ar-OM'));
  const tiles: { label: string; value: string; href?: string; note?: string }[] = [
    { label: 'أسئلة معتمدة', value: `${n('reviewed')} / ${n('questions')}`, href: '/questions/' },
    { label: 'ملخصات بانتظار الاعتماد', value: n('drafts'), href: '/summaries/', note: `${n('approvedSummaries')} معتمد من ${n('lessons')} درساً` },
    { label: 'فيديوهات بانتظار المراجعة', value: n('pendingVideos'), href: '/videos/', note: `${n('approvedVideos')} معتمد` },
    { label: 'روابط الكتب', value: n('textbooks'), href: '/textbooks/' },
    { label: 'الطلاب المسجّلون', value: n('students') },
  ];

  return (
    <>
      <h1>الرئيسية</h1>
      <p className="sub">ما ينتظر المراجعة قبل أن يظهر للطلاب.</p>
      <div className="grid">
        {tiles.map((t) => {
          const body = (
            <div className="card stat" key={t.label}>
              <div className="num">{t.value}</div>
              <div className="label">{t.label}</div>
              {t.note && <div className="muted small">{t.note}</div>}
            </div>
          );
          return t.href ? (
            <Link key={t.label} href={t.href} style={{ color: 'inherit' }}>
              {body}
            </Link>
          ) : (
            body
          );
        })}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h2>آخر جلب للفيديوهات</h2>
        {lastRun ? (
          <p className="muted">
            {new Date(lastRun.started_at).toLocaleString('ar-OM')} · {lastRun.new_videos} فيديو جديد · {lastRun.suggested} مقترح · {lastRun.quota_units} وحدة من حصة YouTube
            {lastRun.error && <span className="error"> · خطأ: {lastRun.error}</span>}
          </p>
        ) : (
          <p className="muted">لم يعمل الجلب اليومي بعد.</p>
        )}
      </div>
    </>
  );
}
