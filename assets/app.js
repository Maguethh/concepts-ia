/* Mang Production — internal presentation of the AI concepts.
   The concepts' loops play one after the other inside the "mp" monogram (a CSS mask), crossfading;
   the scroll opens the monogram through the stem of the p until the film fills the screen.
   Then a grid: each tile plays its loop on hover (on phones, while on screen). */
(() => {
  const C = window.CONCEPTS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // always open on the monogram
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  const lenis = reduce ? null : new Lenis({ lerp: .09, wheelMultiplier: .95 });
  const sy = () => (lenis ? lenis.scroll : scrollY);
  $('#toTop').addEventListener('click', (e) => { e.preventDefault(); lenis ? lenis.scrollTo(0, { duration: 2 }) : scrollTo(0, 0); });

  /* ---------- the loops inside the monogram ---------- */
  const vids = [$('#vA'), $('#vB')];
  let cur = 0, idx = 0, timer = 0;
  const src = (i) => `clips/${C[i % C.length].slug}.mp4`;
  function playNext() {
    const next = vids[1 - cur];
    idx = (idx + 1) % C.length;
    next.src = src(idx); next.currentTime = 0;
    next.play().catch(() => {});
    next.addEventListener('playing', () => {
      next.classList.add('on'); vids[cur].classList.remove('on');
      const old = vids[cur]; setTimeout(() => old.pause(), 1500);
      cur = 1 - cur; schedule(next);
    }, { once: true });
  }
  function schedule(v) {
    clearTimeout(timer);
    const left = (isFinite(v.duration) ? v.duration : 6) - v.currentTime - 1.5;
    timer = setTimeout(playNext, Math.max(1500, left * 1000));
  }

  /* ---------- opening the monogram ---------- */
  const RATIO = 1253.75 / 850.75, STEM = [811 / 1253.75, 488 / 850.75];
  const hero = $('#hero'), reel = $('#reel'), hint = $('.hint'), top = $('#top');
  function heroFrame() {
    const W = innerWidth, H = innerHeight;
    const p = clamp((sy() - hero.offsetTop) / Math.max(1, hero.offsetHeight - H));
    const z = reduce ? 0 : smooth(clamp((p - .05) / .7));
    const w0 = Math.min(W * .56, H * .6 * RATIO), wEnd = Math.max(W * 16.5, H * 2.4);
    const w = w0 * Math.pow(wEnd / w0, z), h = w / RATIO;
    const k = smooth(clamp(z * 1.8));
    const ax = lerp(.5, STEM[0], k), ay = lerp(.5, STEM[1], k);
    const ox = W / 2 - ax * w, oy = H * .5 - ay * h;
    const open = z >= .999;
    reel.classList.toggle('open', open);
    if (!open) { reel.style.webkitMaskSize = reel.style.maskSize = `${w}px ${h}px`; reel.style.webkitMaskPosition = reel.style.maskPosition = `${ox}px ${oy}px`; }
    hint.style.opacity = 1 - clamp(p * 10);
    top.classList.toggle('away', p < .8 && sy() < hero.offsetHeight - H);
  }

  /* ---------- the grid ---------- */
  const cursor = $('#cursor'); const m = { x: 0, y: 0 }, c = { x: 0, y: 0 };
  const start = (t) => { const v = $('video', t); v.preload = 'auto'; v.play().then(() => t.classList.add('play')).catch(() => {}); };
  const stop = (t) => { const v = $('video', t); t.classList.remove('play'); setTimeout(() => { if (!t.classList.contains('play')) v.pause(); }, 700); };
  if (fine) {
    addEventListener('pointermove', (e) => { m.x = e.clientX; m.y = e.clientY; });
    $$('.tile').forEach((t) => {
      t.addEventListener('pointerenter', () => { start(t); cursor.classList.add('big'); });
      t.addEventListener('pointerleave', () => { stop(t); cursor.classList.remove('big'); });
    });
  }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) e.target.classList.add('in');
    if (!fine) (e.intersectionRatio > .6 ? start : stop)(e.target);
  }), { threshold: [0, .2, .6] });
  $$('.tile').forEach((t) => io.observe(t));

  /* ---------- loop ---------- */
  function frame(t) {
    lenis && lenis.raf(t);
    heroFrame();
    if (fine) { c.x = lerp(c.x, m.x, .25); c.y = lerp(c.y, m.y, .25); cursor.style.translate = `${c.x}px ${c.y}px`; }
    requestAnimationFrame(frame);
  }

  /* ---------- boot: the monogram fills while the first loop buffers ---------- */
  const fill = $('#introFill'), intro = $('#intro');
  const first = vids[0];
  first.src = src(0);
  const prog = setInterval(() => {
    const b = first.buffered.length ? first.buffered.end(first.buffered.length - 1) / (first.duration || 6) : 0;
    fill.style.clipPath = `inset(${100 - clamp(b) * 100}% 0 0 0)`;
  }, 100);
  let booted = false;
  const boot = () => {
    if (booted) return; booted = true; clearInterval(prog);
    fill.style.clipPath = 'inset(0 0 0 0)';
    first.play().catch(() => {}); first.classList.add('on'); schedule(first);
    requestAnimationFrame(frame);
    setTimeout(() => { intro.classList.add('out'); setTimeout(() => intro.remove(), 1200); }, 450);
  };
  first.addEventListener('canplaythrough', boot, { once: true });
  setTimeout(boot, 6000);
})();
