/**
 * يولّد أيقونة التطبيق وشاشة البداية من الهوية (كحلي + ذهبي + خط El Messiri).
 * التشغيل: node tools/generate-icons.js   (يستخدم Playwright المثبت لرسم SVG إلى PNG)
 *
 * الشكل: نجمة ثمانية (خاتم) بخط ذهبي رفيع، وفي وسطها حرف «د».
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const NAVY = '#0B1220';
const GOLD = '#C9A45C';
const FONT = path.join(__dirname, '..', 'node_modules/@expo-google-fonts/el-messiri/500Medium/ElMessiri_500Medium.ttf');
const OUT = path.join(__dirname, '..', 'assets/images');

/** نجمة ثمانية: مربعان متراكبان، أحدهما مدوّر 45° */
function star(cx, cy, r, stroke, color) {
  const sq = (rot) =>
    `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linejoin="round" transform="rotate(${rot} ${cx} ${cy})"/>`;
  return sq(0) + sq(45);
}

/** صفحة HTML بمقاس size فيها SVG */
function page(size, svg, bg = 'transparent') {
  const font = fs.readFileSync(FONT).toString('base64');
  return `<!doctype html><html><head><style>
@font-face { font-family: 'Messiri'; src: url(data:font/ttf;base64,${font}) format('truetype'); }
html,body { margin:0; width:${size}px; height:${size}px; background:${bg}; overflow:hidden; }
svg text { font-family: 'Messiri'; }
</style></head><body>${svg}</body></html>`;
}

/** الشعار: نجمة + «د» — scale نسبة حجم النجمة من اللوحة */
function mark(size, { color = GOLD, scale = 0.62, bg = null } = {}) {
  const c = size / 2;
  const r = (size * scale) / 2 / Math.SQRT2 / 1.0; // نصف ضلع المربع حتى تلامس رؤوس النجمة الدائرة
  const stroke = Math.max(2, size * 0.012);
  const inner = star(c, c, r * 0.86, stroke * 0.55, color);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
${star(c, c, r, stroke, color)}
<g opacity="0.45">${inner}</g>
<text x="${c}" y="${c}" text-anchor="middle" dominant-baseline="central" font-size="${size * scale * 0.8}" fill="${color}" dy="${-size * scale * 0.06}">د</text>
</svg>`;
}

/** شاشة البداية: الاسم مع زخرفة رفيعة */
function splash(w) {
  const h = w;
  const c = w / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<text x="${c}" y="${h * 0.42}" text-anchor="middle" dominant-baseline="central" font-size="${w * 0.3}" fill="${GOLD}">دَرْسي</text>
<line x1="${c - w * 0.2}" y1="${h * 0.7}" x2="${c - w * 0.04}" y2="${h * 0.7}" stroke="${GOLD}" stroke-opacity="0.5" stroke-width="${w * 0.006}"/>
<rect x="${c - w * 0.018}" y="${h * 0.7 - w * 0.018}" width="${w * 0.036}" height="${w * 0.036}" fill="none" stroke="${GOLD}" stroke-width="${w * 0.006}" transform="rotate(45 ${c} ${h * 0.7})"/>
<line x1="${c + w * 0.04}" y1="${h * 0.7}" x2="${c + w * 0.2}" y2="${h * 0.7}" stroke="${GOLD}" stroke-opacity="0.5" stroke-width="${w * 0.006}"/>
</svg>`;
}

(async () => {
  const browser = await chromium.launch();
  const render = async (file, size, svg, bg) => {
    const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await p.setContent(page(size, svg, bg));
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, file), omitBackground: !bg || bg === 'transparent' });
    await p.close();
    console.log('✓', file);
  };
  // iOS/عام: بلا شفافية (Apple ترفض الأيقونات الشفافة)
  await render('icon.png', 1024, mark(1024, { bg: NAVY }), NAVY);
  // Android التكيّفية: المقدّمة داخل المنطقة الآمنة (66٪ الوسطى)
  await render('android-icon-foreground.png', 512, mark(512, { scale: 0.5 }), 'transparent');
  await render('android-icon-background.png', 512, `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="${NAVY}"/></svg>`, NAVY);
  await render('android-icon-monochrome.png', 432, mark(432, { scale: 0.5, color: '#FFFFFF' }), 'transparent');
  await render('splash-icon.png', 600, splash(600), 'transparent');
  await render('favicon.png', 48, mark(48, { bg: NAVY, scale: 0.8 }), NAVY);
  await browser.close();
})();
