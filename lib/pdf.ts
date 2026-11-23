/** قالب صفحات PDF (HTML) — التصدير الفعلي في lib/pdfExport.ts */
import { lightColors } from '@/theme/tokens';

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** صفحة A4 بهوية «دَرْسي» (ورق عاجي ونص كحلي وخطوط ذهبية رفيعة) */
export function pdfPage({ title, body, dir = 'rtl' }: { title: string; body: string; dir?: 'rtl' | 'ltr' }): string {
  const c = lightColors;
  return `<!doctype html>
<html lang="${dir === 'rtl' ? 'ar' : 'en'}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: ${c.text}; background: #fff; font-family: 'IBM Plex Sans Arabic', 'Geeza Pro', 'Noto Naskh Arabic', 'Segoe UI', Tahoma, sans-serif; font-size: 12.5pt; line-height: 1.75; }
  header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid ${c.gold}; padding-bottom: 6pt; margin-bottom: 14pt; }
  .brand { font-family: 'El Messiri', 'Geeza Pro', serif; font-size: 16pt; color: ${c.goldText}; }
  .meta { color: ${c.textMuted}; font-size: 10pt; }
  h1 { font-family: 'El Messiri', 'Geeza Pro', serif; font-size: 22pt; margin: 0 0 4pt; line-height: 1.4; }
  h2 { font-family: 'El Messiri', 'Geeza Pro', serif; font-size: 14pt; color: ${c.goldText}; margin: 16pt 0 6pt; border-bottom: 1px solid ${c.border}; padding-bottom: 2pt; }
  ul, ol { margin: 0; padding-inline-start: 18pt; }
  li { margin: 3pt 0; }
  .box { border: 1px solid ${c.border}; border-inline-start: 3px solid ${c.gold}; background: ${c.background}; padding: 8pt 12pt; border-radius: 6pt; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: start; border-bottom: 1px solid ${c.border}; padding: 5pt 4pt; vertical-align: top; }
  th { color: ${c.textMuted}; font-weight: 500; font-size: 10pt; }
  .num { font-family: 'El Messiri', 'Geeza Pro', serif; color: ${c.goldText}; }
  footer { margin-top: 22pt; border-top: 1px solid ${c.border}; padding-top: 6pt; color: ${c.textMuted}; font-size: 9pt; }
</style>
</head>
<body>${body}</body>
</html>`;
}
