'use client';

/**
 * مراجعة الأسئلة: لا يرى الطلاب إلا الأسئلة المعتمدة (reviewed = true).
 * يمكن اعتماد سؤال أو إلغاء اعتماده، وتعديل نصه وشرحه، أو اعتماد كل الأسئلة الظاهرة دفعة واحدة.
 */
import { useCallback, useEffect, useState } from 'react';

import { GradeSubjectPicker } from '@/components/Pickers';
import { errorText, supabase, TYPE_NAMES } from '@/lib/supabase';

interface Q {
  id: string;
  lesson_id: string;
  type: string;
  prompt: string;
  options: string[] | null;
  answer: unknown;
  explanation: string;
  difficulty: string;
  reviewed: boolean;
  lessons: { title: string } | null;
}

const PAGE = 50;

function answerText(q: Q): string {
  if (q.type === 'true_false') return q.answer ? 'صح' : 'خطأ';
  if (Array.isArray(q.answer)) return q.answer.join(' ');
  return String(q.answer);
}

export default function QuestionsPage() {
  const [grade, setGrade] = useState(1);
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState<'pending' | 'reviewed' | 'all'>('pending');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<Q[]>([]);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<Record<string, { prompt: string; explanation: string }>>({});
  const [msg, setMsg] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    let q = supabase
      .from('questions')
      .select('id, lesson_id, type, prompt, options, answer, explanation, difficulty, reviewed, lessons(title)', { count: 'exact' })
      .like('lesson_id', subject ? `${subject}-%` : `g${grade}-%`)
      .order('lesson_id')
      .order('id')
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (status !== 'all') q = q.eq('reviewed', status === 'reviewed');
    q.then(({ data, count, error }) => {
      if (!live) return;
      if (error) setMsg(errorText(error));
      setRows((data as unknown as Q[]) ?? []);
      setTotal(count ?? 0);
    });
    return () => {
      live = false;
    };
  }, [grade, subject, status, page, reload]);

  const refresh = useCallback(() => setReload((r) => r + 1), []);

  const setReviewed = async (ids: string[], reviewed: boolean) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('questions')
      .update({ reviewed, reviewed_at: reviewed ? new Date().toISOString() : null, reviewed_by: reviewed ? u.user?.id : null })
      .in('id', ids);
    setMsg(error ? errorText(error) : reviewed ? `اعتُمد ${ids.length} سؤالاً` : 'أُلغي الاعتماد');
    refresh();
  };

  const save = async (id: string) => {
    const e = editing[id];
    const { error } = await supabase.from('questions').update({ prompt: e.prompt, explanation: e.explanation }).eq('id', id);
    if (error) return setMsg(errorText(error));
    setEditing(({ [id]: _, ...rest }) => rest);
    setMsg('حُفظ التعديل');
    refresh();
  };

  return (
    <>
      <h1>الأسئلة</h1>
      <p className="sub">لا يظهر السؤال للطلاب حتى تعتمده. راجع الصياغة والإجابة والشرح.</p>
      <div className="filters">
        <GradeSubjectPicker
          grade={grade}
          subject={subject}
          onChange={(g, s) => {
            setGrade(g);
            setSubject(s);
            setPage(0);
          }}
        />
        <select value={status} onChange={(e) => (setStatus(e.target.value as typeof status), setPage(0))} aria-label="الحالة">
          <option value="pending">بانتظار المراجعة</option>
          <option value="reviewed">معتمدة</option>
          <option value="all">الكل</option>
        </select>
        <span className="muted small">{total} سؤالاً</span>
        {status === 'pending' && rows.length > 0 && (
          <button className="primary" onClick={() => setReviewed(rows.map((r) => r.id), true)}>
            اعتماد الأسئلة الظاهرة ({rows.length})
          </button>
        )}
        {msg && <span className="ok small">{msg}</span>}
      </div>

      <div className="stack">
        {rows.map((q) => {
          const e = editing[q.id];
          const ltr = q.lesson_id.includes('-english-');
          return (
            <div className="card stack" key={q.id}>
              <div className="row between">
                <span className="muted small">
                  {q.lessons?.title} · {TYPE_NAMES[q.type]} · {q.difficulty} · <span className="ltr">{q.id}</span>
                </span>
                <span className={`chip ${q.reviewed ? 'ok' : 'warn'}`}>{q.reviewed ? 'معتمد' : 'غير مراجَع'}</span>
              </div>
              {e ? (
                <>
                  <textarea className={ltr ? 'ltr' : ''} value={e.prompt} onChange={(ev) => setEditing({ ...editing, [q.id]: { ...e, prompt: ev.target.value } })} />
                  <textarea value={e.explanation} onChange={(ev) => setEditing({ ...editing, [q.id]: { ...e, explanation: ev.target.value } })} />
                </>
              ) : (
                <>
                  <div className={ltr ? 'ltr' : ''} style={{ fontSize: 17 }}>
                    {q.prompt}
                  </div>
                  {q.options && (
                    <ul className={`opts ${ltr ? 'ltr' : ''}`}>
                      {q.options.map((o) => (
                        <li key={o} className={o === q.answer ? 'right' : ''}>
                          {o}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div>
                    الإجابة: <strong className={ltr ? 'ltr' : ''}>{answerText(q)}</strong>
                  </div>
                  <div className="muted small">{q.explanation}</div>
                </>
              )}
              <div className="row">
                {e ? (
                  <>
                    <button className="primary" onClick={() => save(q.id)}>
                      حفظ
                    </button>
                    <button className="ghost" onClick={() => setEditing(({ [q.id]: _, ...rest }) => rest)}>
                      إلغاء
                    </button>
                  </>
                ) : (
                  <>
                    {q.reviewed ? (
                      <button className="danger" onClick={() => setReviewed([q.id], false)}>
                        إلغاء الاعتماد
                      </button>
                    ) : (
                      <button className="primary" onClick={() => setReviewed([q.id], true)}>
                        اعتماد
                      </button>
                    )}
                    <button className="ghost" onClick={() => setEditing({ ...editing, [q.id]: { prompt: q.prompt, explanation: q.explanation } })}>
                      تعديل النص
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="card muted">لا توجد أسئلة بهذا التصفية.</div>}
      </div>

      {total > PAGE && (
        <div className="row" style={{ marginTop: 16 }}>
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            السابق
          </button>
          <span className="muted small">
            صفحة {page + 1} من {Math.ceil(total / PAGE)}
          </span>
          <button disabled={(page + 1) * PAGE >= total} onClick={() => setPage(page + 1)}>
            التالي
          </button>
        </div>
      )}
    </>
  );
}
