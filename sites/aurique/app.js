/* AURIQUE — scroll film + diamond-fire lens + gold sparks + oil curtain */
(() => {
  'use strict';

  /* ---------------- timeline (stitched master: 659 frames @24) ---------------- */
  const FRAMES = 659;
  const K = { A2: 0, A1: 119, A3: 235, A4: 424, k5: 540, A5: 658 };
  const CP = [
    [0, 0], [60, 4],
    [220, 108], [255, 119], [290, 126],          // rest: the bottle
    [430, 226], [465, 235], [500, 242],          // rest: through the facet
    [800, 410], [835, 424], [870, 431],          // the long dive, then rest among the stars
    [1000, 540],
    [1120, 652], [1150, 658],
  ];
  const LIVE_FROM = 1146, CARD_AT = 1160;
  const CURTAIN = [1270, 1370], FILM_VH = 1370;
  const CH = [
    { a: -1,   b: 0,    c: 110,  d: 160,  side: 'l', rest: 20,   name: 'Le cristal' },
    { a: 200,  b: 235,  c: 300,  d: 335,  side: 'r', rest: 262,  name: "L'huile" },
    { a: 410,  b: 445,  c: 510,  d: 545,  side: 'l', rest: 470,  name: 'La facette' },
    { a: 800,  b: 830,  c: 880,  d: 915,  side: 'l', rest: 850,  name: "L'or" },
    { a: 1110, b: 1145, c: 1280, d: 1315, side: 'l', rest: 1200, name: 'La goutte' },
  ];
  const OILS = [
    ['Camélia', 'Japon · le toucher sec'], ['Argan', 'Maroc · la nutrition'], ['Rose musquée', 'Chili · la peau neuve'],
    ['Jojoba', 'Sonora · l’équilibre'], ['Onagre', 'Europe · la souplesse'], ['Squalane d’olive', 'Méditerranée · la seconde peau'],
    ['Or 24 carats', 'en feuilles · l’éclat', 'gold'],
  ];

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced;

  function monotone(pts) { // Fritsch–Carlson
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), n = xs.length, d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (!d[i]) { m[i] = m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
      if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
    }
    return (x) => {
      if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0; while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    };
  }
  const frameAt = monotone(CP);

  /* ---------------- frames ---------------- */
  const film = $('film'), stage = $('stage'), fc = $('filmCanvas'), fx2d = fc.getContext('2d');
  const frames = new Array(FRAMES);
  let tier = 'dnat', loaded = 0, coarseDone = false;
  const chooseTier = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (innerHeight > innerWidth) return 'mnat';
    return Math.max(innerWidth * dpr, innerHeight * dpr * 16 / 9) <= 1280 * 1.15 ? 'd1280' : 'dnat';
  };
  const src = (i) => `frames/${tier}/${String(i + 1).padStart(4, '0')}.webp`;
  const loadFrame = (i) => new Promise((res) => { const im = new Image(); im.decoding = 'async'; im.onload = () => { frames[i] = im; loaded++; res(); }; im.onerror = () => { loaded++; res(); }; im.src = src(i); });
  async function loadAll() {
    const order = [], seen = new Set(), push = (i) => { if (i >= 0 && i < FRAMES && !seen.has(i)) { seen.add(i); order.push(i); } };
    for (let i = 0; i < 24; i++) push(i);
    for (const st of [16, 8, 4, 2, 1]) for (let i = 0; i < FRAMES; i += st) push(i);
    const coarse = order.indexOf(16 * Math.floor((FRAMES - 1) / 16)) + 1;
    let k = 0;
    const worker = async () => { while (k < order.length) { const i = order[k++]; await loadFrame(i); setLoader(Math.min(1, loaded / coarse)); if (!coarseDone && loaded >= coarse) { coarseDone = true; hideLoader(); } if (i === 0) dirty = true; } };
    await Promise.all(Array.from({ length: 6 }, worker));
  }
  const nearest = (i) => { if (frames[i]) return frames[i]; for (let d = 1; d < FRAMES; d++) { if (frames[i - d]) return frames[i - d]; if (frames[i + d]) return frames[i + d]; } return null; };
  const setLoader = (p) => { $('loaderFill').setAttribute('y', String(60 - 60 * p)); $('loaderPct').textContent = Math.round(p * 100); };
  const hideLoader = () => $('loader').classList.add('done');
  setTimeout(hideLoader, 9000);

  let W = 0, H = 0, dpr = 1, vhPx = 1, lastKey = '', dirty = true, texDirty = true;
  function cover(w, h) { const s = Math.max(fc.width / w, fc.height / h); return [(fc.width - w * s) / 2, (fc.height - h * s) / 2, w * s, h * s]; }
  function drawFilm(f) {
    const key = Math.round(f * 20);
    if (key === lastKey && !dirty) return;
    const i = Math.floor(f), t = f - i, a = nearest(i);
    if (!a) return;
    lastKey = key; dirty = false; texDirty = true;
    fx2d.imageSmoothingQuality = 'high';
    fx2d.globalAlpha = 1; fx2d.drawImage(a, ...cover(a.naturalWidth, a.naturalHeight));
    if (t > 0.04 && frames[i + 1]) { fx2d.globalAlpha = t; fx2d.drawImage(frames[i + 1], ...cover(a.naturalWidth, a.naturalHeight)); }
    fx2d.globalAlpha = 1;
  }

  /* ---------------- final loop (real footage) ---------------- */
  const loopV = $('loop');
  let live = false, liveMix = 0;
  function drawLive(dt) {
    if (loopV.readyState < 2) return;
    liveMix = Math.min(1, liveMix + dt / 0.25);
    const last = nearest(FRAMES - 1);
    if (liveMix < 1 && last) { fx2d.globalAlpha = 1; fx2d.drawImage(last, ...cover(last.naturalWidth, last.naturalHeight)); }
    fx2d.globalAlpha = liveMix; fx2d.drawImage(loopV, ...cover(loopV.videoWidth, loopV.videoHeight)); fx2d.globalAlpha = 1;
    texDirty = true; lastKey = '';
  }

  /* ---------------- WebGL overlay: diamond fire lens + oil curtain ---------------- */
  const glc = $('fx');
  const GL = (() => {
    const gl = glc.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fs = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes, uMouse;
uniform float uDpr, uTime, uLens, uLevel, uAmp;
float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 tex(vec2 uv){ return texture2D(uTex, clamp(uv, 0.001, 0.999)).rgb; }
void main(){
  vec2 p = gl_FragCoord.xy, uv = p / uRes;
  vec4 outc = vec4(0.);
  float inOil = 0.;
  // ---- the oil curtain: golden drips run down from the top, then settle into deep amber-black
  if (uLevel > 0.) {
    float x = p.x / uDpr, yTop = (uRes.y - p.y) / uDpr, Hc = uRes.y / uDpr;
    float base = uLevel * (Hc + 560.) - 300.;   // overshoots the bottom so the end state is uniform
    float drips = 0.;
    for (int i = 0; i < 9; i++) {
      float fi = float(i);
      float xi = (fi + 0.5 + (h1(fi) - 0.5) * 0.8) / 9. * (uRes.x / uDpr);
      float wi = 26. + 40. * h1(fi + 7.);
      float li = (120. + 260. * h1(fi + 3.)) * smoothstep(0., 0.55, uLevel);
      drips += li * exp(-pow((x - xi) / wi, 2.));
    }
    float front = base + drips + uAmp * sin(x * 0.012 + uTime * 1.4) + 3. * sin(x * 0.031 - uTime);
    float d = front - yTop;
    if (d > 0.) {
      inOil = 1.;
      float band = 1. - smoothstep(0., 52., d);
      float slope = (sin((x + 2.) * 0.012 + uTime * 1.4) - sin((x - 2.) * 0.012 + uTime * 1.4)) * uAmp * 0.25;
      vec3 seen = mix(tex(uv + vec2(slope * 14., 16. * band) * uDpr / uRes), vec3(0.89, 0.70, 0.35), 0.38);
      float settle = 1. - smoothstep(0.8, 1., uLevel);   // glow and flecks fade out as the oil settles
      vec3 body = mix(vec3(0.071, 0.055, 0.035), vec3(0.62, 0.43, 0.15), exp(-d / 46.) * 0.75 * settle);
      // gold leaf suspended in the oil
      // small round flecks: one candidate per 22 px cell, placed at a random spot inside it
      vec2 gq = vec2(x, yTop - uTime * 6.) / 22.;
      vec2 cell = floor(gq), fq = fract(gq) - 0.5;
      float r = h2(cell);
      vec2 oc = (vec2(h2(cell + 1.3), h2(cell + 7.1)) - 0.5) * 0.6;
      float dotm = 1. - smoothstep(0.03, 0.09, length(fq - oc));
      float fl = step(0.82, r) * dotm * (0.5 + 0.5 * sin(uTime * 3. + r * 40.)) * (1. - band) * exp(-d / 420.) * settle;
      vec3 col = mix(body, seen, band * 0.85) + vec3(0.95, 0.75, 0.38) * fl * 0.55;
      col += (1. - smoothstep(0., 1.8, d)) * vec3(1., 0.9, 0.65) * 0.75 * settle;
      outc = vec4(col, 1.);
    }
  }
  // ---- the diamond-fire lens under the cursor
  if (uLens > 0. && inOil < 0.5) {
    vec2 dv = p - uMouse; float R = uLens * uDpr, dist = length(dv), r = dist / R;
    if (r < 1.) {
      vec2 dir = dv / max(dist, 1.);
      vec2 base = (uMouse + dv * 0.86) / uRes;
      vec2 o = dir * r * r * 9. * uDpr / uRes;
      vec3 col = vec3(tex(base - o).r, tex(base).g, tex(base + o).b);
      float ang = atan(dir.y, dir.x);
      float facet = floor((ang + 3.14159) / 0.7854);
      col *= 0.95 + 0.1 * h1(facet) * r;
      vec3 rainbow = 0.5 + 0.5 * cos(6.2831 * (ang / 6.2831 + uTime * 0.05 + vec3(0., 0.33, 0.67)));
      col = mix(col, rainbow, smoothstep(0.9, 1., r) * 0.45);
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float a = fi * 2.094 + uTime * 0.5;
        vec2 sp = (dv - vec2(cos(a), sin(a)) * R * 0.5) / uDpr;
        float tw = 0.5 + 0.5 * sin(uTime * 4. + fi * 2.);
        float star = exp(-abs(sp.x) * 0.9) * exp(-abs(sp.y) * 5.) + exp(-abs(sp.y) * 0.9) * exp(-abs(sp.x) * 5.);
        col += vec3(1., 0.95, 0.85) * star * tw * 0.35;
      }
      float al = smoothstep(1., 0.965, r);
      outc = vec4(col * al, al) + outc * (1. - al);
    }
  }
  gl_FragColor = outc;
}`;
    const sh = (t, c) => { const o = gl.createShader(t); gl.shaderSource(o, c); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(o)); return null; } return o; };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    const U = {}; ['uTex', 'uRes', 'uMouse', 'uDpr', 'uTime', 'uLens', 'uLevel', 'uAmp'].forEach((n) => (U[n] = gl.getUniformLocation(pr, n)));
    return { gl, U, dpr: 1, cleared: true };
  })();
  // no WebGL: the curtain becomes a plain fade
  const fade = document.createElement('div');
  fade.style.cssText = 'position:absolute;inset:0;z-index:6;background:#120E09;opacity:0;pointer-events:none';
  stage.appendChild(fade);

  /* ---------------- gold sparks on scroll speed ---------------- */
  const sc = $('sparks'), sx = sc.getContext('2d');
  const sparks = [];
  function updateSparks(dt) {
    const want = Math.min(6, Math.abs(sv) * 0.35) * (level < 0.05 ? 1 : 0);
    for (let n = Math.floor(want + Math.random()); n > 0; n--) {
      if (sparks.length > 140) break;
      sparks.push({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 1.8, life: 0, max: 0.9 + Math.random() * 1.1, ph: Math.random() * 6, vy: -6 - Math.random() * 14 });
    }
    sx.clearRect(0, 0, W, H);
    if (!sparks.length) return;
    sx.globalCompositeOperation = 'lighter';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i]; p.life += dt; p.y += p.vy * dt;
      if (p.life > p.max) { sparks.splice(i, 1); continue; }
      const k = Math.sin(Math.PI * p.life / p.max) * (0.55 + 0.45 * Math.sin(p.life * 22 + p.ph));
      sx.fillStyle = `rgba(246,216,142,${(0.85 * k).toFixed(3)})`;
      sx.beginPath(); sx.arc(p.x, p.y, p.r, 0, 6.283); sx.fill();
      if (p.r > 1.7) { // a four-point glint on the bigger ones
        sx.strokeStyle = `rgba(255,240,205,${(0.5 * k).toFixed(3)})`; sx.lineWidth = 0.6;
        sx.beginPath(); sx.moveTo(p.x - p.r * 4, p.y); sx.lineTo(p.x + p.r * 4, p.y); sx.moveTo(p.x, p.y - p.r * 4); sx.lineTo(p.x, p.y + p.r * 4); sx.stroke();
      }
    }
    sx.globalCompositeOperation = 'source-over';
  }

  /* ---------------- layout ---------------- */
  function resize() {
    W = innerWidth; H = stage.clientHeight; dpr = Math.min(devicePixelRatio || 1, 2.5);
    fc.width = Math.round(W * dpr); fc.height = Math.round(H * dpr);
    sc.width = W; sc.height = H;
    vhPx = H / 100; film.style.height = `${(FILM_VH / 100 + 1) * H}px`;
    if (GL) { GL.dpr = Math.min(dpr, 1.75); glc.width = Math.round(W * GL.dpr); glc.height = Math.round(H * GL.dpr); GL.gl.viewport(0, 0, glc.width, glc.height); }
    lastKey = ''; dirty = true;
  }

  /* ---------------- scroll ---------------- */
  const lenis = window.Lenis && !reduced ? new Lenis({ lerp: 0.075, wheelMultiplier: 0.85, smoothWheel: true }) : null;
  let s = 0, sv = 0, lastSY = scrollY, target = 0, cur = 0, level = 0;
  const scrollToVh = (v) => {
    const top = film.offsetTop + v * vhPx, dur = Math.max(1.2, Math.abs(frameAt(v) - cur) / 90);
    if (lenis) lenis.scrollTo(top, { duration: dur, easing: (t) => -(Math.cos(Math.PI * t) - 1) / 2 }); else scrollTo({ top, behavior: 'smooth' });
  };
  const scrollToEl = (el) => (lenis ? lenis.scrollTo(el, { duration: 2 }) : el.scrollIntoView({ behavior: 'smooth' }));

  /* ---------------- chapters, rail, card ---------------- */
  const chaps = [...document.querySelectorAll('.chap')];
  chaps.forEach((c) => c.querySelectorAll('.ln').forEach((ln) => { const sp = document.createElement('span'); while (ln.firstChild) sp.appendChild(ln.firstChild); ln.appendChild(sp); }));
  const scrimL = $('scrimL'), scrimR = $('scrimR'), rail = $('rail'), gem = $('gem');
  const railBtns = CH.map((c, i) => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', `Chapitre ${i + 1} — ${c.name}`);
    b.innerHTML = `<span class="tip mono">${c.name}</span><span class="d"></span>`;
    b.addEventListener('click', () => scrollToVh(c.rest)); li.appendChild(b); rail.appendChild(li); return b;
  });
  function updateChapters() {
    let active = -1;
    chaps.forEach((el, i) => {
      const c = CH[i];
      const fin = c.a < 0 ? 1 : smooth(clamp((s - c.a) / (c.b - c.a), 0, 1)), fout = smooth(clamp((c.d - s) / (c.d - c.c), 0, 1));
      const o = Math.min(fin, fout);
      el.style.opacity = o.toFixed(3); el.style.visibility = o > 0.005 ? 'visible' : 'hidden';
      el.classList.toggle('in', s >= c.a + (c.b - c.a) * 0.3 && s <= c.d);
      if (o > 0.5) active = i;
    });
    scrimL.classList.toggle('on', active >= 0 && CH[active].side === 'l' && level < 0.2);
    scrimR.classList.toggle('on', active >= 0 && CH[active].side === 'r' && level < 0.2);
    railBtns.forEach((b, i) => b.classList.toggle('on', i === active));
    rail.classList.toggle('hide', level > 0.6);
    const show = live && s >= CARD_AT && level < 0.35;
    gem.classList.toggle('show', show); stage.classList.toggle('card-up', show);
  }

  /* ---------------- pointer ---------------- */
  let mx = -1, my = -1, lensR = 0;
  const cursor = $('cursor');
  if (fine) {
    document.body.classList.add('cursor-ready');
    addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.style.transform = `translate3d(${mx}px, ${my}px, 0)`; cursor.classList.add('visible');
      cursor.classList.toggle('big', !!(e.target.closest && e.target.closest('a, button')));
      const r = gem.getBoundingClientRect();
      gem.style.setProperty('--gx', `${((mx - r.left) / r.width * 100).toFixed(1)}%`);
      gem.style.setProperty('--gy', `${((my - r.top) / r.height * 100).toFixed(1)}%`);
    }, { passive: true });
    document.addEventListener('pointerleave', () => { mx = -1; cursor.classList.remove('visible'); });
  }

  /* ---------------- render overlay ---------------- */
  let amp = 0;
  function renderFx(t) {
    if (!GL) { fade.style.opacity = level.toFixed(3); return; }
    const { gl, U } = GL, g = GL.dpr;
    const overText = mx >= 0 && document.elementFromPoint(mx, my)?.closest('.chap, .gem, header, .rail');
    lensR = lerp(lensR, fine && mx >= 0 && !overText && level < 0.98 && scrollY < film.offsetTop + film.offsetHeight - H ? 70 : 0, 0.18);
    if (lensR < 0.5 && level <= 0) { if (!GL.cleared) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); GL.cleared = true; } return; }
    GL.cleared = false;
    if (texDirty) { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fc); texDirty = false; }
    amp = lerp(amp, Math.min(30, Math.abs(sv) * 1.2), 0.08);
    gl.uniform2f(U.uRes, glc.width, glc.height);
    gl.uniform2f(U.uMouse, mx * g, (H - my) * g);
    gl.uniform1f(U.uDpr, g); gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uLens, lensR > 0.5 ? lensR : 0); gl.uniform1f(U.uLevel, level); gl.uniform1f(U.uAmp, 4 + amp);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ---------------- after the film ---------------- */
  $('oils').innerHTML = OILS.map(([n, d, g]) => `<li class="reveal ${g || ''}"><b>${n}</b><span class="mono">${d}</span></li>`).join('');
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  $('orderBtn').addEventListener('click', () => { $('orderMsg').textContent = 'Merci — ceci est un concept, aucune commande n’est passée.'; });
  $('back').addEventListener('click', (e) => { e.preventDefault(); if (lenis) lenis.scrollTo(0, { duration: 8, easing: (t) => -(Math.cos(Math.PI * t) - 1) / 2 }); else scrollTo({ top: 0, behavior: 'smooth' }); });
  document.querySelectorAll('[data-go]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollToVh(CH[+a.dataset.go].rest); }));
  document.querySelectorAll('[data-anchor]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollToEl($(a.dataset.anchor)); }));

  /* ---------------- loop ---------------- */
  let lt = performance.now();
  function tick(time) {
    const dt = Math.min(0.05, (time - lt) / 1000 || 0.016); lt = time;
    if (lenis) lenis.raf(time);
    s = (scrollY - film.offsetTop) / vhPx;
    target = Math.round(clamp(frameAt(s), 0, FRAMES - 1));
    sv = lerp(sv, (scrollY - lastSY) / Math.max(dt, 0.001) / Math.max(vhPx, 1), 1 - Math.exp(-dt * 16)); lastSY = scrollY;
    cur += (target - cur) * (1 - Math.exp(-dt * 15)); if (Math.abs(target - cur) < 0.01) cur = target;

    const wantLive = s >= LIVE_FROM && cur > FRAMES - 3 && loopV.readyState >= 2;
    if (wantLive !== live) { live = wantLive; liveMix = 0; if (live) { loopV.currentTime = 0; loopV.play().catch(() => {}); } else { loopV.pause(); dirty = true; } }
    if (live) drawLive(dt); else drawFilm(cur);

    level = smooth(clamp((s - CURTAIN[0]) / (CURTAIN[1] - CURTAIN[0]), 0, 1));
    updateChapters();
    updateSparks(dt);
    renderFx(time / 1000);
    requestAnimationFrame(tick);
  }

  let rt = 0, lastW = innerWidth;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => {
    if (Math.abs(innerWidth - lastW) < 2 && innerWidth <= 820) return; lastW = innerWidth;
    const t = chooseTier(); if (t !== tier) { tier = t; frames.fill(undefined); loaded = 0; loadAll(); }
    resize();
  }, 120); });

  window.__aurique = { jump: (v) => { const top = film.offsetTop + v * vhPx; if (lenis) lenis.scrollTo(top, { immediate: true }); else scrollTo(0, top); }, state: () => ({ s, frame: cur, live, level, loaded, tier }) };

  tier = chooseTier(); resize();
  s = (scrollY - film.offsetTop) / vhPx; cur = Math.round(clamp(frameAt(s), 0, FRAMES - 1));
  loadAll(); loopV.load();
  requestAnimationFrame(tick);
})();
