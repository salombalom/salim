// قوالب HTML — تُولَّد كل الصفحات من config.json وقت البناء
// (المحتوى جاهز في HTML من أول تحميل، والجافاسكربت فقط للسلة والتفاعل)

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const nl2br = (s = '') => esc(s).replace(/\n/g, '<br>');

export function fmt12(t) {
  let [h, m] = t.split(':').map(Number);
  const suffix = h < 12 ? 'ص' : 'م';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${suffix}`;
}

const isUnsplash = (url) => /^https:\/\/images\.unsplash\.com\//.test(url);

/** رابط صورة بحجم معيّن. صور Unsplash تُقصّ وتُضغط تلقائياً، والصور المحلية تُستخدم كما هي */
export function imgUrl(url, w, h, q = 70) {
  if (!url) return '';
  if (!isUnsplash(url)) return url;
  const p = new URLSearchParams({ w: String(w), auto: 'format', q: String(q) });
  if (h) { p.set('h', String(h)); p.set('fit', 'crop'); }
  return `${url.split('?')[0]}?${p}`;
}

function srcset(url, widths, ratio, q) {
  if (!isUnsplash(url)) return '';
  return widths.map((w) => `${imgUrl(url, w, ratio ? Math.round(w * ratio) : 0, q)} ${w}w`).join(', ');
}

function img(url, { alt = '', widths, ratio, sizes, w, h, q = 70, cls = '', eager = false, priority = false }) {
  const ss = srcset(url, widths, ratio, q);
  return `<img src="${esc(imgUrl(url, widths[1] ?? widths[0], ratio ? Math.round((widths[1] ?? widths[0]) * ratio) : 0, q))}"${
    ss ? ` srcset="${esc(ss)}" sizes="${esc(sizes)}"` : ''
  } alt="${esc(alt)}" width="${w}" height="${h}"${cls ? ` class="${cls}"` : ''}${
    eager ? '' : ' loading="lazy"'
  } decoding="async"${priority ? ' fetchpriority="high"' : ''}>`;
}

export const money = (n, cfg) =>
  `<span class="price"><bdi>${Number(n).toFixed(cfg.order.decimals)}</bdi> <small>${esc(cfg.order.currency)}</small></span>`;

/* ---------- أيقونات ---------- */
const I = {
  bag: '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
  chat: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19Z"/><path d="M9 10.5c.5 1.6 1.9 3 3.5 3.5l1.2-1 1.8.8-.4 1.5c-3 .3-6.6-3.3-6.3-6.3l1.5-.4.8 1.8Z" stroke-width="1.2"/>',
  arrow: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  nav: '<path d="M3 11l18-8-8 18-2-8-8-2Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  locate: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/>',
  insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>',
};
export const icon = (name, size = 20) =>
  `<svg class="i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;

/* ---------- أجزاء مشتركة ---------- */
function head(cfg, ctx, { title, description, path }) {
  const b = cfg.business;
  const url = `${b.siteUrl.replace(/\/$/, '')}${path}`;
  const og = imgUrl(cfg.hero.image, 1200, 630, 75);
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta name="theme-color" content="${cfg.theme.light.bg}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="${cfg.theme.dark.bg}" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:locale" content="ar_OM">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
${og ? `<meta property="og:image" content="${esc(og)}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<link rel="icon" href="${ctx.base}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://images.unsplash.com" crossorigin>
<link rel="stylesheet" href="${esc(ctx.fontsHref)}">
<script>document.documentElement.classList.add('js');setTimeout(function(){if(!window.qimr)document.documentElement.classList.remove('js')},3000);try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<style>${ctx.themeCss}${ctx.css}</style>
<script type="application/json" id="cfg">${ctx.clientJson}</script>
<script src="${ctx.base}assets/app.js?v=${ctx.version}" defer></script>`;
}

const logo = (ctx, cls = 'logo') => `<span class="${cls}">${ctx.logoSvg}</span>`;

function themeButton() {
  return `<button class="icon-btn" type="button" data-act="theme" aria-label="تبديل الوضع الليلي">${icon('moon')}${icon('sun')}</button>`;
}

function cartButton() {
  return `<button class="icon-btn cart-btn" type="button" data-act="open-cart" aria-label="السلة">${icon('bag')}<span class="badge" data-cart-count hidden>0</span></button>`;
}

function itemControl(it) {
  if (it.available === false) return `<span class="soldout">نفد اليوم</span>`;
  return `<div class="ctl" data-ctl="${esc(it.id)}" data-q="0">
      <button class="add" type="button" data-act="inc" data-id="${esc(it.id)}" aria-label="أضف ${esc(it.name)} للسلة">${icon('plus', 16)}<span>أضف</span></button>
      <div class="stepper"><button type="button" data-act="inc" data-id="${esc(it.id)}" aria-label="زيادة">${icon('plus', 16)}</button><output class="q">0</output><button type="button" data-act="dec" data-id="${esc(it.id)}" aria-label="تقليل">${icon('minus', 16)}</button></div>
    </div>`;
}

function card(it, cfg, { compact = false } = {}) {
  const media = compact
    ? img(it.image, { alt: it.name, widths: [160, 240, 320], ratio: 1, sizes: '96px', w: 240, h: 240, q: 65 })
    : img(it.image, { alt: it.name, widths: [240, 480, 760], ratio: 0.75, sizes: '(min-width: 640px) 400px, 112px', w: 480, h: 360, q: 68 });
  return `<article class="card${compact ? '' : ' reveal'}" data-item="${esc(it.id)}" data-search="${esc(`${it.name} ${it.desc ?? ''}`)}">
    <div class="card-media">${media}</div>
    <div class="card-body">
      ${it.tag ? `<span class="tag">${esc(it.tag)}</span>` : ''}
      <h4>${esc(it.name)}</h4>
      ${it.desc ? `<p>${esc(it.desc)}</p>` : ''}
      <div class="card-foot">${money(it.price, cfg)}${itemControl(it)}</div>
    </div>
  </article>`;
}

function menuTabs(cfg) {
  return `<nav class="tabs" aria-label="أقسام المنيو" data-tabs>
    ${cfg.menu.map((c, i) => `<a class="tab${i === 0 ? ' active' : ''}" href="#cat-${esc(c.id)}" data-tab="${esc(c.id)}">${c.icon ? `<span aria-hidden="true">${esc(c.icon)}</span>` : ''}${esc(c.name)}</a>`).join('')}
  </nav>`;
}

function menuSections(cfg, opts) {
  return cfg.menu
    .map(
      (c) => `<section class="cat" id="cat-${esc(c.id)}" data-cat="${esc(c.id)}">
      <h3 class="cat-title">${esc(c.name)} <span class="cat-count">${c.items.length} أصناف</span></h3>
      <div class="grid">${c.items.map((it) => card(it, cfg, opts)).join('')}</div>
    </section>`
    )
    .join('');
}

function hoursList(cfg) {
  return `<ul class="hours">${cfg.hours
    .map((h) => `<li data-days="${h.days.join(',')}"><span>${esc(h.label)}</span><span><bdi>${fmt12(h.open)}</bdi> – <bdi>${fmt12(h.close)}</bdi></span></li>`)
    .join('')}</ul>`;
}

const ORDER_TYPES = {
  pickup: 'استلام من المحل',
  delivery: 'توصيل',
  dinein: 'على الطاولة',
};

function cartDrawer(cfg) {
  const o = cfg.order;
  const types = o.types.filter((t) => ORDER_TYPES[t]);
  return `<div class="cart-bar" data-cart-bar>
  <button type="button" data-act="open-cart" class="cart-bar-btn">
    <span class="cart-bar-count" data-cart-count>0</span>
    <span class="cart-bar-label">عرض السلة</span>
    <span class="cart-bar-total" data-cart-total></span>
  </button>
</div>

<div class="drawer" id="cart" role="dialog" aria-modal="true" aria-labelledby="cart-title" data-drawer>
  <div class="drawer-backdrop" data-act="close-cart"></div>
  <div class="drawer-panel">
    <header class="drawer-head">
      <h3 id="cart-title">سلتك</h3>
      <button class="icon-btn" type="button" data-act="close-cart" aria-label="إغلاق">${icon('close')}</button>
    </header>
    <div class="drawer-scroll">
      <div class="cart-empty" data-cart-empty>
        <div class="cart-empty-icon">${icon('bag', 34)}</div>
        <p>سلتك فاضية</p>
        <small>أضف أصنافك من المنيو، وبعدها أرسل الطلب على واتساب.</small>
      </div>
      <ul class="lines" data-cart-lines></ul>
      <form class="order-form" data-order-form data-type="${types[0]}" novalidate>
        <div class="field">
          <label for="f-name">الاسم</label>
          <input id="f-name" name="name" autocomplete="name" placeholder="اسمك الكريم" required>
        </div>
        ${types.length > 1 ? `<fieldset class="field">
          <legend>طريقة الطلب</legend>
          <div class="seg">${types.map((t, i) => `<label><input type="radio" name="type" value="${t}"${i === 0 ? ' checked' : ''}><span>${ORDER_TYPES[t]}</span></label>`).join('')}</div>
        </fieldset>` : `<input type="hidden" name="type" value="${types[0]}">`}
        ${types.includes('delivery') ? `<div class="field cond" data-for="delivery">
          <label for="f-address">عنوان التوصيل</label>
          <textarea id="f-address" name="address" rows="2" autocomplete="street-address" placeholder="الحي، السكة، رقم البيت أو أقرب معلم"></textarea>
          <button type="button" class="link-btn" data-act="locate">${icon('locate', 18)}<span>أضف موقعي الحالي</span></button>
          <small class="hint">${o.deliveryNote ? `${esc(o.deliveryNote)} · ` : ''}رسوم التوصيل ${Number(o.deliveryFee || 0).toFixed(o.decimals)} ${esc(o.currency)}${o.deliveryMinimum ? ` · الحد الأدنى ${Number(o.deliveryMinimum).toFixed(o.decimals)} ${esc(o.currency)}` : ''}</small>
        </div>` : ''}
        ${types.includes('dinein') ? `<div class="field cond" data-for="dinein">
          <label for="f-table">رقم الطاولة</label>
          <input id="f-table" name="table" inputmode="numeric" placeholder="مثلاً: 5">
        </div>` : ''}
        <div class="field">
          <label for="f-notes">ملاحظات <span class="opt">(اختياري)</span></label>
          <textarea id="f-notes" name="notes" rows="2" placeholder="مثلاً: بدون سكر، حليب شوفان…"></textarea>
        </div>
      </form>
    </div>
    <footer class="drawer-foot" data-cart-foot>
      <dl class="totals">
        <div data-row="sub"><dt>المجموع</dt><dd data-sub></dd></div>
        <div data-row="fee"><dt>التوصيل</dt><dd data-fee></dd></div>
        <div class="grand"><dt>الإجمالي</dt><dd data-grand></dd></div>
      </dl>
      <p class="form-error" data-error role="alert"></p>
      <a class="btn btn-wa" data-act="send" href="https://wa.me/${cfg.contact.whatsapp}" target="_blank" rel="noopener">${icon('chat', 22)}<span>أرسل الطلب على واتساب</span></a>
      <button type="button" class="link-btn clear" data-act="clear">تفريغ السلة</button>
    </footer>
  </div>
</div>
<div class="toast" data-toast role="status" aria-live="polite"></div>`;
}

function credit(cfg) {
  return `<p class="credit">${cfg.demo ? '<span class="demo-note">موقع تجريبي لأغراض العرض، والمحل وبياناته وهمية.</span>' : ''}
    <a href="https://instagram.com/qimr_web" target="_blank" rel="noopener">تصميم وتطوير <strong>قِمْر</strong> · <bdi>@qimr_web</bdi></a></p>`;
}

function jsonLd(cfg) {
  const b = cfg.business;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const data = {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: b.name,
    alternateName: b.nameLatin,
    description: b.description,
    url: b.siteUrl,
    image: imgUrl(cfg.hero.image, 1200, 630),
    telephone: cfg.contact.phone,
    servesCuisine: 'Coffee',
    priceRange: '$$',
    address: { '@type': 'PostalAddress', streetAddress: cfg.location.address, addressLocality: cfg.location.city, addressCountry: 'OM' },
    geo: { '@type': 'GeoCoordinates', latitude: cfg.location.lat, longitude: cfg.location.lng },
    openingHoursSpecification: cfg.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days.map((d) => dayNames[d]),
      opens: h.open,
      closes: h.close,
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

/* ---------- الصفحة الرئيسية ---------- */
export function renderHome(cfg, ctx) {
  const b = cfg.business, h = cfg.hero, a = cfg.about, L = cfg.location;
  const mapSrc = `https://maps.google.com/maps?q=${L.lat},${L.lng}&z=${L.mapZoom || 16}&hl=ar&output=embed`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${L.lat},${L.lng}`;
  const wa = `https://wa.me/${cfg.contact.whatsapp}`;
  const socials = [
    cfg.contact.instagram && [`https://instagram.com/${cfg.contact.instagram}`, 'انستقرام'],
    cfg.contact.tiktok && [`https://tiktok.com/@${cfg.contact.tiktok}`, 'تيك توك'],
    cfg.contact.snapchat && [`https://snapchat.com/add/${cfg.contact.snapchat}`, 'سناب شات'],
  ].filter(Boolean);
  const heroImg = h.image;

  return `${head(cfg, ctx, { title: `${b.name} | ${b.tagline}`, description: b.description, path: '/' })}
${heroImg ? `<link rel="preload" as="image" imagesrcset="${esc(srcset(heroImg, [640, 960, 1400, 2000], 0, 70))}" imagesizes="100vw" fetchpriority="high">` : ''}
${jsonLd(cfg)}
</head>
<body class="page-home">
<a class="skip" href="#menu">انتقل إلى المنيو</a>

<header class="site-header over-hero" data-header>
  <div class="container header-inner">
    <a class="brand" href="#top" aria-label="${esc(b.name)}">${logo(ctx)}<span>${esc(b.name)}</span></a>
    <nav class="nav" aria-label="القائمة الرئيسية">
      <a href="#menu">المنيو</a><a href="#about">قصتنا</a><a href="#visit">زورونا</a>
    </nav>
    <div class="header-actions">${themeButton()}${cartButton()}</div>
  </div>
</header>

<main id="top">
  <section class="hero">
    <div class="hero-media">${heroImg ? img(heroImg, { alt: '', widths: [640, 960, 1400, 2000], sizes: '100vw', w: 1400, h: 933, eager: true, priority: true }) : ''}</div>
    <div class="container hero-content">
      <p class="eyebrow hero-in" style="--d:0">${esc(h.eyebrow)}</p>
      <h1 class="hero-in" style="--d:1">${nl2br(h.title)}</h1>
      <p class="hero-sub hero-in" style="--d:2">${esc(h.subtitle)}</p>
      <div class="hero-actions hero-in" style="--d:3">
        <a class="btn btn-accent" href="#menu">${esc(h.cta)}${icon('arrow', 18)}</a>
        <a class="btn btn-ghost" href="menu">${esc(h.secondaryCta)}</a>
      </div>
      <div class="hero-meta hero-in" style="--d:4">
        <span class="status" data-status>—</span>
        <span class="hero-loc">${icon('pin', 16)}${esc(L.city)}</span>
      </div>
    </div>
    <a class="scroll-cue" href="#about" aria-label="انزل للأسفل"><span></span></a>
  </section>

  ${cfg.marquee?.length ? `<div class="marquee" aria-hidden="true"><div class="marquee-track">${[0, 1]
    .map(() => `<div class="marquee-group">${cfg.marquee.map((m) => `<span>${esc(m)}</span><i>✦</i>`).join('')}</div>`)
    .join('')}</div></div>` : ''}

  ${a ? `<section class="section about" id="about">
    <div class="container about-grid">
      <div class="about-media reveal">
        ${a.images?.[0] ? `<figure class="about-img main">${img(a.images[0], { alt: `داخل ${b.name}`, widths: [480, 760, 1100], ratio: 1.2, sizes: '(min-width: 900px) 520px, 90vw', w: 760, h: 912 })}</figure>` : ''}
        ${a.images?.[1] ? `<figure class="about-img sub">${img(a.images[1], { alt: '', widths: [240, 400, 600], ratio: 1, sizes: '(min-width: 900px) 240px, 40vw', w: 400, h: 400 })}</figure>` : ''}
        <div class="about-seal" aria-hidden="true">${ctx.logoSvg}</div>
      </div>
      <div class="about-text">
        <p class="eyebrow reveal">${esc(a.eyebrow)}</p>
        <h2 class="reveal">${nl2br(a.title)}</h2>
        <p class="lead reveal">${esc(a.text)}</p>
        ${a.stats?.length ? `<dl class="stats">${a.stats.map((s) => `<div class="reveal"><dt><bdi>${esc(s.value)}</bdi></dt><dd>${esc(s.label)}</dd></div>`).join('')}</dl>` : ''}
      </div>
    </div>
  </section>` : ''}

  <section class="section menu-section" id="menu">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow reveal">المنيو</p>
        <h2 class="reveal">اختر، وأضف للسلة،<br>وأرسل طلبك على واتساب</h2>
      </div>
    </div>
    <div class="tabs-wrap"><div class="container">${menuTabs(cfg)}</div></div>
    <div class="container">${menuSections(cfg)}</div>
  </section>

  <section class="section visit" id="visit">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow reveal">زورونا</p>
        <h2 class="reveal">نتريّاك على فنجان</h2>
      </div>
      <div class="visit-grid">
        <div class="map reveal">
          <iframe title="موقع ${esc(b.name)} على خرائط قوقل" src="${esc(mapSrc)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
        </div>
        <div class="info-card reveal">
          <span class="status" data-status>—</span>
          <div class="info-row">${icon('pin')}<div><strong>العنوان</strong><p>${esc(L.address)}<br>${esc(L.city)}</p></div></div>
          <div class="info-row">${icon('clock')}<div><strong>أوقات الدوام</strong>${hoursList(cfg)}</div></div>
          <div class="info-actions">
            <a class="btn btn-primary" href="${esc(directions)}" target="_blank" rel="noopener">${icon('nav', 18)}الاتجاهات</a>
            <a class="btn btn-outline" href="${esc(wa)}" target="_blank" rel="noopener">${icon('chat', 18)}واتساب</a>
            ${cfg.contact.phone ? `<a class="btn btn-outline" href="tel:${esc(cfg.contact.phone)}">${icon('phone', 18)}اتصل</a>` : ''}
          </div>
        </div>
      </div>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">${logo(ctx)}<div><strong>${esc(b.name)}</strong><span>${esc(b.tagline)}</span></div></div>
      <nav class="footer-links" aria-label="روابط">
        <a href="#menu">المنيو</a><a href="menu">منيو الطاولة</a><a href="#visit">الموقع والدوام</a><a href="${esc(wa)}" target="_blank" rel="noopener">واتساب</a>
        ${socials.map(([u, n]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join('')}
      </nav>
    </div>
    <div class="footer-bottom">
      <p>© <span data-year>${new Date().getFullYear()}</span> ${esc(b.name)}</p>
      ${credit(cfg)}
    </div>
  </div>
</footer>

${cartDrawer(cfg)}
</body>
</html>
`;
}

/* ---------- صفحة المنيو الخفيفة (/menu) — تُفتح من كود QR ---------- */
export function renderMenu(cfg, ctx) {
  const b = cfg.business;
  return `${head(cfg, ctx, { title: `المنيو | ${b.name}`, description: `منيو ${b.name}: ${b.tagline}. اطلب وأرسل طلبك على واتساب.`, path: '/menu' })}
</head>
<body class="page-menu">
<header class="m-header">
  <div class="container m-header-inner">
    <a class="brand" href="./" aria-label="الصفحة الرئيسية">${logo(ctx)}<span>${esc(b.name)}</span></a>
    <div class="header-actions">${themeButton()}${cartButton()}</div>
  </div>
  <div class="container m-intro">
    <h1>المنيو</h1>
    <div class="m-meta"><span class="status" data-status>—</span><span class="chip" data-table-chip hidden></span></div>
  </div>
</header>

<div class="tabs-wrap">
  <div class="container">
    <label class="search">${icon('search', 18)}<input type="search" placeholder="دوّر في المنيو…" aria-label="بحث في المنيو" data-search-input></label>
    ${menuTabs(cfg)}
  </div>
</div>

<main class="container m-main">
  ${menuSections(cfg, { compact: true })}
  <p class="no-results" data-no-results hidden>ما لقينا شي بهالاسم 🤔</p>
</main>

<footer class="m-footer container">
  <a class="btn btn-outline" href="./">زوروا موقعنا</a>
  ${credit(cfg)}
</footer>

${cartDrawer(cfg)}
</body>
</html>
`;
}

/* ---------- بطاقة QR للطباعة (/qr) ---------- */
export function renderQrCard(cfg, ctx, qrSvg, menuUrl) {
  const b = cfg.business;
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>بطاقة QR | ${esc(b.name)}</title>
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(ctx.fontsHref)}">
<style>${ctx.themeCss}
*{box-sizing:border-box;margin:0}
body{font-family:var(--font-body);background:#e9e4dc;min-height:100vh;display:grid;place-items:center;gap:24px;padding:32px 16px;color:#21160E}
.card{width:min(100%,105mm);aspect-ratio:105/148;background:${cfg.theme.light.surface};border-radius:6mm;padding:9mm 8mm;display:flex;flex-direction:column;align-items:center;text-align:center;box-shadow:0 30px 60px -20px rgba(0,0,0,.25);border:1px solid #e3d7c4}
.logo{width:15mm;height:15mm;color:${cfg.theme.light.accent}}
.logo svg{width:100%;height:100%}
h1{font-family:var(--font-display);font-size:7.5mm;font-weight:700;margin-top:2mm}
.tag{font-size:3.2mm;color:#76665A}
.qr{width:62mm;margin:6mm 0 4mm;padding:3mm;background:#fff;border-radius:3mm;border:1px solid #eee}
.qr svg{display:block;width:100%;height:auto}
.cta{font-family:var(--font-display);font-size:5mm;font-weight:600}
.sub{font-size:3.1mm;color:#76665A;margin-top:1mm}
.foot{margin-top:auto;font-size:2.4mm;color:#9a8b7d;direction:ltr}
.tools{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
.tools a,.tools button{font:inherit;padding:10px 18px;border-radius:999px;border:1px solid #cbbfae;background:#fff;color:inherit;text-decoration:none;cursor:pointer}
@media print{body{background:#fff;padding:0}.card{box-shadow:none}.tools{display:none}@page{size:A6;margin:0}}
</style>
</head>
<body>
<div class="card">
  <div class="logo">${ctx.logoSvg}</div>
  <h1>${esc(b.name)}</h1>
  <p class="tag">${esc(b.tagline)}</p>
  <div class="qr">${qrSvg}</div>
  <p class="cta">امسح الكود، واطلب من طاولتك</p>
  <p class="sub">المنيو كامل، والطلب يوصلنا على واتساب</p>
  <p class="foot">${esc(menuUrl.replace(/^https?:\/\//, ''))}</p>
</div>
<div class="tools">
  <button onclick="print()">طباعة البطاقة</button>
  <a href="qr-menu.png" download>تحميل QR بصيغة PNG</a>
  <a href="qr-menu.svg" download>تحميل QR بصيغة SVG</a>
</div>
</body>
</html>
`;
}
