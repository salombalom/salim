'use client';

/** القنوات التعليمية المعتمدة: الدالة اليومية تجلب فيديوهات القنوات المفعّلة فقط */
import { useEffect, useState } from 'react';

import { errorText, supabase } from '@/lib/supabase';

interface Channel {
  id: string;
  name: string;
  url: string;
  handle: string | null;
  youtube_channel_id: string | null;
  active: boolean;
  last_fetched_at: string | null;
}

export default function ChannelsPage() {
  const [rows, setRows] = useState<Channel[]>([]);
  const [form, setForm] = useState({ name: '', handle: '', channelId: '' });
  const [msg, setMsg] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    supabase
      .from('channels')
      .select('id, name, url, handle, youtube_channel_id, active, last_fetched_at')
      .order('created_at')
      .then(({ data, error }) => {
        if (!live) return;
        if (error) setMsg(errorText(error));
        setRows(data ?? []);
      });
    return () => {
      live = false;
    };
  }, [reload]);

  const toggle = async (c: Channel) => {
    const { error } = await supabase.from('channels').update({ active: !c.active }).eq('id', c.id);
    setMsg(error ? errorText(error) : c.active ? 'أُوقفت القناة' : 'فُعّلت القناة');
    setReload((r) => r + 1);
  };

  const add = async () => {
    const handle = form.handle.trim().replace(/^@/, '') || null;
    const channelId = form.channelId.trim() || null;
    if (!form.name.trim() || (!handle && !channelId)) return setMsg('أدخل اسم القناة والمعرّف (@handle) أو Channel ID.');
    if (channelId && !/^UC[\w-]{22}$/.test(channelId)) return setMsg('Channel ID يبدأ بـ UC ويتكون من 24 خانة.');
    const url = handle ? `https://www.youtube.com/@${handle}` : `https://www.youtube.com/channel/${channelId}`;
    const { error } = await supabase.from('channels').insert({ name: form.name.trim(), handle, youtube_channel_id: channelId, url, active: true });
    setMsg(error ? errorText(error) : 'أُضيفت القناة. ستُجلب فيديوهاتها في التشغيل اليومي القادم.');
    if (!error) setForm({ name: '', handle: '', channelId: '' });
    setReload((r) => r + 1);
  };

  return (
    <>
      <h1>القنوات</h1>
      <p className="sub">أضف قنوات تعليمية موثوقة فقط. كل فيديو جديد يمر بالمراجعة قبل ظهوره.</p>
      <div className="card stack" style={{ marginBottom: 16 }}>
        <h2>إضافة قناة</h2>
        <div className="row">
          <input placeholder="اسم القناة" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="ltr" placeholder="@handle" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} />
          <input className="ltr" placeholder="UC… (اختياري)" value={form.channelId} onChange={(e) => setForm({ ...form, channelId: e.target.value })} />
          <button className="primary" onClick={add}>
            إضافة
          </button>
        </div>
        {msg && <span className="muted small">{msg}</span>}
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>القناة</th>
              <th>المعرّف</th>
              <th>آخر جلب</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <a href={c.url} target="_blank" rel="noreferrer">
                    {c.name}
                  </a>
                </td>
                <td className="ltr small">{c.handle ? `@${c.handle}` : c.youtube_channel_id}</td>
                <td className="small muted">{c.last_fetched_at ? new Date(c.last_fetched_at).toLocaleString('ar-OM') : '—'}</td>
                <td>
                  <button className={c.active ? '' : 'ghost'} onClick={() => toggle(c)}>
                    {c.active ? 'مفعّلة · إيقاف' : 'متوقفة · تفعيل'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
