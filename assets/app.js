/* Concepts IA — Mang Production.
   The opening: a reel of every concept plays inside the "mp" monogram (a CSS mask); the scroll
   opens the monogram through the stem of the p until the film fills the screen.
   Then the index, as the site's Projects page: a list with a preview that follows the cursor
   and scrubs the film, or a mosaic. */
(() => {
  const D = window.CONCEPTS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- assets ---------- */
  const loadImg = (src) => new Promise((res) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const REEL = new Array(D.reel.length).fill(null);
  const THUMBS = {};
  const thumbs = (slug) => THUMBS[slug] || (THUMBS[slug] = Array.from({ length: D.nThumbs }, (_, i) => { const im = new Image(); im.src = `thumbs/${slug}/${pad(i)}.webp`; return im; }));

  /* ---------- smooth scroll ---------- */
  const lenis = reduce ? null : new Lenis({ lerp: .09, wheelMultiplier: .95 });
  const scrollY_ = () => (lenis ? lenis.scroll : scrollY);
  const goTo = (target) => (lenis ? lenis.scrollTo(target, { duration: 1.8 }) : (typeof target === 'number' ? scrollTo(0, target) : $(target).scrollIntoView()));
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const h = a.getAttribute('href'); if (h.length > 1 && $(h)) { e.preventDefault(); goTo(h === '#top' ? 0 : h); } }));

  /* ---------- the reel inside the monogram ---------- */
  const RATIO = 1253.75 / 850.75;
  const STEM = [811 / 1253.75, 488 / 850.75]; // centre of the p's stem, in the mark's box
  const hero = $('#hero'), reel = $('#reel'), cv = $('#reelCv'), cx = cv.getContext('2d');
  const copy = $('#heroCopy'), cap = $('#heroCap'), hint = $('#heroHint'), shade = $('.reel-shade');
  let W = innerWidth, H = innerHeight;
  function size() {
    W = innerWidth; H = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }
  function cover(img) {
    const a = img.naturalWidth / img.naturalHeight, b = cv.width / cv.height;
    let w = cv.width, h = cv.height; if (a > b) w = h * a; else h = w / a;
    cx.drawImage(img, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
  }
  let lastIdx = -1, lastCap = -1;
  function drawReel(t, p) {
    const n = REEL.length;
    let idx = Math.floor(t * 6 + p * n * 1.15) % n;
    // nearest loaded frame
    for (let d = 0; d < n && !REEL[(idx + n - d) % n]; d++) if (d === n - 1) return;
    while (!REEL[idx]) idx = (idx + n - 1) % n;
    if (idx !== lastIdx) { cover(REEL[idx]); lastIdx = idx; }
    const s = D.reel[idx];
    if (s !== lastCap) { lastCap = s; const c = D.items[s]; $('#capNum').textContent = pad(s + 1); $('#capName').textContent = c.name; $('#capLine').textContent = c.line; }
  }
  function heroFrame(t) {
    const span = Math.max(1, hero.offsetHeight - H);
    const p = clamp((scrollY_() - hero.offsetTop) / span);
    const z = reduce ? 1 : smooth(clamp((p - .06) / .64));
    // the mark: centred at rest, then the zoom heads into the stem of the p
    const w0 = Math.min(W * .5, H * .56 * RATIO), wEnd = Math.max(W * 16.5, H * 2.4);
    const w = w0 * Math.pow(wEnd / w0, z), h = w / RATIO;
    const k = smooth(clamp(z * 1.8));
    const ax = lerp(.5, STEM[0], k), ay = lerp(.5, STEM[1], k);
    const ox = W / 2 - ax * w, oy = H * lerp(.43, .5, k) - ay * h;
    const open = z >= .999;
    reel.classList.toggle('open', open);
    if (!open) { reel.style.webkitMaskSize = reel.style.maskSize = `${w}px ${h}px`; reel.style.webkitMaskPosition = reel.style.maskPosition = `${ox}px ${oy}px`; }
    copy.style.opacity = 1 - clamp(z * 4); copy.style.transform = `translateY(${z * 60}px)`;
    hint.style.opacity = 1 - clamp(p * 10);
    const c = clamp((p - .66) / .12); cap.style.opacity = c; shade.style.opacity = c;
    if (p < 1.02) drawReel(t / 1000, p);
  }

  /* ---------- header: hides going down, comes back with the soft night going up ---------- */
  const top = $('#top'); let lastY = 0;
  function header() {
    const y = scrollY_();
    top.classList.toggle('away', y > lastY + 2 && y > 160);
    if (y < lastY - 2 || y < 160) top.classList.remove('away');
    top.classList.toggle('shade', y > 40);
    lastY = y;
  }

  /* ---------- the list: a preview follows the cursor and scrubs the film ---------- */
  const fl = $('#float'), flImg = $('img', fl), flBar = $('.bar i', fl), cur = $('#cursor');
  const m = { x: W / 2, y: H / 2 }, fp = { x: W / 2, y: H / 2 }, cp = { x: W / 2, y: H / 2 };
  let onRow = null;
  const show = (img, bar, slug, k) => {
    const fr = thumbs(slug), n = fr.length, i = Math.round(clamp(k) * (n - 1));
    const ok = (j) => fr[j] && fr[j].complete && fr[j].naturalWidth;
    for (let d = 0; d < n; d++) { const j = ok(i - d) ? i - d : ok(i + d) ? i + d : -1; if (j >= 0) { if (img.getAttribute('src') !== fr[j].src) img.src = fr[j].src; break; } }
    bar.style.width = `${(i / (n - 1)) * 100}%`;
  };
  if (fine) {
    addEventListener('pointermove', (e) => { m.x = e.clientX; m.y = e.clientY; cur.classList.add('on'); });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    $$('.row a').forEach((a) => {
      const slug = a.dataset.slug;
      a.addEventListener('pointerenter', (e) => { onRow = a; thumbs(slug); flImg.src = `thumbs/${slug}/08.webp`; const r = a.getBoundingClientRect(); show(flImg, flBar, slug, (e.clientX - r.left) / r.width); fl.classList.add('on'); cur.classList.add('big'); });
      a.addEventListener('pointermove', (e) => { const r = a.getBoundingClientRect(); show(flImg, flBar, slug, (e.clientX - r.left) / r.width); });
      a.addEventListener('pointerleave', () => { onRow = null; fl.classList.remove('on'); cur.classList.remove('big'); });
    });
    $$('.tile').forEach((a) => {
      const slug = a.dataset.slug, img = $('.ph img', a), bar = $('.bar i', a);
      a.addEventListener('pointerenter', () => { thumbs(slug); cur.classList.add('big'); });
      a.addEventListener('pointermove', (e) => { const r = $('.ph', a).getBoundingClientRect(); show(img, bar, slug, (e.clientX - r.left) / r.width); });
      a.addEventListener('pointerleave', () => { cur.classList.remove('big'); show(img, bar, slug, 8 / (D.nThumbs - 1)); });
    });
  }
  // phones and tablets: the mosaic's films play by themselves while on screen
  const playing = new Set(); let tick = 0;
  if (!fine) setInterval(() => { tick++; playing.forEach((a) => show($('.ph img', a), $('.bar i', a), a.dataset.slug, (tick % D.nThumbs) / (D.nThumbs - 1))); }, 140);
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) e.target.classList.add('in');
    if (!fine && e.target.classList.contains('tile')) { e.target.classList.toggle('live', e.isIntersecting); e.isIntersecting ? playing.add(e.target) : playing.delete(e.target); }
  }), { threshold: .2 });
  $$('.reveal, .tile').forEach((el) => io.observe(el));

  // the view toggle
  const sec = $('#concepts');
  $$('.toggle button').forEach((b) => b.addEventListener('click', () => {
    $$('.toggle button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    sec.classList.toggle('is-grid', b.dataset.view === 'grid');
    lenis && lenis.resize();
  }));

  /* ---------- loop ---------- */
  function frame(t) {
    lenis && lenis.raf(t);
    heroFrame(t); header();
    if (fine) {
      fp.x = lerp(fp.x, m.x, .12); fp.y = lerp(fp.y, m.y, .12);
      cp.x = lerp(cp.x, m.x, .3); cp.y = lerp(cp.y, m.y, .3);
      const fw = fl.offsetWidth, fh = fl.offsetHeight;
      fl.style.transform = `translate(${fp.x - fw / 2}px, ${fp.y - fh * 1.15}px)`;
      cur.style.translate = `${cp.x}px ${cp.y}px`;
      if (onRow && !fl.classList.contains('on')) fl.classList.add('on');
    }
    requestAnimationFrame(frame);
  }
  addEventListener('resize', () => { size(); lastIdx = -1; });

  /* ---------- boot: the monogram fills as the reel arrives ---------- */
  (async () => {
    size();
    const fill = $('#introFill'), pct = $('#introPct'), intro = $('#intro');
    let done = 0; const total = REEL.length;
    const step = () => { done++; const v = Math.round((done / total) * 100); fill.style.clipPath = `inset(${100 - v}% 0 0 0)`; pct.textContent = `${v} %`; };
    const order = [];
    for (let s = 8; s >= 1; s >>= 1) for (let i = 0; i < total; i += s) if (!order.includes(i)) order.push(i);
    const first = order.slice(0, Math.ceil(total / 2));
    const rest = order.slice(first.length);
    const fetchOne = async (i) => { REEL[i] = await loadImg(`reel/${pad3(i)}.webp`); step(); };
    const timeout = new Promise((r) => setTimeout(r, 7000));
    await Promise.race([Promise.all(first.map(fetchOne)), timeout]);
    requestAnimationFrame(frame);
    setTimeout(() => { intro.classList.add('out'); setTimeout(() => intro.remove(), 1200); }, 250);
    for (let i = 0; i < rest.length; i += 6) await Promise.all(rest.slice(i, i + 6).map(fetchOne));
  })();
  function pad3(n) { return String(n).padStart(3, '0'); }
})();
