/**
 * يولّد store/privacy-policy.html (عربي + إنجليزي) من config/privacy.ts
 * لنشره على رابط عام (تطلبه App Store و Google Play). التشغيل: npm run store:privacy
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { PRIVACY_POLICY, type Policy } from '../config/privacy';

const e = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const section = (p: Policy, lang: 'ar' | 'en') => `
<section lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
  <h1>${e(p.title)}</h1>
  <p class="muted">${e(p.updated)}</p>
  ${p.sections.map((s) => `<h2>${e(s.heading)}</h2>\n  ${s.body.map((b) => `<p>${e(b)}</p>`).join('\n  ')}`).join('\n  ')}
</section>`;

const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>سياسة الخصوصية — دَرْسي | Darsi Privacy Policy</title>
<style>
  :root { --bg: #f7f3ea; --text: #0b1220; --muted: #5c6475; --gold: #8a6a2c; --line: #e8e0cf; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0b1220; --text: #f3eee3; --muted: #9aa3b5; --gold: #c9a45c; --line: #1f2a40; } }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: 'IBM Plex Sans Arabic', system-ui, sans-serif; line-height: 1.8; }
  main { max-width: 760px; margin: 0 auto; padding: 32px 16px 64px; }
  header { font-family: 'El Messiri', serif; color: var(--gold); font-size: 28px; border-bottom: 1px solid var(--gold); padding-bottom: 8px; }
  nav { margin: 12px 0 24px; } nav a { color: var(--gold); margin-inline-end: 16px; }
  h1 { font-family: 'El Messiri', serif; font-weight: 500; font-size: 26px; margin: 24px 0 0; }
  h2 { font-family: 'El Messiri', serif; font-weight: 500; font-size: 19px; color: var(--gold); margin: 24px 0 4px; }
  .muted { color: var(--muted); margin-top: 0; }
  section + section { border-top: 1px solid var(--line); margin-top: 40px; }
</style>
</head>
<body>
<main>
  <header>دَرْسي · Darsi</header>
  <nav><a href="#ar">العربية</a><a href="#en">English</a></nav>
  <div id="ar">${section(PRIVACY_POLICY.ar, 'ar')}</div>
  <div id="en">${section(PRIVACY_POLICY.en, 'en')}</div>
</main>
</body>
</html>
`;

const out = join(__dirname, '..', 'store', 'privacy-policy.html');
writeFileSync(out, html, 'utf8');
console.log(`wrote ${out}`);
