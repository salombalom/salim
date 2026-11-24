/* قالب قِمْر — السلة، الطلب عبر واتساب، أوقات الدوام، والحركات
   البيانات تأتي من <script id="cfg"> اللي يولّده البناء من config.json */
(() => {
  'use strict';
  window.qimr = true;
  const CFG = JSON.parse(document.getElementById('cfg').textContent);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const O = CFG.order;
  const SCALE = 10 ** O.decimals;
  const minor = (p) => Math.round(p * SCALE); // نحسب بالبيسة عشان ما تصير أخطاء كسور
  const num = (m) => (m / SCALE).toFixed(O.decimals);
  const moneyHtml = (m) => `<bdi>${num(m)}</bdi> <small>${O.currency}</small>`;
  const moneyText = (m) => `${num(m)} ${O.currency}`;
  const ITEMS = CFG.items;
  const TYPE_LABEL = { pickup: 'استلام من المحل', delivery: 'توصيل', dinein: 'على الطاولة' };

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  /* ================= السلة ================= */
  const KEY = `cart:${CFG.business.slug}`;
  let cart = store.get(KEY, {});
  for (const id in cart) if (!ITEMS[id] || !(cart[id] > 0)) delete cart[id];

  const drawer = $('[data-drawer]');
  const form = $('[data-order-form]');
  const errorEl = $('[data-error]');
  let geo = null;

  const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = () => Object.entries(cart).reduce((s, [id, q]) => s + minor(ITEMS[id].p) * q, 0);
  const orderType = () => form?.elements.type?.value || O.types[0];
  const fee = () => (orderType() === 'delivery' ? minor(O.deliveryFee || 0) : 0);

  function setQty(id, q) {
    if (!ITEMS[id]) return;
    const before = cart[id] || 0;
    q = Math.max(0, Math.min(99, q));
    if (q) cart[id] = q; else delete cart[id];
    store.set(KEY, cart);
    syncControls(id);
    renderCart();
    if (q > before) {
      $$('[data-cart-count]').forEach((b) => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
      if (before === 0) toast(`أُضيف للسلة: ${ITEMS[id].n}`);
    }
  }

  function syncControls(id) {
    const q = cart[id] || 0;
    $$(`[data-ctl="${CSS.escape(id)}"]`).forEach((el) => {
      el.dataset.q = q;
      $('.q', el).textContent = q;
    });
  }

  function renderCart() {
    const n = count();
    const sub = subtotal();
    $$('[data-cart-count]').forEach((b) => { b.textContent = n; if (b.classList.contains('badge')) b.hidden = !n; });
    $$('[data-cart-total]').forEach((t) => (t.innerHTML = moneyHtml(sub + fee())));
    $('[data-cart-bar]')?.classList.toggle('show', n > 0 && !drawer.classList.contains('open'));
    drawer.classList.toggle('has-items', n > 0);

    $('[data-cart-lines]').innerHTML = Object.entries(cart)
      .map(([id, q]) => {
        const it = ITEMS[id];
        const src = /images\.unsplash\.com/.test(it.img) ? `${it.img.split('?')[0]}?w=120&h=120&fit=crop&auto=format&q=60` : it.img;
        return `<li>
          ${src ? `<img src="${src}" alt="" width="56" height="56" loading="lazy">` : '<span></span>'}
          <div><div class="nm">${escapeHtml(it.n)}</div><div class="pr">${moneyHtml(minor(it.p) * q)}</div></div>
          <div class="stepper"><button type="button" data-act="inc" data-id="${id}" aria-label="زيادة">+</button><output class="q">${q}</output><button type="button" data-act="dec" data-id="${id}" aria-label="تقليل">−</button></div>
        </li>`;
      })
      .join('');

    const f = fee();
    $('[data-sub]').innerHTML = moneyHtml(sub);
    $('[data-fee]').innerHTML = moneyHtml(f);
    $('[data-row="sub"]').hidden = !f;
    $('[data-row="fee"]').hidden = !f;
    $('[data-grand]').innerHTML = moneyHtml(sub + f);
    if (!n) errorEl.textContent = '';
  }

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- فتح وإغلاق الدرج ---------- */
  let lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    drawer.classList.add('open');
    document.documentElement.classList.add('lock');
    renderCart();
    setTimeout(() => $('[data-act="close-cart"].icon-btn', drawer)?.focus({ preventScroll: true }), 60);
  }
  function closeCart() {
    drawer.classList.remove('open');
    document.documentElement.classList.remove('lock');
    renderCart();
    lastFocus?.focus?.({ preventScroll: true });
  }

  /* ---------- بيانات الزبون ---------- */
  const saved = store.get('customer', {});
  if (form) {
    if (saved.name) form.elements.name.value = saved.name;
    if (saved.address && form.elements.address) form.elements.address.value = saved.address;
    const table = new URLSearchParams(location.search).get('table');
    if (table && O.types.includes('dinein')) {
      if (form.elements.table) form.elements.table.value = table.slice(0, 6);
      const r = form.querySelector('input[name="type"][value="dinein"]');
      if (r) r.checked = true;
      const chip = $('[data-table-chip]');
      if (chip) { chip.textContent = `طاولة ${table.slice(0, 6)}`; chip.hidden = false; }
    }
    form.dataset.type = orderType();
    form.addEventListener('change', () => { form.dataset.type = orderType(); errorEl.textContent = ''; renderCart(); });
    form.addEventListener('input', (e) => e.target.classList.remove('invalid'));
  }

  /* ---------- إرسال الطلب على واتساب ---------- */
  function invalid(field, msg) {
    errorEl.textContent = msg;
    if (field) { field.classList.add('invalid'); field.focus(); }
    return false;
  }

  function sendOrder() {
    const E = form.elements;
    const name = E.name.value.trim();
    const type = orderType();
    const sub = subtotal();
    if (!count()) return invalid(null, 'السلة فاضية');
    if (!name) return invalid(E.name, 'اكتب اسمك عشان نعرف الطلب لمن');
    if (type === 'delivery') {
      if (!E.address.value.trim() && !geo) return invalid(E.address, 'اكتب عنوان التوصيل أو أضف موقعك');
      if (O.deliveryMinimum && sub < minor(O.deliveryMinimum)) return invalid(null, `الحد الأدنى للتوصيل ${moneyText(minor(O.deliveryMinimum))}`);
    }
    if (type === 'dinein' && E.table && !E.table.value.trim()) return invalid(E.table, 'اكتب رقم الطاولة');

    const address = E.address?.value.trim() || '';
    const notes = E.notes?.value.trim() || '';
    store.set('customer', { name, address });

    const f = fee();
    const L = [];
    L.push(`*طلب جديد · ${CFG.business.name}*`, '');
    L.push(`👤 الاسم: ${name}`);
    L.push(`🛍️ نوع الطلب: ${TYPE_LABEL[type]}`);
    if (type === 'delivery') {
      if (address) L.push(`📍 العنوان: ${address}`);
      if (geo) L.push(`🗺️ الموقع: https://maps.google.com/?q=${geo.lat},${geo.lng}`);
    }
    if (type === 'dinein' && E.table) L.push(`🪑 الطاولة: ${E.table.value.trim()}`);
    L.push('', '*الطلب:*');
    for (const [id, q] of Object.entries(cart)) L.push(`• ${q} × ${ITEMS[id].n}  ←  ${moneyText(minor(ITEMS[id].p) * q)}`);
    L.push('');
    if (f) { L.push(`المجموع: ${moneyText(sub)}`); L.push(`التوصيل: ${moneyText(f)}`); }
    L.push(`*الإجمالي: ${moneyText(sub + f)}*`);
    if (notes) L.push('', `📝 ملاحظات: ${notes}`);

    const url = `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(L.join('\n'))}`;
    const w = window.open(url, '_blank', 'noopener');
    if (!w) location.href = url;
    toast('تم تجهيز طلبك في واتساب، اضغط إرسال هناك ✓');
  }

  function locate(btn) {
    if (!navigator.geolocation) return toast('المتصفح ما يدعم تحديد الموقع');
    const label = $('span', btn);
    label.textContent = 'جاري تحديد موقعك…';
    navigator.geolocation.getCurrentPosition(
      (p) => {
        geo = { lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) };
        label.textContent = '✓ أُضيف موقعك للطلب';
        form.elements.address.classList.remove('invalid');
        errorEl.textContent = '';
      },
      () => { label.textContent = 'أضف موقعي الحالي'; toast('ما قدرنا نحدد موقعك، اكتب العنوان يدوياً'); },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  /* ---------- الإشعار الصغير ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('[data-toast]');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------- الوضع الليلي ---------- */
  function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = isDark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch {}
  }

  /* ---------- كل النقرات من مكان واحد ---------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const id = el.dataset.id;
    switch (el.dataset.act) {
      case 'inc': setQty(id, (cart[id] || 0) + 1); break;
      case 'dec': setQty(id, (cart[id] || 0) - 1); break;
      case 'open-cart': openCart(); break;
      case 'close-cart': closeCart(); break;
      case 'send': sendOrder(); break;
      case 'locate': locate(el); break;
      case 'theme': toggleTheme(); break;
      case 'clear':
        if (confirm('تبي تفرّغ السلة؟')) { const ids = Object.keys(cart); cart = {}; store.set(KEY, cart); ids.forEach(syncControls); renderCart(); }
        break;
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeCart(); });
  addEventListener('error', (e) => { if (e.target.tagName === 'IMG') e.target.classList.add('broken'); }, true);

  Object.keys(cart).forEach(syncControls);
  renderCart();

  /* ================= أوقات الدوام ================= */
  const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt12 = (t) => { let [h, m] = t.split(':').map(Number); const s = h < 12 ? 'ص' : 'م'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${s}`; };

  function nowInTz() {
    try {
      const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', { timeZone: CFG.timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
          .formatToParts(new Date()).map((p) => [p.type, p.value])
      );
      return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday), min: (+parts.hour % 24) * 60 + +parts.minute };
    } catch {
      const d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function hoursStatus() {
    if (!CFG.hours.length) return null;
    const { day, min } = nowInTz();
    for (const h of CFG.hours) {
      const o = toMin(h.open), c = toMin(h.close), overnight = c <= o;
      if (h.days.includes(day) && min >= o && (overnight || min < c)) return { open: true, until: h.close };
      if (overnight && h.days.includes((day + 6) % 7) && min < c) return { open: true, until: h.close };
    }
    for (let k = 0; k <= 7; k++) {
      const d = (day + k) % 7;
      const opts = CFG.hours.filter((h) => h.days.includes(d) && (k > 0 || toMin(h.open) > min)).sort((a, b) => toMin(a.open) - toMin(b.open));
      if (opts.length) return { open: false, at: opts[0].open, when: k === 0 ? 'اليوم' : k === 1 ? 'بكرة' : `يوم ${DAY_NAMES[d]}` };
    }
    return { open: false };
  }

  function renderStatus() {
    const s = hoursStatus();
    const today = nowInTz().day;
    $$('.hours li').forEach((li) => li.classList.toggle('today', li.dataset.days.split(',').map(Number).includes(today)));
    if (!s) return $$('[data-status]').forEach((el) => (el.hidden = true));
    const text = s.open ? `مفتوح الآن · يقفل ${fmt12(s.until)}` : s.at ? `مغلق الآن · يفتح ${s.when} ${fmt12(s.at)}` : 'مغلق الآن';
    $$('[data-status]').forEach((el) => {
      el.textContent = text;
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
    });
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  /* ================= التمرير والحركات ================= */
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = $('[data-header]');
  if (header) {
    let lastY = scrollY;
    const onScroll = () => {
      const y = scrollY;
      header.classList.toggle('scrolled', y > 40);
      // نخفي الهيدر عند النزول في المنيو ونرجعه عند الطلوع
      header.classList.toggle('hide', y > lastY && y > innerHeight * 1.2 && !drawer.classList.contains('open'));
      document.documentElement.style.setProperty('--sticky-top', header.classList.contains('hide') ? '0px' : '');
      lastY = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ظهور تدريجي للعناصر
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const sibs = [...en.target.parentElement.children].filter((c) => c.classList.contains('reveal'));
        en.target.style.setProperty('--rd', `${Math.min(sibs.indexOf(en.target), 6) * 0.07}s`);
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add('in'));

  // تبويبات المنيو تتبع القسم الظاهر
  const tabsEl = $('[data-tabs]');
  const tabs = $$('[data-tab]');
  function activate(id) {
    tabs.forEach((t) => {
      const on = t.dataset.tab === id;
      t.classList.toggle('active', on);
      if (on && tabsEl) {
        const tr = t.getBoundingClientRect(), br = tabsEl.getBoundingClientRect();
        tabsEl.scrollBy({ left: tr.left + tr.width / 2 - (br.left + br.width / 2), behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  }
  if (tabs.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => en.isIntersecting && activate(en.target.dataset.cat));
    }, { rootMargin: '-35% 0px -60% 0px' });
    $$('[data-cat]').forEach((s) => spy.observe(s));
  }

  // البحث في صفحة المنيو
  const search = $('[data-search-input]');
  if (search) {
    const norm = (s) => s.toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
    const cards = $$('.card').map((c) => [c, norm(c.dataset.search || '')]);
    search.addEventListener('input', () => {
      const q = norm(search.value.trim());
      cards.forEach(([c, text]) => (c.hidden = q && !text.includes(q)));
      let any = false;
      $$('[data-cat]').forEach((sec) => {
        const has = $$('.card', sec).some((c) => !c.hidden);
        sec.hidden = !has;
        any ||= has;
      });
      $('[data-no-results]').hidden = any;
      $('[data-tabs]').hidden = !!q;
    });
  }
})();
