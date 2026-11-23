/* =====================================================================
   OPERCULE — scroll film engine + interactions
   One continuous 24 fps film (583 frames) scrubbed by scroll, then a live
   candle (real filmed loop / blow-out) composited in WebGL, then the wax
   "coulée" that carries the page onto set ivory.
   ===================================================================== */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     Timeline. Frame indices come from the stitched master
     (seams at 3.98 / 8.81 / 12.65 / 15.48 / 19.32 s).
  ------------------------------------------------------------------ */
  const FRAMES = 583;
  const K = { k1: 0, k2: 96, k3: 212, k3b: 304, k4: 372, k5: 464, k6: 582 };
  // (scroll in viewport-heights, frame). Rests have gentle slopes; k3b / k5 are crossed at cruise speed.
  const CP = [
    [0, 0], [70, 5],
    [222, 90], [255, 96], [290, 102],
    [480, 205], [528, 212], [563, 219],      // the melt gets more scroll
    [740, 304],                              // approach to the surface
    [862, 366], [892, 372], [925, 378],      // the dive, held longer
    [1030, 464],
    [1160, 575], [1198, 582],
  ];
  const LIVE_FROM = 1194;      // the real flame takes over here
  const POUR_AT = 1208;        // the product tablet pours
  const COULEE = [1328, 1420]; // wax rises over the film
  const FILM_VH = 1420;
  const CHAPTERS = [
    { a: -1,   b: 0,    c: 120,  d: 165,  scrim: 'L', rest: 18,   name: 'I — La matière brute',   t: 21 },
    { a: 195,  b: 232,  c: 305,  d: 340,  scrim: 'R', rest: 268,  name: 'II — La pierre',         t: 35 },
    { a: 463,  b: 498,  c: 573,  d: 610,  scrim: 'L', rest: 536,  name: 'III — Point de fusion',  t: 64 },
    { a: 830,  b: 862,  c: 930,  d: 968,  scrim: 'L', rest: 888,  name: 'IV — Immersion',         t: 72 },
    { a: 980,  b: 1008, c: 1090, d: 1125, scrim: 'V', rest: 1045,  name: 'V — La prise',           t: 60 },
    { a: 1140, b: 1175, c: 1332, d: 1368, scrim: 'L', rest: 1252, name: 'VI — Le soir',           t: 1000 },
  ];
  // Wax temperature along the film (°C), monotone-interpolated on the same frame index.
  const TEMP = [[K.k1, 21], [K.k2, 35], [K.k3, 64], [K.k3b, 68], [K.k4, 72], [K.k5, 60], [K.k6 - 40, 80], [K.k6, 1000]];
  // Flame in source UV (1920×1076 frame): x, tip y, base y, half-width.
  const FLAME = { x: 0.5, top: 0.15, base: 0.43, hw: 0.022 };

  /* ------------------------------------------------------------------ utils */
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isMobile = () => innerWidth <= 820;

  // Fritsch–Carlson monotone cubic: C1, never overshoots, so scroll speed never "breaks".
  function monotone(points) {
    const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]), n = xs.length;
    const d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
      const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
      if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
    }
    return (x) => {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0; while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    };
  }
  const frameAt = monotone(CP);
  const tempAt = monotone(TEMP);

  /* ------------------------------------------------------------------ frames */
  const film = $('film'), stage = $('stage');
  const fc = $('filmCanvas'), fx = fc.getContext('2d');
  const frames = new Array(FRAMES);
  let tier = 'dnat', loaded = 0, coarseDone = false;

  function chooseTier() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (innerHeight > innerWidth) return 'mnat';               // native 9:16 centre crop, never upscaled twice
    const need = Math.max(innerWidth * dpr, innerHeight * dpr * 16 / 9);
    return need <= 1280 * 1.15 ? 'd1280' : 'dnat';
  }
  const src = (i) => `frames/${tier}/${String(i + 1).padStart(4, '0')}.webp`;
  function loadFrame(i) {
    return new Promise((res) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => img.decode().catch(() => {}).then(() => { frames[i] = img; loaded++; res(); });
      img.onerror = () => { loaded++; res(); };
      img.src = src(i);
    });
  }
  function loadOrder() {
    const order = [], seen = new Set();
    const push = (i) => { if (i >= 0 && i < FRAMES && !seen.has(i)) { seen.add(i); order.push(i); } };
    for (let i = 0; i < 24; i++) push(i);
    for (const step of [16, 8, 4, 2, 1]) for (let i = 0; i < FRAMES; i += step) push(i);
    push(FRAMES - 1);
    return order;
  }
  async function loadAll() {
    const order = loadOrder();
    /* loader v2 */
    // where the visitor is first (12 frames behind to 72 ahead of the current one), then coarse to fine;
    // the loader waits for the 1/16 pass and the 72 frames ahead
    const gen = tier, req = new Uint8Array(FRAMES);
    let k = 0;
    const here = () => Math.max(0, Math.min(FRAMES - 1, Math.round(Number.isFinite(curFrame) ? curFrame : 0)));
    const pick = () => {
      const c = here();
      for (let d = 0; d <= 72; d++) {
        const f = c + d; if (f < FRAMES && !req[f]) { req[f] = 1; return f; }
        if (d <= 12) { const g = c - d; if (g >= 0 && !req[g]) { req[g] = 1; return g; } }
      }
      while (k < order.length) { const i = order[k++]; if (!req[i]) { req[i] = 1; return i; } }
      return -1;
    };
    const need = Math.ceil(FRAMES / 16) + 73;
    const gate = () => {
      for (let i = 0; i < FRAMES; i += 16) if (!frames[i]) return false;
      const c = here(); for (let i = c; i < Math.min(FRAMES, c + 73); i++) if (!frames[i]) return false;
      return true;
    };
    const worker = async () => {
      for (let i = pick(); i >= 0 && gen === tier; i = pick()) {
        await loadFrame(i);
        if (!coarseDone) { setLoader(Math.min(.99, loaded / need)); if (gate()) { coarseDone = true; setLoader(1); hideLoader(); } }
        if (i === 0) needDraw = true;
      }
    };
    await Promise.all(Array.from({ length: 10 }, worker));
  }
  function nearest(i) {
    if (frames[i]) return frames[i];
    for (let d = 1; d < FRAMES; d++) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  }

  /* loader */
  const loaderEl = $('loader'), loaderFill = $('loaderFill'), loaderPct = $('loaderPct');
  function setLoader(p) { loaderFill.setAttribute('y', String(115 - 115 * p)); loaderPct.textContent = Math.round(p * 100); }
  function hideLoader() { loaderEl.classList.add('done'); }
  setTimeout(hideLoader, 9000); // never trap the visitor

  /* ------------------------------------------------------------------ film canvas */
  let W = 0, H = 0, dprF = 1, vhPx = 1, lastKey = '', needDraw = true;
  function resize() {
    W = innerWidth; H = stage.clientHeight;
    dprF = Math.min(devicePixelRatio || 1, 2.5);
    fc.width = Math.round(W * dprF); fc.height = Math.round(H * dprF);
    vhPx = H / 100;
    film.style.height = `${(FILM_VH / 100 + 1) * H}px`;
    lastKey = ''; needDraw = true;
    resizeLive();
    measureLetters();
  }
  function paint(img, alpha) {
    const s = Math.max(fc.width / img.naturalWidth, fc.height / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    fx.globalAlpha = alpha;
    fx.drawImage(img, (fc.width - w) / 2, (fc.height - h) / 2, w, h);
  }
  function drawFilm(f) {
    const key = Math.round(f * 20);
    if (key === lastKey && !needDraw) return;
    const i = Math.floor(f), t = f - i;
    const a = nearest(i);
    if (!a) return;
    lastKey = key; needDraw = false;
    fx.imageSmoothingEnabled = true; fx.imageSmoothingQuality = 'high';
    paint(a, 1);
    // between two frames while moving; a whole frame at rest (target is always an integer)
    if (t > 0.04 && frames[i + 1]) paint(frames[i + 1], t);
    fx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------------ scroll */
  const lenis = window.Lenis && !reduced
    ? new Lenis({ lerp: 0.075, wheelMultiplier: 0.85, smoothWheel: true, syncTouch: false })
    : null;
  let s = 0, sv = 0, lastSY = scrollY, targetFrame = 0, curFrame = 0;
  function readScroll() {
    s = (scrollY - film.offsetTop) / vhPx;
    targetFrame = Math.round(clamp(frameAt(s), 0, FRAMES - 1));
  }
  function scrollToVh(v, opts = {}) {
    const top = film.offsetTop + v * vhPx;
    const frames = Math.abs(frameAt(v) - curFrame);
    const duration = opts.duration || Math.max(1.2, frames / 90);
    if (lenis) lenis.scrollTo(top, { duration, easing: (t) => -(Math.cos(Math.PI * t) - 1) / 2 });
    else scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  }
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { duration: 2, offset: -10 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ------------------------------------------------------------------ chapters + melting type */
  const chapEls = [...document.querySelectorAll('.chap')];
  const scrims = { L: $('scrimL'), R: $('scrimR'), V: $('scrimV') };
  const header = $('header');
  let melt = 0, meltQ = -1;

  // split headlines into letters (keeps <em>), mark drip letters
  document.querySelectorAll('.melt').forEach((h) => {
    const drips = (h.dataset.drip || '').split(',').filter(Boolean).map(Number);
    let n = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          // letters live inside an unbreakable word box, so lines only wrap between words
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const wd = document.createElement('span'); wd.className = 'wd';
            for (const ch of part) {
              const sp = document.createElement('span');
              sp.className = 'lt';
              sp.textContent = ch; n++;
              wd.appendChild(sp);
            }
            frag.appendChild(wd);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) walk(c);
      });
    };
    walk(h);
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
  });

  // letters that sag a few px near the cursor ("tiédissent")
  let letters = [];
  function measureLetters() {
    letters = [...document.querySelectorAll('.chap .melt .lt')].map((el) => ({ el, x: 0, y: 0, sag: 0, ch: el.closest('.chap') }));
    requestAnimationFrame(() => letters.forEach((L) => {
      const r = L.el.getBoundingClientRect(); L.x = r.left + r.width / 2; L.y = r.top + r.height / 2;
    }));
  }

  function meltAt(f) {
    if (live.on) return live.lit ? 0.25 : 0;
    if (f < 100) return 0;
    if (f < 185) return smooth((f - 100) / 85);
    if (f < K.k4) return 1;
    if (f < K.k5) return 1 - smooth((f - K.k4) / (K.k5 - K.k4));
    return 0;
  }

  function updateChapters() {
    let active = -1;
    chapEls.forEach((el, i) => {
      const c = CHAPTERS[i];
      const fin = c.a < 0 ? 1 : smooth(clamp((s - c.a) / (c.b - c.a), 0, 1));
      const fout = smooth(clamp((c.d - s) / (c.d - c.c), 0, 1));
      const o = Math.min(fin, fout);
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o > 0.005 ? 'visible' : 'hidden';
      el.classList.toggle('in', s >= c.a + (c.b - c.a) * 0.3 && s <= c.d);
      if (o > 0.5) active = i;
    });
    Object.entries(scrims).forEach(([k, el]) => {
      const on = active >= 0 && CHAPTERS[active].scrim === k && !(live.on && level > 0.2);
      el.classList.toggle('on', on);
    });
    ticks.forEach((b, i) => b.classList.toggle('on', i === active));
  }

  function updateMelt(f, dt) {
    melt = lerp(melt, meltAt(f), 1 - Math.exp(-dt * 11));
    const q = Math.round(melt * 20) * 5; // quantised: Fraunces re-rasterises only ~20 times over the whole film
    if (q !== meltQ) {
      meltQ = q;
      document.documentElement.style.setProperty('--soft-q', q);
    }
  }

  /* ------------------------------------------------------------------ thermometer */
  const thermo = $('thermo'), fillPath = $('thermoFill'), bulb = $('bulbPath'), odo = $('odo'), ticksOl = $('thermoTicks');
  const ticks = CHAPTERS.map((c, i) => {
    const li = document.createElement('li');
    li.style.top = `${(1 - (i + 0.5) / CHAPTERS.length) * 100}%`;
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Chapitre ${c.name}, ${c.t === 1000 ? 'environ 1 000' : c.t} °C`);
    b.innerHTML = `<span class="tip">${c.name}</span><span>${['I', 'II', 'III', 'IV', 'V', 'VI'][i]}</span>`;
    b.addEventListener('click', () => scrollToVh(c.rest));
    li.appendChild(b); ticksOl.appendChild(li);
    return b;
  });
  const bar = document.createElement('div'); bar.className = 'thermo-bar'; bar.innerHTML = '<i></i>'; thermo.appendChild(bar);
  // odometer: 4 rolling columns
  const cols = Array.from({ length: 4 }, () => {
    const col = document.createElement('span'); col.className = 'col';
    col.innerHTML = ['&nbsp;', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<span>${d}</span>`).join('');
    odo.appendChild(col); return col;
  });
  let tempShown = 21, slosh = 0, sloshV = 0, lastDigits = '';
  function fillFrac(T) {
    if (T <= 80) return 0.85 * T / 80;
    return Math.min(1, 0.85 + 0.15 * Math.log10(T / 80) / Math.log10(1000 / 80));
  }
  function updateThermo(dt) {
    const T = live.on ? live.temp : tempAt(curFrame);
    tempShown = lerp(tempShown, T, 1 - Math.exp(-dt * 12));
    // slosh: a damped spring kicked by scroll velocity
    sloshV += (-120 * slosh - 14 * sloshV + clamp(sv, -60, 60) * 3) * dt;
    slosh += sloshV * dt;
    const f = fillFrac(tempShown), top = 388 * (1 - f);
    const a = clamp(slosh, -6, 6);
    fillPath.setAttribute('d', `M0 400 L0 ${top + a} Q7 ${top - a * 1.4} 14 ${top - a} L14 400 Z`);
    const hot = tempShown > 80;
    fillPath.setAttribute('fill', hot ? '#FF8B3D' : '#E3A535');
    bulb.setAttribute('fill', hot ? '#FF8B3D' : '#E3A535'); bulb.setAttribute('stroke', hot ? '#FF8B3D' : '#E3A535');
    bar.firstChild.style.width = `${f * 100}%`; bar.firstChild.style.background = hot ? '#FF8B3D' : '';
    const v = Math.round(tempShown);
    const digits = (v >= 1000 ? '1000' : String(v).padStart(4, ' '));
    if (digits !== lastDigits) {
      lastDigits = digits;
      [...digits].forEach((ch, i) => {
        const idx = ch === ' ' ? 0 : Number(ch) + 1;
        cols[i].style.transform = `translateY(${-idx * 18}px)`;
        cols[i].classList.toggle('lit', hot);
      });
      odo.parentElement.setAttribute('aria-label', `${v} degrés`);
    }
    thermo.classList.toggle('hide', level > 0.85 || scrollY > film.offsetTop + film.offsetHeight - H);
  }

  /* ------------------------------------------------------------------ live candle (WebGL) */
  const lc = $('liveCanvas');
  const couleeFallback = $('couleeFallback');
  const vidLoop = $('vidLoop'), vidBlow = $('vidBlow');
  const unlitImg = new Image(); unlitImg.src = 'media/unlit.webp';
  const live = {
    on: false, lit: true, state: 'lit', mix: 0, mixFrom: null, mixTo: null, mixT: 0, mixDur: 0,
    lean: 0, leanV: 0, leanTarget: 0, temp: 1000, litSince: 0, burned: 0,
  };
  let level = 0, amp = 0, ampV = 0;
  const GL = (() => {
    const gl = lc.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!gl) return null;
    const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const fs = `
precision highp float;
uniform sampler2D uA, uB;
uniform float uMix, uLean, uTime, uLevel, uAmp, uDpr;
uniform vec2 uRes, uSrc;
uniform vec4 uFlame;
vec2 coverUV(vec2 p){
  float s = max(uRes.x / uSrc.x, uRes.y / uSrc.y);
  vec2 size = uSrc * s; vec2 off = (uRes - size) * 0.5;
  return (p - off) / size;
}
vec3 film(vec2 uv){ return mix(texture2D(uA, uv).rgb, texture2D(uB, uv).rgb, uMix); }
float wave(float x){
  return uAmp * (0.6 * sin(x * 0.011 + uTime * 1.3) + 0.3 * sin(x * 0.027 - uTime * 1.9) + 0.8 * sin(x * 0.004 + uTime * 0.6))
       + 2.5 * sin(x * 0.019 + uTime * 0.9);
}
void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 uv = coverUV(p);
  // the flame leans like in a draught: displacement grows from the wick to the tip, only around the flame
  float h = clamp((uFlame.z - uv.y) / (uFlame.z - uFlame.y), 0.0, 1.35);
  float lat = exp(-pow((uv.x - uFlame.x) / (uFlame.w * 2.4), 2.0));
  float fade = 1.0 - smoothstep(1.05, 1.35, h);
  uv.x -= uLean * pow(h, 1.7) * lat * fade * uFlame.w * 1.5;
  vec3 col = film(uv);
  if (uLevel > 0.0) {
    float x = p.x / uDpr, y = p.y / uDpr, Hc = uRes.y / uDpr;
    float surf = Hc - (uLevel * (Hc + 90.0) - 45.0) + wave(x);
    float d = y - surf;
    if (d > 0.0) {
      float band = 1.0 - smoothstep(0.0, 38.0, d);
      float slope = (wave(x + 2.0) - wave(x - 2.0)) / 4.0;
      vec2 ruv = coverUV(p + vec2(slope * 18.0, -12.0 * band) * uDpr);
      vec3 seen = mix(film(ruv), vec3(0.890, 0.647, 0.208), 0.42);
      vec3 wax = mix(vec3(0.953, 0.922, 0.867), vec3(0.890, 0.647, 0.208), exp(-d / 28.0) * 0.55);
      col = mix(wax, seen, band * 0.85);
      col += (1.0 - smoothstep(0.0, 1.6, d)) * vec3(1.0, 0.965, 0.862) * 0.6;
    }
  }
  gl_FragColor = vec4(col, 1.0);
}`;
    const sh = (t, code) => { const o = gl.createShader(t); gl.shaderSource(o, code); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(o)); return null; } return o; };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const mkTex = (unit) => {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([13, 10, 7]));
      return t;
    };
    const U = {};
    ['uA', 'uB', 'uMix', 'uLean', 'uTime', 'uLevel', 'uAmp', 'uDpr', 'uRes', 'uSrc', 'uFlame'].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));
    gl.uniform1i(U.uA, 0); gl.uniform1i(U.uB, 1);
    return { gl, U, texA: mkTex(0), texB: mkTex(1), srcA: null, srcB: null, dpr: 1 };
  })();

  function resizeLive() {
    if (!GL) return;
    GL.dpr = Math.min(devicePixelRatio || 1, 2);
    lc.width = Math.round(W * GL.dpr); lc.height = Math.round(H * GL.dpr);
    GL.gl.viewport(0, 0, lc.width, lc.height);
  }
  function upload(unit, el) {
    if (!el) return;
    if (el.tagName === 'VIDEO' && el.readyState < 2) return;
    if (el.tagName === 'IMG' && !el.complete) return;
    const gl = GL.gl; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, unit ? GL.texB : GL.texA);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, el);
  }
  function crossfade(from, to, dur) { live.mixFrom = from; live.mixTo = to; live.mixT = 0; live.mixDur = dur; }

  function setLive(on) {
    if (on === live.on) return;
    if (on && (!GL || vidLoop.readyState < 2)) return; // the film's last frame stays on screen until the clip is ready
    live.on = on;
    lc.classList.toggle('on', on);
    if (on) {
      live.lit = true; live.state = 'lit'; live.temp = 1000;
      live.litSince = performance.now();
      vidLoop.currentTime = 0; vidLoop.play().catch(() => {});
      crossfade(null, vidLoop, 0);
      blowBtn.hidden = false; lightBtn.hidden = true;
    } else {
      vidLoop.pause(); vidBlow.pause();
      if (live.lit === false) { live.lit = true; }
    }
  }

  function blow() {
    if (!live.on || !live.lit) return;
    live.lit = false; live.state = 'blowing';
    live.burned += performance.now() - live.litSince;
    vidBlow.currentTime = 0; vidBlow.play().catch(() => {});
    crossfade(vidLoop, vidBlow, 160);
    blowBtn.hidden = true; lightBtn.hidden = false;
    flameHint.innerHTML = '<span class="hint-line"></span>Éteinte. Touchez la mèche pour la rallumer.';
  }
  function relight() {
    if (!live.on || live.lit) return;
    live.lit = true; live.state = 'lit';
    live.litSince = performance.now();
    vidLoop.currentTime = 0; vidLoop.play().catch(() => {});
    crossfade(vidBlow.readyState >= 2 ? vidBlow : unlitImg, vidLoop, 1100);
    blowBtn.hidden = false; lightBtn.hidden = true;
    flameHint.innerHTML = '<span class="hint-line"></span>Approchez la main de la flamme. Soufflez, si vous osez.';
  }
  const blowBtn = $('blowBtn'), lightBtn = $('lightBtn'), flameHint = $('flameHint');
  blowBtn.addEventListener('click', blow);
  lightBtn.addEventListener('click', relight);

  function flameScreen() {
    const sc = Math.max(W / 1920, H / 1076), ox = (W - 1920 * sc) / 2, oy = (H - 1076 * sc) / 2;
    return { x: ox + FLAME.x * 1920 * sc, top: oy + FLAME.top * 1076 * sc, base: oy + FLAME.base * 1076 * sc, sc };
  }

  function renderLive(t, dt) {
    if (!GL) return;
    const gl = GL.gl;
    // crossfade bookkeeping
    if (live.mixTo) {
      live.mixT += dt * 1000;
      const k = live.mixDur ? clamp(live.mixT / live.mixDur, 0, 1) : 1;
      GL.srcA = live.mixFrom; GL.srcB = live.mixTo; live.mix = smooth(k);
      if (k >= 1) { GL.srcA = live.mixTo; GL.srcB = null; live.mix = 0; live.mixTo = null; }
    }
    if (live.state === 'blowing' && vidBlow.ended) live.state = 'unlit';
    // temperature follows the flame
    live.temp = lerp(live.temp, live.lit ? 1000 : 21, live.lit ? 0.06 : 0.035);
    // lean spring
    live.leanV += (-60 * (live.lean - live.leanTarget) - 9 * live.leanV) * dt;
    live.lean += live.leanV * dt;
    live.leanTarget *= Math.pow(0.02, dt);
    // waves on the coulée follow scroll speed
    ampV += (-40 * amp - 7 * ampV + Math.abs(clamp(sv, -80, 80)) * 1.4) * dt; amp += ampV * dt;

    upload(0, GL.srcA);
    if (GL.srcB) upload(1, GL.srcB);
    const U = GL.U;
    gl.uniform1f(U.uMix, GL.srcB ? live.mix : 0);
    gl.uniform1f(U.uLean, live.lit ? live.lean : 0);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uLevel, level);
    gl.uniform1f(U.uAmp, 4 + clamp(amp, 0, 26));
    gl.uniform1f(U.uDpr, GL.dpr);
    gl.uniform2f(U.uRes, lc.width, lc.height);
    gl.uniform2f(U.uSrc, 1920, 1076);
    gl.uniform4f(U.uFlame, FLAME.x, FLAME.top, FLAME.base, FLAME.hw);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* pointer near the flame: lean, and a quick pass through it blows it out */
  let px = -1, py = -1, pt = 0, pvx = 0;
  function onMove(e) {
    const now = performance.now(), dtm = Math.max(1, now - pt);
    const vx = px >= 0 ? (e.clientX - px) / dtm : 0, vy = py >= 0 ? (e.clientY - py) / dtm : 0;
    pvx = lerp(pvx, vx, 0.5);
    if (live.on && live.lit) {
      const F = flameScreen();
      const fy = (F.top + F.base) / 2, dist = Math.hypot(e.clientX - F.x, e.clientY - fy);
      if (dist < 260) live.leanTarget = clamp(pvx * 0.9, -1.2, 1.2) * (1 - dist / 260);
      const speed = Math.hypot(vx, vy);
      const crossed = px >= 0 && (px - F.x) * (e.clientX - F.x) <= 0 && e.clientY > F.top - 40 && e.clientY < F.base + 30;
      if (speed > 1.5 && crossed) blow();
    }
    px = e.clientX; py = e.clientY; pt = now;
  }
  addEventListener('pointermove', onMove, { passive: true });
  stage.addEventListener('click', (e) => {
    if (!live.on || live.lit) return;
    const F = flameScreen();
    if (Math.hypot(e.clientX - F.x, e.clientY - F.base) < 70 * Math.max(1, F.sc)) relight();
  });

  /* living line */
  const t0 = performance.now(), liveLine = $('liveLine');
  let lastLiveTxt = '';
  function fmtDur(ms) { const m = Math.floor(ms / 60000), s2 = Math.floor((ms % 60000) / 1000); return `${m} min ${String(s2).padStart(2, '0')} s`; }
  function fmtLeft(ms) { const left = Math.max(0, 60 * 3600000 - ms), h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000); return `${h} h ${String(m).padStart(2, '0')} min`; }
  function updateLiveLine() {
    const burned = live.burned + (live.on && live.lit ? performance.now() - live.litSince : 0);
    const txt = live.lit
      ? `Vous lisez depuis ${fmtDur(performance.now() - t0)}. Il reste à celle-ci ${fmtLeft(burned)} de lumière.`
      : `Éteinte. Il lui reste ${fmtLeft(burned)}. Touchez la mèche.`;
    if (txt !== lastLiveTxt) { liveLine.textContent = txt; lastLiveTxt = txt; }
  }

  /* ------------------------------------------------------------------ product tablet: pours, then sets */
  const tablet = $('tablet'), tabletFill = $('tabletFill');
  const NODES = 32;
  const pour = { state: 'empty', level: 0, h: new Float32Array(NODES), v: new Float32Array(NODES) };
  function startPour() {
    if (pour.state !== 'empty') return;
    pour.state = 'pouring'; tablet.classList.add('show');
    for (let i = 0; i < NODES; i++) pour.v[i] = (Math.random() - 0.5) * 30;
  }
  function resetPour() {
    if (pour.state === 'empty') return;
    pour.state = 'empty'; pour.level = 0; tablet.classList.remove('show', 'set');
  }
  function updatePour(dt) {
    if (pour.state === 'empty') return;
    if (pour.state === 'pouring') {
      pour.level = Math.min(1, pour.level + dt / 0.7);
      if (pour.level >= 1) { pour.state = 'set'; setTimeout(() => pour.state === 'set' && tablet.classList.add('set'), 150); }
    }
    // spring-coupled surface nodes
    for (let i = 0; i < NODES; i++) {
      const l = pour.h[i - 1] ?? pour.h[i], r = pour.h[i + 1] ?? pour.h[i];
      pour.v[i] += ((l + r - 2 * pour.h[i]) * 0.03 * 60 - pour.h[i] * 0.4) ; pour.v[i] *= 0.96;
    }
    for (let i = 0; i < NODES; i++) pour.h[i] += pour.v[i] * dt;
    const top = 600 * (1 - pour.level) - 6;
    let d = `M0 600 L0 ${top + pour.h[0]}`;
    for (let i = 1; i < NODES; i++) d += ` L${(i / (NODES - 1)) * 400} ${top + pour.h[i]}`;
    tabletFill.setAttribute('d', d + ' L400 600 Z');
  }

  /* ------------------------------------------------------------------ cursor */
  const cursor = $('cursor');
  if (finePointer) {
    document.body.classList.add('cursor-ready');
    addEventListener('pointermove', (e) => {
      cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;   // exact: no trailing
      cursor.classList.add('visible');
      const hot = e.target.closest && e.target.closest('a, button, input, [data-hot]');
      cursor.classList.toggle('big', !!hot);
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('visible'));
  }

  /* ------------------------------------------------------------------ nav */
  document.querySelectorAll('[data-go]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollToVh(CHAPTERS[+a.dataset.go].rest); }));
  document.querySelectorAll('[data-anchor]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollToEl($(a.dataset.anchor)); }));

  /* ------------------------------------------------------------------ after the film */
  const COMB = [
    { n: "Cire d'abeille", o: 'Ruchers de la maison', r: 'Le corps — elle porte tout le reste', x: 50, y: 50 },
    { n: 'Miel de châtaignier', o: 'Cévennes', r: 'Note de cœur, sombre et boisée', x: 19, y: 50 },
    { n: 'Propolis', o: 'Récoltée au rucher', r: 'Résine chaude, presque fumée', x: 81, y: 50 },
    { n: 'Foin coupé', o: 'Prairies de fauche', r: 'Coumarine, fin d’été', x: 34.5, y: 23.3 },
    { n: 'Ciste labdanum', o: 'Garrigue', r: 'Ambre animal, tenue', x: 65.5, y: 23.3 },
    { n: 'Fleur de tilleul', o: 'Drôme provençale', r: 'Miellée claire, douceur', x: 34.5, y: 76.7 },
    { n: 'Benjoin', o: 'Résine de Siam', r: 'Vanille baumée, fond', x: 65.5, y: 76.7 },
  ];
  const comb = $('comb');
  const wavePath = 'M0 10 Q12.5 0 25 10 T50 10 T75 10 T100 10 V14 H0Z';
  COMB.forEach((c, i) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.style.left = `${50 + (c.x - 50) * 1.04}%`; cell.style.top = `${50 + (c.y - 50) * 1.04}%`;
    cell.innerHTML = `<button type="button" aria-label="${c.n} — ${c.o}. ${c.r}">
      <span class="face front"><span class="liquid"><svg viewBox="0 0 100 14" preserveAspectRatio="none"><path d="${wavePath}" fill="rgba(227,165,53,.82)"/></svg><i></i></span><span class="cap"></span><span class="label">${c.n}</span></span>
      <span class="face back"><b>${c.n}</b><span>${c.o}</span><small>${c.r}</small></span></button>`;
    const btn = cell.firstElementChild;
    btn.addEventListener('click', () => {
      if (cell.classList.contains('flipped')) { cell.classList.remove('flipped', 'capped'); return; }
      cell.classList.add('capped');
      setTimeout(() => cell.classList.add('flipped'), 650);
    });
    comb.appendChild(cell);
  });

  const nums = [...document.querySelectorAll('.num')];
  const evening = $('evening'), eveningH = $('eveningH'), eveningN = $('eveningN');
  const setEvening = () => { const h = +evening.value; eveningH.textContent = h; eveningN.textContent = Math.floor(60 / h); };
  evening.addEventListener('input', setEvening); setEvening();

  const alab = $('albatre');
  alab.querySelectorAll('[data-dn]').forEach((b) => b.addEventListener('click', () => {
    const night = b.dataset.dn === 'night';
    alab.classList.toggle('is-night', night);
    alab.querySelectorAll('[data-dn]').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
  }));

  const sealBtn = $('sealBtn'), sealMsg = $('sealMsg');
  sealBtn.addEventListener('click', () => {
    sealBtn.classList.add('pressed');
    sealMsg.textContent = 'Le cachet est posé — ceci est un concept, aucune commande n’est passée.';
    setTimeout(() => sealBtn.classList.remove('pressed'), 900);
  });
  $('backLink').addEventListener('click', (e) => {
    e.preventDefault();
    // the whole film plays backwards, from the night to the honeycomb
    if (lenis) lenis.scrollTo(0, { duration: 7.5, easing: (t) => -(Math.cos(Math.PI * t) - 1) / 2 });
    else scrollTo({ top: 0, behavior: 'smooth' });
  });

  // reveal blocks and count up figures as they enter
  document.querySelectorAll('.after .block-head, .after .h-ed, .after .body, .figures, .gestures li, .alab-media, .comb, .refill-anim, .evenings').forEach((el) => el.classList.add('reveal-up'));
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    if (en.target.classList.contains('figures')) nums.forEach((n) => countUp(n));
    io.unobserve(en.target);
  }), { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('.reveal-up').forEach((el) => io.observe(el));
  function countUp(el) {
    const to = +el.dataset.to, t1 = performance.now();
    const step = (t) => { const k = clamp((t - t1) / 1400, 0, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------ main loop */
  let lastT = performance.now();
  function tick(time) {
    const dt = Math.min(0.05, (time - lastT) / 1000 || 0.016); lastT = time;
    if (lenis) lenis.raf(time);
    readScroll();
    sv = lerp(sv, (scrollY - lastSY) / Math.max(dt, 0.001) / Math.max(vhPx, 1), 1 - Math.exp(-dt * 16)); lastSY = scrollY;

    // the film
    // time-based easing: identical feel at 60, 120 or 144 Hz
    curFrame += (targetFrame - curFrame) * (1 - Math.exp(-dt * 15));
    if (Math.abs(targetFrame - curFrame) < 0.01) curFrame = targetFrame;
    const wantLive = s >= LIVE_FROM && curFrame > FRAMES - 3;
    setLive(wantLive);
    if (!live.on) drawFilm(curFrame);

    // the coulée and what sits on top of the film
    level = smooth(clamp((s - COULEE[0]) / (COULEE[1] - COULEE[0]), 0, 1));
    if (!live.on) couleeFallback.style.opacity = level.toFixed(3);
    else if (couleeFallback.style.opacity !== '0') couleeFallback.style.opacity = '0';
    if (live.on) {
      renderLive(time / 1000, dt);
      if (s >= POUR_AT && level < 0.4) startPour(); else if (s < POUR_AT - 22 || level >= 0.4) resetPour();
    } else resetPour();
    updatePour(dt);
    const up = pour.state !== 'empty';
    if (up !== stage.classList.contains('tablet-up')) stage.classList.toggle('tablet-up', up);
    updateLiveLine();
    updateChapters();
    updateMelt(curFrame, dt);
    updateThermo(dt);
    header.classList.toggle('on-light', level > 0.55 || scrollY > film.offsetTop + film.offsetHeight - H * 0.5);
    // once the wax has covered everything, nothing of the film may peek through at the seam
    const sealed = level > 0.985;
    if (sealed !== stage.classList.contains('sealed')) stage.classList.toggle('sealed', sealed);

    // letters sag near the cursor
    if (finePointer && px >= 0) {
      for (const L of letters) {
        if (!L.ch.classList.contains('in')) { if (L.sag) { L.sag = 0; L.el.style.transform = ''; } continue; }
        const d = Math.hypot(px - L.x, py - L.y);
        const target = d < 90 ? (1 - d / 90) * 5 : 0;
        const nv = lerp(L.sag, target, 0.15);
        if (Math.abs(nv - L.sag) > 0.01) { L.sag = nv; L.el.style.transform = nv > 0.05 ? `translateY(${nv.toFixed(2)}px)` : ''; }
      }
    }
    requestAnimationFrame(tick);
  }

  let resizeTimer = 0, lastW = innerWidth;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // phones change innerHeight when the URL bar moves: only re-layout on real size changes
      if (Math.abs(innerWidth - lastW) < 2 && isMobile()) return;
      lastW = innerWidth;
      const t = chooseTier();
      if (t !== tier) { tier = t; frames.fill(undefined); loaded = 0; loadAll(); }
      resize();
    }, 120);
  });
  if (document.fonts) document.fonts.ready.then(measureLetters);
  // keep letter centres fresh while scrolling the sticky stage (cheap: only active chapter)
  setInterval(() => { if (finePointer) letters.forEach((L) => { if (L.ch.classList.contains('in')) { const r = L.el.getBoundingClientRect(); L.x = r.left + r.width / 2; L.y = r.top + r.height / 2 - L.sag; } }); }, 300);

  // small hook for QA / automated checks
  window.__opercule = { scrollToVh, jump: (v) => { const top = film.offsetTop + v * vhPx; if (lenis) lenis.scrollTo(top, { immediate: true }); else scrollTo(0, top); }, state: () => ({ s, frame: curFrame, tier, loaded, live: { on: live.on, lit: live.lit }, level, pour: pour.state }), blow, relight };

  tier = chooseTier();
  resize();
  readScroll(); curFrame = targetFrame;
  loadAll();
  vidLoop.load(); vidBlow.load();
  requestAnimationFrame(tick);
})();
