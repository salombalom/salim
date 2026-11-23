/** صفحة PDF لملخص درس */
import { isolateMath } from '@/lib/bidi';
import { escapeHtml, pdfPage } from '@/lib/pdf';
import type { SummaryContent } from '@/supabase/functions/_shared/summary';

export interface SummaryPdfInput {
  lessonTitle: string;
  subjectName: string;
  gradeName: string;
  unitTitle: string;
  objectives: string[];
  summary: SummaryContent;
  ltr?: boolean;
}

export function buildSummaryHtml(i: SummaryPdfInput): string {
  const t = (s: string) => escapeHtml(i.ltr ? s : isolateMath(s));
  const s = i.summary;
  const L = i.ltr
    ? { objectives: 'Lesson objectives', concepts: 'Key ideas', terms: 'Key terms', term: 'Term', meaning: 'Meaning', example: 'Example', review: 'Check yourself' }
    : { objectives: 'أهداف الدرس', concepts: 'أهم الأفكار', terms: 'مصطلحات', term: 'المصطلح', meaning: 'المعنى', example: 'مثال', review: 'راجع نفسك' };
  const body = [
    `<header><span class="brand">دَرْسي</span><span class="meta">${escapeHtml(i.subjectName)} · ${escapeHtml(i.gradeName)}</span></header>`,
    `<h1>${t(i.lessonTitle)}</h1>`,
    `<div class="meta">${escapeHtml(i.unitTitle)}</div>`,
    `<p>${t(s.overview)}</p>`,
    i.objectives.length ? `<h2>${L.objectives}</h2><ul>${i.objectives.map((o) => `<li>${t(o)}</li>`).join('')}</ul>` : '',
    `<h2>${L.concepts}</h2><ul>${s.concepts.map((c) => `<li>${t(c)}</li>`).join('')}</ul>`,
    s.definitions.length
      ? `<h2>${L.terms}</h2><table><tr><th>${L.term}</th><th>${L.meaning}</th></tr>${s.definitions.map((d) => `<tr><td><strong>${t(d.term)}</strong></td><td>${t(d.meaning)}</td></tr>`).join('')}</table>`
      : '',
    s.example ? `<h2>${L.example}</h2><div class="box">${t(s.example).replace(/\n/g, '<br/>')}</div>` : '',
    `<h2>${L.review}</h2><ol>${s.review.map((r) => `<li>${t(r)}</li>`).join('')}</ol>`,
    `<footer>ملخص أصلي من تطبيق «دَرْسي» المجاني للمراجعة، وليس نصاً من الكتاب المدرسي.</footer>`,
  ].join('\n');
  return pdfPage({ title: i.lessonTitle, body, dir: i.ltr ? 'ltr' : 'rtl' });
}
