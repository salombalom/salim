/**
 * Edge Function: generate-summary — يولّد ملخص درس بـ Claude ويحفظه «مسودة» حتى يعتمده المشرف.
 *
 * الاستدعاء (من لوحة الإدارة): POST مع Authorization: Bearer <JWT المشرف>
 *   {"lessonIds": ["g5-math-u1-l1", ...], "force": false}   (حتى 10 دروس في الطلب)
 * لا يُستبدل ملخص معتمد إلا مع force = true (ويعود عندها مسودة).
 *
 * الأسرار: ANTHROPIC_API_KEY (supabase secrets set ANTHROPIC_API_KEY=...).
 * مفتاح Claude موجود في الخادم فقط، ولا يصل إلى التطبيق أبداً.
 */
import Anthropic from 'npm:@anthropic-ai/sdk@1.12.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { buildSummaryPrompt, SUMMARY_MODEL, SUMMARY_SCHEMA, validateSummary, type SummaryLessonInput } from '../_shared/summary.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: CORS });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const auth = req.headers.get('Authorization') ?? '';
  // التحقق من أن المستدعي مشرف (is_admin يقرأ auth.uid() من الـ JWT)
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: isAdmin } = await asUser.rpc('is_admin');
  if (isAdmin !== true) return json({ error: 'Forbidden' }, 403);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY is not set' }, 500);

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body?.lessonIds) ? body.lessonIds.filter((x: unknown) => typeof x === 'string').slice(0, 10) : [];
  const force = body?.force === true;
  if (!ids.length) return json({ error: 'lessonIds is required' }, 400);

  const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: userData } = await asUser.auth.getUser();
  const client = new Anthropic({ apiKey });
  const results: { lessonId: string; status: 'generated' | 'skipped' | 'error'; error?: string }[] = [];

  const { data: lessons, error } = await db
    .from('lessons')
    .select(
      'id, title, lesson_objectives(text, sort), questions(prompt, answer, explanation), units!inner(title, terms!inner(number, subjects!inner(key, name_ar, direction, grades!inner(id, name_ar))))',
    )
    .in('id', ids);
  if (error) return json({ error: error.message }, 500);
  const { data: existing } = await db.from('summaries').select('lesson_id, status').in('lesson_id', ids);
  const approved = new Set((existing ?? []).filter((s) => s.status === 'approved').map((s) => s.lesson_id));

  // deno-lint-ignore no-explicit-any
  for (const l of (lessons ?? []) as any[]) {
    if (approved.has(l.id) && !force) {
      results.push({ lessonId: l.id, status: 'skipped' });
      continue;
    }
    const subject = l.units.terms.subjects;
    const input: SummaryLessonInput = {
      grade: subject.grades.id,
      gradeName: subject.grades.name_ar,
      subjectName: subject.name_ar,
      english: subject.direction === 'ltr',
      term: l.units.terms.number,
      unitTitle: l.units.title,
      lessonTitle: l.title,
      // deno-lint-ignore no-explicit-any
      objectives: (l.lesson_objectives ?? []).sort((a: any, b: any) => a.sort - b.sort).map((o: any) => o.text),
      // deno-lint-ignore no-explicit-any
      questions: (l.questions ?? []).map((q: any) => ({ prompt: q.prompt, answer: Array.isArray(q.answer) ? q.answer.join(' ') : String(q.answer), explanation: q.explanation ?? '' })),
    };
    try {
      const { system, user } = buildSummaryPrompt(input);
      const res = await client.beta.messages.create({
        model: SUMMARY_MODEL,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: SUMMARY_SCHEMA } },
        system,
        messages: [{ role: 'user', content: user }],
      });
      if (res.stop_reason === 'refusal') throw new Error('refused');
      if (res.stop_reason === 'max_tokens') throw new Error('truncated');
      const text = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
      const content = validateSummary(JSON.parse(text));
      const { error: upErr } = await db.from('summaries').upsert(
        { lesson_id: l.id, content, model: res.model, status: 'draft', approved_by: null, approved_at: null, updated_at: new Date().toISOString() },
        { onConflict: 'lesson_id' },
      );
      if (upErr) throw upErr;
      results.push({ lessonId: l.id, status: 'generated' });
    } catch (e) {
      results.push({ lessonId: l.id, status: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  }
  console.log(JSON.stringify({ by: userData?.user?.id, results }));
  return json({ results });
});
