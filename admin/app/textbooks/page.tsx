'use client';

/** روابط الكتب الرسمية (روابط فقط — لا تُرفع ملفات PDF إلا بإذن رسمي مكتوب) */
import { useEffect, useState } from 'react';

import { GradeSubjectPicker } from '@/components/Pickers';
import { errorText, supabase } from '@/lib/supabase';

interface Book {
  id: string;
  subject_id: string;
  term: number | null;
  part: number | null;
  title: string;
  official_url: string;
  license_status: 'link_only' | 'permission_granted';
}

export default function TextbooksPage() {
  const [grade, setGrade] = useState(1);
  const [subject, setSubject] = useState('');
  const [rows, setRows] = useState<Book[]>([]);
  const [edit, setEdit] = useState<Record<string, Book>>({});
  const [msg, setMsg] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    let q = supabase.from('textbooks').select('id, subject_id, term, part, title, official_url, license_status').eq('grade_id', grade).order('sort');
    if (subject) q = q.eq('subject_id', subject);
    q.then(({ data, error }) => {
      if (!live) return;
      if (error) setMsg(errorText(error));
      setRows(data ?? []);
    });
    return () => {
      live = false;
    };
  }, [grade, subject, reload]);

  const save = async (b: Book) => {
    if (!/^https:\/\//.test(b.official_url)) return setMsg('الرابط يجب أن يبدأ بـ https://');
    const { error } = await supabase.from('textbooks').update({ title: b.title, official_url: b.official_url, term: b.term }).eq('id', b.id);
    setMsg(error ? errorText(error) : 'حُفظ');
    if (!error) setEdit(({ [b.id]: _, ...rest }) => rest);
    setReload((r) => r + 1);
  };

  return (
    <>
      <h1>الكتب</h1>
      <p className="sub">روابط صفحات الكتب في مكتبة المناهج بموقع الوزارة. التطبيق يفتح الرابط فقط ولا ينسخ أي نص.</p>
      <div className="filters">
        <GradeSubjectPicker grade={grade} subject={subject} onChange={(g, s) => (setGrade(g), setSubject(s))} />
        <span className="muted small">{rows.length} كتاباً</span>
        {msg && <span className="muted small">{msg}</span>}
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>العنوان</th>
              <th>الفصل</th>
              <th>الرابط</th>
              <th>الترخيص</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const e = edit[b.id];
              return (
                <tr key={b.id}>
                  <td>{e ? <input value={e.title} onChange={(ev) => setEdit({ ...edit, [b.id]: { ...e, title: ev.target.value } })} /> : b.title}</td>
                  <td>
                    {e ? (
                      <select value={e.term ?? ''} onChange={(ev) => setEdit({ ...edit, [b.id]: { ...e, term: ev.target.value ? Number(ev.target.value) : null } })}>
                        <option value="">السنة كاملة</option>
                        <option value="1">الأول</option>
                        <option value="2">الثاني</option>
                      </select>
                    ) : b.term ? (
                      b.term === 1 ? 'الأول' : 'الثاني'
                    ) : (
                      'السنة'
                    )}
                  </td>
                  <td className="ltr small" style={{ maxWidth: 280, wordBreak: 'break-all' }}>
                    {e ? (
                      <input className="ltr" style={{ width: '100%' }} value={e.official_url} onChange={(ev) => setEdit({ ...edit, [b.id]: { ...e, official_url: ev.target.value } })} />
                    ) : (
                      <a href={b.official_url} target="_blank" rel="noreferrer">
                        {b.official_url.replace(/^https:\/\//, '')}
                      </a>
                    )}
                  </td>
                  <td>
                    <span className="chip">{b.license_status === 'link_only' ? 'رابط فقط' : 'بإذن'}</span>
                  </td>
                  <td>
                    {e ? (
                      <div className="row">
                        <button className="primary" onClick={() => save(e)}>
                          حفظ
                        </button>
                        <button className="ghost" onClick={() => setEdit(({ [b.id]: _, ...rest }) => rest)}>
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button className="ghost" onClick={() => setEdit({ ...edit, [b.id]: b })}>
                        تعديل
                      </button>
                    )}
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
