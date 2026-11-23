'use client';

/**
 * ملخصات الدروس: توليد مسودة بـ Claude (عبر Edge Function «generate-summary»، المفتاح في الخادم فقط)،
 * ثم مراجعتها وتعديلها، ثم اعتمادها لتظهر للطلاب.
 */
import { useEffect, useState } from 'react';

import { GradeSubjectPicker } from '@/components/Pickers';
import { errorText, supabase } from '@/lib/supabase';

interface Content {
  overview: string;
  concepts: string[];
  definitions: { term: string; meaning: string }[];
  example?: string;
  review: string[];
}
interface Lesson {
  id: string;
  title: string;
  summaries: { status: 'draft' | 'approved'; content: Content; model: string | null; updated_at: string }[] | { status: 'draft' | 'approved'; content: Content; model: string | null; updated_at: string } | null;
}

const one = (s: Lesson['summaries']) => (Array.isArray(s) ? s[0] : s) ?? null;
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

function toForm(c: Content) {
  return {
    overview: c.overview,
    concepts: c.concepts.join('\n'),
    definitions: c.definitions.map((d) => `${d.term}: ${d.meaning}`).join('\n'),
    example: c.example ?? '',
    review: c.review.join('\n'),
  };
}
function fromForm(f: ReturnType<typeof toForm>): Content {
  return {
    overview: f.overview.trim(),
    concepts: lines(f.concepts),
    definitions: lines(f.definitions)
      .map((l) => {
        const i = l.indexOf(':');
        return i > 0 ? { term: l.slice(0, i).trim(), meaning: l.slice(i + 1).trim() } : null;
      })
      .filter((d): d is { term: string; meaning: string } => !!d),
    ...(f.example.trim() ? { example: f.example.trim() } : {}),
    review: lines(f.review),
  };
}

export default function SummariesPage() {
  const [grade, setGrade] = useState(1);
  const [subject, setSubject] = useState('');
  const [rows, setRows] = useState<Lesson[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState<ReturnType<typeof toForm> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    supabase
      .from('lessons')
      .select('id, title, summaries(status, content, model, updated_at)')
      .like('id', subject ? `${subject}-%` : `g${grade}-%`)
      .order('id')
      .then(({ data, error }) => {
        if (!live) return;
        if (error) setMsg(errorText(error));
        setRows((data as unknown as Lesson[]) ?? []);
      });
    return () => {
      live = false;
    };
  }, [grade, subject, reload]);

  const generate = async (ids: string[], force = false) => {
    setBusy(ids.length === 1 ? ids[0] : 'all');
    setMsg('جارٍ التوليد… قد يستغرق ذلك دقيقة.');
    let ok = 0;
    const errors: string[] = [];
    for (let i = 0; i < ids.length; i += 5) {
      const { data, error } = await supabase.functions.invoke('generate-summary', { body: { lessonIds: ids.slice(i, i + 5), force } });
      if (error) {
        errors.push(errorText(error));
        break;
      }
      for (const r of data.results as { status: string; error?: string; lessonId: string }[]) {
        if (r.status === 'generated') ok++;
        else if (r.status === 'error') errors.push(`${r.lessonId}: ${r.error}`);
      }
    }
    setBusy(null);
    setMsg(`وُلّد ${ok} ملخصاً${errors.length ? ` · أخطاء: ${errors.slice(0, 3).join(' | ')}` : ''}`);
    setReload((r) => r + 1);
  };

  const setStatus = async (id: string, status: 'draft' | 'approved') => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('summaries')
      .update({ status, approved_by: status === 'approved' ? u.user?.id : null, approved_at: status === 'approved' ? new Date().toISOString() : null })
      .eq('lesson_id', id);
    setMsg(error ? errorText(error) : status === 'approved' ? 'اعتُمد الملخص' : 'أعيد إلى مسودة');
    setReload((r) => r + 1);
  };

  const save = async (id: string) => {
    if (!form) return;
    const content = fromForm(form);
    if (!content.overview || content.concepts.length < 2 || content.review.length < 1) return setMsg('الملخص يحتاج نبذة، وفكرتين على الأقل، وسؤال مراجعة واحداً على الأقل.');
    const { error } = await supabase.from('summaries').update({ content, updated_at: new Date().toISOString() }).eq('lesson_id', id);
    setMsg(error ? errorText(error) : 'حُفظ التعديل');
    if (!error) setOpen(null);
    setReload((r) => r + 1);
  };

  const missing = rows.filter((r) => !one(r.summaries)).map((r) => r.id);

  return (
    <>
      <h1>الملخصات</h1>
      <p className="sub">يولّدها Claude مسوّدة، ولا تظهر للطلاب إلا بعد اعتمادك. يحتاج التوليد السر ANTHROPIC_API_KEY في Supabase.</p>
      <div className="filters">
        <GradeSubjectPicker grade={grade} subject={subject} onChange={(g, s) => (setGrade(g), setSubject(s))} />
        <button className="primary" disabled={!!busy || missing.length === 0} onClick={() => generate(missing)}>
          توليد الناقص ({missing.length})
        </button>
        {msg && <span className="muted small">{msg}</span>}
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>الدرس</th>
              <th>الحالة</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const s = one(l.summaries);
              const isOpen = open === l.id;
              return (
                <tr key={l.id}>
                  <td style={{ width: '45%' }}>
                    <div>{l.title}</div>
                    <div className="muted small ltr">{l.id}</div>
                    {isOpen && s && form && (
                      <div className="stack" style={{ marginTop: 12 }}>
                        <label className="small muted">نبذة</label>
                        <textarea value={form.overview} onChange={(e) => setForm({ ...form, overview: e.target.value })} />
                        <label className="small muted">أهم الأفكار (سطر لكل فكرة)</label>
                        <textarea value={form.concepts} onChange={(e) => setForm({ ...form, concepts: e.target.value })} style={{ minHeight: 120 }} />
                        <label className="small muted">المصطلحات (المصطلح: المعنى، سطر لكل مصطلح)</label>
                        <textarea value={form.definitions} onChange={(e) => setForm({ ...form, definitions: e.target.value })} />
                        <label className="small muted">مثال (اختياري)</label>
                        <textarea value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} />
                        <label className="small muted">راجع نفسك (سطر لكل سؤال)</label>
                        <textarea value={form.review} onChange={(e) => setForm({ ...form, review: e.target.value })} />
                        <div className="row">
                          <button className="primary" onClick={() => save(l.id)}>
                            حفظ
                          </button>
                          <button className="ghost" onClick={() => setOpen(null)}>
                            إغلاق
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td>
                    {s ? <span className={`chip ${s.status === 'approved' ? 'ok' : 'warn'}`}>{s.status === 'approved' ? 'معتمد' : 'مسودة'}</span> : <span className="chip">لا يوجد</span>}
                    {s && <div className="muted small">{new Date(s.updated_at).toLocaleDateString('ar-OM')}</div>}
                  </td>
                  <td>
                    <div className="row">
                      {s && !isOpen && (
                        <button
                          className="ghost"
                          onClick={() => {
                            setOpen(l.id);
                            setForm(toForm(s.content));
                          }}>
                          مراجعة وتعديل
                        </button>
                      )}
                      {s?.status === 'draft' && (
                        <button className="primary" onClick={() => setStatus(l.id, 'approved')}>
                          اعتماد
                        </button>
                      )}
                      {s?.status === 'approved' && (
                        <button className="danger" onClick={() => setStatus(l.id, 'draft')}>
                          إلغاء الاعتماد
                        </button>
                      )}
                      <button
                        disabled={!!busy}
                        onClick={() => {
                          if (s?.status === 'approved' && !window.confirm('إعادة التوليد تستبدل الملخص المعتمد بمسودة جديدة. متابعة؟')) return;
                          generate([l.id], !!s);
                        }}>
                        {busy === l.id ? 'جارٍ…' : s ? 'إعادة التوليد' : 'توليد'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
