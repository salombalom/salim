// البناء: يقرأ config.json ويولّد موقعاً ثابتاً في مجلد dist/
// الاستخدام: npm run build
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHome, renderMenu, renderQrCard } from './templates.mjs';
import { makeQr } from './qr-lib.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

/* ---------- قراءة الإعدادات والتحقق منها ---------- */
export function loadConfig() {
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(join(ROOT, 'config.json'), 'utf8'));
  } catch (e) {
    fail(`ملف config.json فيه خطأ في الصياغة (فاصلة ناقصة أو زائدة؟)\n   ${e.message}`);
  }
  const errors = [];
  const warn = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };

  need(cfg.business?.name, 'business.name: اسم المحل مطلوب');
  need(cfg.business?.slug && /^[a-z0-9-]+$/.test(cfg.business.slug), 'business.slug: لازم يكون بالإنجليزي الصغير وأرقام وشرطات فقط (مثل my-cafe)');
  need(cfg.business?.siteUrl?.startsWith('http'), 'business.siteUrl: رابط الموقع لازم يبدأ بـ https://');

  const wa = String(cfg.contact?.whatsapp ?? '').replace(/\D/g, '');
  need(wa.length >= 8, 'contact.whatsapp: رقم الواتساب مطلوب مع رمز الدولة (مثل 96891234567)');
  if (wa.startsWith('00')) warn.push('contact.whatsapp: احذف 00 من بداية الرقم، اكتب 968 مباشرة');
  if (wa && !wa.startsWith('968')) warn.push('contact.whatsapp: الرقم ما يبدأ بـ 968، تأكد إنه مكتوب مع رمز الدولة');
  cfg.contact.whatsapp = wa.replace(/^00/, '');

  need(typeof cfg.location?.lat === 'number' && typeof cfg.location?.lng === 'number', 'location.lat / location.lng: إحداثيات الخريطة لازم تكون أرقام');

  const timeOk = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
  (cfg.hours ?? []).forEach((h, i) => {
    need(Array.isArray(h.days) && h.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6), `hours[${i}].days: الأيام أرقام من 0 (الأحد) إلى 6 (السبت)`);
    need(timeOk(h.open) && timeOk(h.close), `hours[${i}]: الوقت بصيغة 24 ساعة مثل "07:00" و "23:30"`);
  });

  cfg.order = { currency: 'ر.ع.', decimals: 3, types: ['pickup', 'delivery'], deliveryFee: 0, deliveryMinimum: 0, ...cfg.order };
  need(cfg.order.types.length > 0, 'order.types: اختر على الأقل طريقة طلب واحدة (pickup / delivery / dinein)');

  const ids = new Set();
  need(Array.isArray(cfg.menu) && cfg.menu.length, 'menu: المنيو فاضي');
  (cfg.menu ?? []).forEach((c, ci) => {
    need(c.id && c.name, `menu[${ci}]: كل قسم يحتاج id و name`);
    (c.items ?? []).forEach((it) => {
      const where = `menu → ${c.name} → ${it.name ?? it.id}`;
      need(it.id && /^[a-z0-9-]+$/i.test(it.id), `${where}: id لازم يكون بالإنجليزي بدون مسافات`);
      need(!ids.has(it.id), `${where}: الـ id "${it.id}" مكرر، لازم يكون فريد`);
      ids.add(it.id);
      need(it.name, `${where}: اسم الصنف مطلوب`);
      need(typeof it.price === 'number' && it.price >= 0, `${where}: السعر لازم يكون رقم (مثل 1.500) بدون علامات تنصيص`);
      if (!it.image) warn.push(`${where}: ما فيه صورة`);
    });
  });

  if (errors.length) fail(`لقيت ${errors.length} مشكلة في config.json:\n${errors.map((e) => `   ✗ ${e}`).join('\n')}`);
  warn.forEach((w) => console.warn(`  ⚠ ${w}`));
  return cfg;
}

function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  if (process.argv[1]?.endsWith('build.mjs')) process.exit(1);
  throw new Error(msg);
}

/* ---------- الألوان ---------- */
const lum = (hex) => {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const inkOn = (bg) => (contrast(bg, '#1A0F07') >= contrast(bg, '#FFFFFF') ? '#1A0F07' : '#FFFFFF');

function themeCss(theme) {
  const vars = (p) =>
    Object.entries(p).map(([k, v]) => `--${k}:${v}`).join(';') +
    `;--on-accent:${inkOn(p.accent)};--on-primary:${inkOn(p.primary)}`;
  const f = theme.fonts;
  const fonts = `--font-display:'${f.display.family}','${f.body.family}',system-ui,sans-serif;--font-body:'${f.body.family}',system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif`;
  const bright = `--accent-bright:${theme.dark.accent};--on-accent-bright:${inkOn(theme.dark.accent)}`;
  return `:root{${vars(theme.light)};${fonts};${bright};color-scheme:light}` +
    `@media (prefers-color-scheme:dark){:root:not([data-theme=light]){${vars(theme.dark)};color-scheme:dark}}` +
    `:root[data-theme=dark]{${vars(theme.dark)};color-scheme:dark}`;
}

function fontsHref(fonts) {
  const fam = (f) => `family=${f.family.replace(/ /g, '+')}:wght@${[...f.weights].sort((a, b) => a - b).join(';')}`;
  const list = fonts.display.family === fonts.body.family ? [fam({ family: fonts.body.family, weights: [...new Set([...fonts.body.weights, ...fonts.display.weights])] })] : [fam(fonts.display), fam(fonts.body)];
  return `https://fonts.googleapis.com/css2?${list.join('&')}&display=swap`;
}

/* تصغير خفيف للـ CSS بدون أي مكتبات */
const minifyCss = (css) =>
  css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();

/* ---------- البناء ---------- */
export async function build() {
  const t0 = Date.now();
  const cfg = loadConfig();

  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(join(DIST, 'assets'), { recursive: true });
  if (existsSync(join(ROOT, 'public'))) cpSync(join(ROOT, 'public'), DIST, { recursive: true });

  // الشعار: ملف SVG يُضمَّن داخل الصفحة عشان يتلوّن مع الوضع الليلي، وأي صيغة ثانية تُعرض كصورة
  const logoPath = cfg.business.logo;
  let logoSvg = '';
  if (logoPath) {
    const src = [join(ROOT, 'src', logoPath), join(ROOT, 'public', logoPath)].find(existsSync);
    if (!src) fail(`business.logo: ما لقيت ملف الشعار "${logoPath}" (حطّه في src/assets أو public)`);
    logoSvg = logoPath.endsWith('.svg')
      ? readFileSync(src, 'utf8').replace(/<\?xml[^>]*>/, '').trim()
      : `<img src="${logoPath}" alt="">`;
    if (!logoPath.endsWith('.svg')) cpSync(src, join(DIST, logoPath));
  }

  const appJs = readFileSync(join(ROOT, 'src/assets/app.js'), 'utf8');
  writeFileSync(join(DIST, 'assets/app.js'), appJs);

  // البيانات اللي يحتاجها المتصفح فقط (أصغر من الملف الكامل)
  const client = {
    business: { name: cfg.business.name, slug: cfg.business.slug },
    whatsapp: cfg.contact.whatsapp,
    order: cfg.order,
    timezone: cfg.timezone || 'Asia/Muscat',
    hours: cfg.hours ?? [],
    items: Object.fromEntries(
      cfg.menu.flatMap((c) => c.items.filter((i) => i.available !== false).map((i) => [i.id, { n: i.name, p: i.price, img: i.image || '' }]))
    ),
  };

  const siteUrl = cfg.business.siteUrl.replace(/\/$/, '');
  const menuUrl = `${siteUrl}/menu`;
  const version = Date.now().toString(36);
  const ctx = {
    base: '',
    version,
    logoSvg,
    fontsHref: fontsHref(cfg.theme.fonts),
    themeCss: themeCss(cfg.theme),
    css: minifyCss(readFileSync(join(ROOT, 'src/assets/style.css'), 'utf8')),
    clientJson: JSON.stringify(client).replace(/</g, '\\u003c'),
  };

  writeFileSync(join(DIST, 'index.html'), renderHome(cfg, ctx));
  writeFileSync(join(DIST, 'menu.html'), renderMenu(cfg, ctx));

  // كود QR لصفحة المنيو + بطاقة جاهزة للطباعة في /qr
  const qr = await makeQr(menuUrl, { dark: cfg.theme.light.text });
  writeFileSync(join(DIST, 'qr-menu.png'), qr.png);
  writeFileSync(join(DIST, 'qr-menu.svg'), qr.svg);
  writeFileSync(join(DIST, 'qr.html'), renderQrCard(cfg, ctx, qr.svg, menuUrl));

  writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /qr\nSitemap: ${siteUrl}/sitemap.xml\n`);
  writeFileSync(
    join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url><url><loc>${menuUrl}</loc></url></urlset>\n`
  );

  const items = cfg.menu.reduce((n, c) => n + c.items.length, 0);
  console.log(`✓ ${cfg.business.name}: ${cfg.menu.length} أقسام، ${items} صنف · dist/ جاهز (${Date.now() - t0}ms)`);
  return cfg;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build().catch((e) => { console.error(e); process.exit(1); });
}
