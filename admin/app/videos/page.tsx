'use client';

/**
 * مراجعة الفيديوهات التي جلبتها الدالة اليومية: اعتمادها على درس محدد أو على مستوى المادة، أو رفضها.
 * لا تُحمَّل الفيديوهات ولا تُرفع؛ تُعرض من مشغّل YouTube الرسمي فقط.
 */
import { useEffect, useMemo, useState } from 'react';

import { errorText, GRADES, SUBJECT_NAMES, supabase } from '@/lib/supabase';

interface Video {
  id: string;
  youtube_id: string;
  title: string;
  thumbnail_url: string | null;
  duration_sec: number | null;
  published_at: string | null;
  suggested_lesson_id: string | null;
  lesson_id: string | null;
  subject_id: string | null;
  match_score: number | null;
  status: 'pending' | 'approved' | 'rejected';
  channels: { name: string } | null;
}
interface LessonRef {
  id: string;
  title: string;
}

const subjectOf = (lessonId: string | null) => lessonId?.replace(/-u\d+-l\d+$/, '') ?? '';
const fmt = (s: number | null) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '');

export default function VideosPage() {
  const [status, setStatus] = useState<Video['status']>('pending');
  const [rows, setRows] = useState<Video[]>([]);
  const [lessons, setLessons] = useState<LessonRef[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; key: string; grade_id: number }[]>([]);
  const [choice, setChoice] = useState<Record<string, { subject: string; lesson: string }>>({});
  const [msg, setMsg] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    supabase
      .from('subjects')
      .select('id, key, grade_id')
      .order('grade_id')
      .order('sort')
      .then(({ data }) => setSubjects(data ?? []));
    supabase
      .from('lessons')
      .select('id, title')
      .order('id')
      .then(({ data }) => setLessons(data ?? []));
  }, []);

  useEffect(() => {
    let live = true;
    supabase
      .from('videos')
      .select('id, youtube_id, title, thumbnail_url, duration_sec, published_at, suggested_lesson_id, lesson_id, subject_id, match_score, status, channels(name)')
      .eq('status', status)
      .order('published_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!live) return;
        if (error) setMsg(errorText(error));
        setRows((data as unknown as Video[]) ?? []);
      });
    return () => {
      live = false;
    };
  }, [status, reload]);

  const lessonTitle = useMemo(() => new Map(lessons.map((l) => [l.id, l.title])), [lessons]);

  const current = (v: Video) =>
    choice[v.id] ?? { subject: v.subject_id ?? subjectOf(v.lesson_id ?? v.suggested_lesson_id), lesson: v.lesson_id ?? v.suggested_lesson_id ?? '' };

  const approve = async (v: Video) => {
    const c = current(v);
    if (!c.subject) return setMsg('اختر المادة أولاً.');
    let error;
    if (c.lesson) {
      ({ error } = await supabase.rpc('review_video', { p_video_id: v.id, p_status: 'approved', p_lesson_id: c.lesson }));
    } else {
      // على مستوى المادة: يظهر في «من مقاطع المادة» لكل دروسها
      const { data: u } = await supabase.auth.getUser();
      ({ error } = await supabase
        .from('videos')
        .update({ status: 'approved', subject_id: c.subject, lesson_id: null, reviewed_by: u.user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', v.id));
    }
    setMsg(error ? errorText(error) : 'اعتُمد الفيديو');
    setReload((r) => r + 1);
  };

  const reject = async (v: Video) => {
    const { error } = await supabase.rpc('review_video', { p_video_id: v.id, p_status: 'rejected' });
    setMsg(error ? errorText(error) : 'رُفض الفيديو');
    setReload((r) => r + 1);
  };

  return (
    <>
      <h1>الفيديوهات</h1>
      <p className="sub">تجلبها الدالة اليومية من القنوات المعتمدة وتقترح لها درساً. راجع الاقتراح ثم اعتمد أو ارفض.</p>
      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value as Video['status'])} aria-label="الحالة">
          <option value="pending">بانتظار المراجعة</option>
          <option value="approved">معتمدة</option>
          <option value="rejected">مرفوضة</option>
        </select>
        <span className="muted small">{rows.length} فيديو</span>
        {msg && <span className="muted small">{msg}</span>}
      </div>
      <div className="stack">
        {rows.map((v) => {
          const c = current(v);
          const subjectLessons = lessons.filter((l) => c.subject && l.id.startsWith(`${c.subject}-`));
          return (
            <div className="card row" key={v.id} style={{ alignItems: 'flex-start', gap: 16 }}>
              <a href={`https://www.youtube.com/watch?v=${v.youtube_id}`} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumbnail_url ?? `https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg`} alt="" width={200} height={112} style={{ borderRadius: 12, objectFit: 'cover' }} />
              </a>
              <div className="stack" style={{ flex: 1, minWidth: 260, gap: 8 }}>
                <strong>{v.title}</strong>
                <span className="muted small">
                  {v.channels?.name} · {fmt(v.duration_sec)} {v.published_at && `· ${new Date(v.published_at).toLocaleDateString('ar-OM')}`}
                </span>
                {v.suggested_lesson_id && (
                  <span className="small">
                    الاقتراح: {lessonTitle.get(v.suggested_lesson_id) ?? v.suggested_lesson_id}{' '}
                    {v.match_score != null && <span className="chip warn">ثقة {Math.round(v.match_score * 100)}%</span>}
                  </span>
                )}
                <div className="row">
                  <select value={c.subject} onChange={(e) => setChoice({ ...choice, [v.id]: { subject: e.target.value, lesson: '' } })} aria-label="المادة">
                    <option value="">اختر المادة</option>
                    {GRADES.map((g) => (
                      <optgroup key={g} label={`الصف ${g}`}>
                        {subjects
                          .filter((s) => s.grade_id === g)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {SUBJECT_NAMES[s.key]} — الصف {g}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                  <select value={c.lesson} onChange={(e) => setChoice({ ...choice, [v.id]: { ...c, lesson: e.target.value } })} aria-label="الدرس">
                    <option value="">على مستوى المادة (كل الدروس)</option>
                    {subjectLessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="row">
                  {v.status !== 'approved' && (
                    <button className="primary" onClick={() => approve(v)}>
                      اعتماد
                    </button>
                  )}
                  {v.status === 'approved' && (
                    <button onClick={() => approve(v)}>حفظ الربط</button>
                  )}
                  {v.status !== 'rejected' && (
                    <button className="danger" onClick={() => reject(v)}>
                      رفض
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="card muted">لا توجد فيديوهات بهذه الحالة.</div>}
      </div>
    </>
  );
}
