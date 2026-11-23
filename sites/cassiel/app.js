/* LE CASSIEL — one evening at the palace, scrubbed by the scroll.
   Stills hold the stops (sharp), clips carry the camera between them, and a few moments are pure code:
   lighting the façade, the drop in the puddle, the drink, the key, the turn-around, the lift, the night. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);

  /* ---------------- timeline ---------------- */
  const TL = [
    { t: 'still', s: 0, img: 'K1', vh: 150 },
    { t: 'clip', id: '01', n: 97, vh: 110, from: 'K1', to: 'K1b' },
    { t: 'still', s: 1, img: 'K1b', vh: 80 },
    { t: 'clip', id: '02', n: 97, vh: 110, from: 'K1b', to: 'K2' },
    { t: 'still', s: 2, img: 'K2', vh: 130 },
    { t: 'clip', id: '04', n: 145, vh: 150, from: 'K2', to: 'K3' },
    { t: 'still', s: 3, img: 'K3', vh: 150 },
    { t: 'turn', vh: 45, from: 'K3', to: 'K3r' },
    { t: 'still', s: 4, img: 'K3r', vh: 70 },
    { t: 'clip', id: '05', n: 121, vh: 130, from: 'K3r', to: 'KE' },
    { t: 'lift', s: 5, vh: 150, img: 'KE', to: 'KC' },
    { t: 'still', s: 6, img: 'KC', vh: 50 },
    { t: 'clip', id: '06', n: 121, vh: 120, from: 'KC', to: 'K4' },
    { t: 'still', s: 7, img: 'K4', vh: 140 },
    { t: 'clip', id: '07', n: 97, vh: 100, from: 'K4', to: 'K5' },
    { t: 'still', s: 8, img: 'K5', vh: 130 },
    { t: 'clip', id: '08', n: 97, vh: 100, from: 'K5', to: 'K5w' },
    { t: 'still', s: 9, img: 'K5w', vh: 30 },
    { t: 'clip', id: '09', n: 73, vh: 80, from: 'K5w', to: 'K6' },
    { t: 'still', s: 10, img: 'K6', vh: 170 },
  ];
  const ORBIT = { id: '03', n: 97 };
  const STILLS = ['K1', 'K1L', 'K1b', 'K2', 'K2o', 'K3', 'K3b', 'K3c', 'K3d', 'K3r', 'KE', 'KC', 'K4', 'K5', 'K5w', 'K6', 'K6N', 'K6A'];

  /* ---------------- assets ---------------- */
  const IMG = {};
  const FR = {};
  const loadImg = (src) => new Promise((res) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const frameSrc = (id, k) => `frames/${id}/${String(k + 1).padStart(3, '0')}.jpg`;
  async function loadClip(c) {
    FR[c.id] = FR[c.id] || new Array(c.n).fill(null);
    const order = [];
    for (let step = 16; step >= 1; step = step >> 1) for (let k = 0; k < c.n; k += step) if (!order.includes(k)) order.push(k);
    for (let i = 0; i < order.length; i += 8) {
      await Promise.all(order.slice(i, i + 8).map(async (k) => { FR[c.id][k] = await loadImg(frameSrc(c.id, k)); }));
    }
  }
  function nearestFrame(id, k) {
    const a = FR[id]; if (!a) return null;
    for (let d = 0; d < a.length; d++) { if (a[k - d]) return a[k - d]; if (a[k + d]) return a[k + d]; }
    return null;
  }

  /* ---------------- WebGL ---------------- */
  const cv = $('#gl');
  const gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  const VS = 'attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
  const FS = `precision highp float;varying vec2 v;
uniform sampler2D uA,uB,uL,uM;uniform vec2 uRes;uniform float uAspA,uAspB,uAspL,uMix,uLit,uTurn;uniform vec3 uRip;
vec2 cover(vec2 uv,float asp){float va=uRes.x/uRes.y;vec2 s=va>asp?vec2(1.,asp/va):vec2(va/asp,1.);return (uv-.5)*s+.5;}
vec3 tapA(vec2 uv,float bl){vec3 c=vec3(0.);for(int i=-3;i<=3;i++){c+=texture2D(uA,cover(uv+vec2(float(i)*bl,0.),uAspA)).rgb;}return c/7.;}
vec3 tapB(vec2 uv,float bl){vec3 c=vec3(0.);for(int i=-3;i<=3;i++){c+=texture2D(uB,cover(uv+vec2(float(i)*bl,0.),uAspB)).rgb;}return c/7.;}
void main(){
  vec2 uv=v;
  if(uRip.z>0.){vec2 d=uv-uRip.xy;d.x*=uRes.x/uRes.y;float r=length(d);float f=r-uRip.z*.22;
    float amp=exp(-uRip.z*1.1)*exp(-f*f*260.);uv+=normalize(d+1e-5)*sin(f*140.)*amp*.007*vec2(uRes.y/uRes.x,1.);}
  vec3 col;
  if(uTurn>0.){float bl=sin(3.14159*uTurn)*.012;
    vec3 a=tapA(uv+vec2(uTurn*.6,0.),bl);vec3 b=tapB(uv-vec2((1.-uTurn)*.6,0.),bl);
    col=mix(a,b,smoothstep(.35,.65,uTurn));}
  else{vec3 a=texture2D(uA,cover(uv,uAspA)).rgb;vec3 b=texture2D(uB,cover(uv,uAspB)).rgb;col=mix(a,b,uMix);}
  if(uLit>0.){float m=texture2D(uM,v).r;vec3 l=texture2D(uL,cover(uv,uAspL)).rgb;col=mix(col,l,m*uLit);}
  gl_FragColor=vec4(col,1.);}`;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(o)); return o; };
  let pr, U = {}, tex = [];
  function initGL() {
    pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    U = {}; ['uA', 'uB', 'uL', 'uM', 'uRes', 'uAspA', 'uAspB', 'uAspL', 'uMix', 'uLit', 'uTurn', 'uRip'].forEach((n) => (U[n] = gl.getUniformLocation(pr, n)));
    tex = [0, 1, 2, 3].map((u) => {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + u); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([14, 12, 11]));
      return t;
    });
    gl.uniform1i(U.uA, 0); gl.uniform1i(U.uB, 1); gl.uniform1i(U.uL, 2); gl.uniform1i(U.uM, 3);
  }
  initGL();
  // the GPU can drop the context (window resize, sleep, driver reset): rebuild everything when it comes back
  let glLost = false;
  cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); glLost = true; });
  cv.addEventListener('webglcontextrestored', () => { initGL(); bound.fill(null); maskDirty = true; glLost = false; gl.viewport(0, 0, cv.width, cv.height); });
  const bound = [null, null, null, null];
  function bind(unit, src) {
    if (!src || bound[unit] === src) return;
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex[unit]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src); bound[unit] = src;
  }
  const asp = (i) => (i ? i.naturalWidth / i.naturalHeight : 16 / 9);

  /* the façade's light mask, painted by the cursor */
  const mask = document.createElement('canvas'); mask.width = 192; mask.height = 108;
  const mx = mask.getContext('2d'); mx.fillStyle = '#000'; mx.fillRect(0, 0, 192, 108);
  let maskDirty = true, litDone = false, litFill = 0;
  function paint(nx, ny) {
    const g = mx.createRadialGradient(nx * 192, ny * 108, 0, nx * 192, ny * 108, 26);
    g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    mx.globalCompositeOperation = 'lighter'; mx.fillStyle = g; mx.fillRect(0, 0, 192, 108); mx.globalCompositeOperation = 'source-over';
    maskDirty = true;
  }
  function coverage() { const d = mx.getImageData(0, 0, 192, 108).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i]; return s / (192 * 108 * 255); }

  /* ---------------- layout ---------------- */
  let W = innerWidth, H = innerHeight, segs = [], filmPx = 0;
  function layout() {
    W = innerWidth; H = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); gl.viewport(0, 0, cv.width, cv.height);
    let y = 0; segs = TL.map((s) => { const o = { ...s, y0: y, len: (s.vh / 100) * H }; y += o.len; return o; });
    filmPx = y; $('#spacer').style.height = `${filmPx}px`;
  }
  // a point of a 16:9 still, in screen pixels (cover fit)
  function pt(nx, ny, a = 2400 / 1340) {
    const va = W / H;
    if (va > a) { const h = W / a; return [nx * W, (H - h) / 2 + ny * h, W / 2400]; }
    const w = H * a; return [(W - w) / 2 + nx * w, ny * H, w / 2400];
  }

  /* ---------------- hotspots and cards ---------------- */
  const CARDS = {
    window: { img: 'img/K5w.jpg', kick: 'Suite 501', h: 'La fenêtre cintrée du cinquième', body: "Plus haute que les autres, dessinée en 1911 pour voir toute la cour d'honneur. Ce soir, c'est la vôtre." },
    bouquet: { img: 'img/D1.jpg', kick: 'Le bouquet de la semaine', h: 'Magnolias blancs', body: "Composé chaque lundi matin, il reste au centre du hall jusqu'au dimanche soir." },
    reception: { img: 'img/K2o.jpg', kick: 'La réception', h: 'Votre suite se prépare', body: "Le concierge vous propose un verre au jardin d'hiver. Votre clé vous y attendra." },
    bar: { img: 'img/K3.jpg', kick: "Le jardin d'hiver", h: "Le bar sous la verrière", body: "Un comptoir d'onyx sous une verrière de 1911. Ouvert de 17 h à 1 h." },
    bed: { img: 'img/S1.jpg', kick: 'Suite 501', h: 'La chambre', body: 'Le lit est ouvert à 19 h 30, une bouillotte de cuivre au pied.' },
    bath: { img: 'img/S2.jpg', kick: 'Suite 501', h: 'La salle de bains', body: 'Marbre de Carrare, baignoire face aux toits de Paris.' },
    service: { img: 'img/S3.jpg', kick: 'Suite 501', h: 'Le service de nuit', body: 'Consommé, œufs brouillés à la truffe : servis sous cloche en vingt minutes, toute la nuit.' },
  };
  const HOTS = {
    0: [{ x: .5, y: .335, lab: 'Votre fenêtre', card: 'window', when: () => litDone }],
    2: [{ x: .5, y: .5, lab: 'Le bouquet', card: 'bouquet' }, { x: .86, y: .72, lab: 'La réception', card: 'reception' }, { x: .5, y: .36, lab: "Le jardin d'hiver", card: 'bar' }],
    3: [{ x: .78, y: .94, lab: 'Prendre la clé', act: 'key', when: () => !keyTaken }],
    8: [{ x: .2, y: .62, lab: 'La chambre', card: 'bed' }, { x: .5, y: .4, lab: 'La salle de bains', card: 'bath' }, { x: .5, y: .74, lab: 'Le service de nuit', card: 'service' }],
  };
  const hotsEl = $('#hots');
  let hotStop = -1;
  function buildHots(s) {
    hotsEl.innerHTML = ''; hotStop = s;
    (HOTS[s] || []).forEach((h) => {
      const d = document.createElement('div'); d.className = 'hot'; d.innerHTML = `<span class="lab">${h.lab}</span>`; d._h = h;
      d.addEventListener('click', (e) => { e.stopPropagation(); h.act === 'key' ? takeKey(d) : openCard(h.card); });
      hotsEl.appendChild(d);
    });
  }
  function placeHots() {
    $$('.hot', hotsEl).forEach((d) => { const h = d._h; const [x, y] = pt(h.x, h.y); d.style.left = `${x}px`; d.style.top = `${y}px`; d.classList.toggle('on', !h.when || h.when()); });
  }
  const card = $('#card');
  function openCard(k) { const c = CARDS[k]; $('img', card).src = c.img; $('.kick', card).textContent = c.kick; $('h3', card).textContent = c.h; $('.body', card).textContent = c.body; card.classList.add('on'); }
  const closeCard = () => card.classList.remove('on');
  $('button', card).addEventListener('click', closeCard);

  /* ---------------- interactions ---------------- */
  // the key, taken at the bar
  let keyTaken = false;
  function takeKey(from) {
    if (keyTaken) return; keyTaken = true;
    const r = from.getBoundingClientRect(), hud = $('#keyHud').getBoundingClientRect();
    const k = document.createElement('img'); k.src = 'img/key.png'; k.className = 'flyKey';
    Object.assign(k.style, { left: `${r.left - 10}px`, top: `${r.top - 60}px`, height: '120px' }); document.body.appendChild(k);
    requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(k.style, { left: `${hud.left}px`, top: `${hud.top}px`, height: '88px', transform: 'rotate(-8deg)' })));
    setTimeout(() => { k.remove(); $('#keyHud').classList.add('on'); }, 1150);
    $('#keyText').innerHTML = 'La clé de la <b>suite 501</b> est à vous. Il reste à monter.';
  }
  // the drink
  const DR = ['K3', 'K3b', 'K3c', 'K3d'], DRN = ['Heure dorée', 'Lavande', 'Coing & champagne', 'Chartreuse fumée'];
  let drink = 0, drinkMix = 0, drinkTarget = 0;
  $$('#drinks button').forEach((b) => b.addEventListener('click', () => {
    $$('#drinks button').forEach((x) => x.classList.toggle('on', x === b));
    drink = +b.dataset.d; drinkMix = 0; drinkTarget = drink ? 1 : 0; $('#rDrink').textContent = DRN[drink];
  }));
  // the drop in the puddle
  let rip = { x: .5, y: .9, t0: -10 };
  // orbit around the bouquet, by dragging
  let orbit = 0, orbitTarget = 0, dragging = null;
  // the key in the lock
  let turn = 0, turned = false;
  const lockKey = $('#lockKey');
  // the night
  let night = 0;
  const knob = $('#knob'), rail = $('#rail');
  const NIGHT = [
    ['19 h 55 · Le balcon', "À 19 heures, vous regardiez cette fenêtre. Ce soir, c'est d'ici que l'on regarde Paris."],
    ['3 h 00', "La rue s'endort. Il reste trois fenêtres allumées, en face."],
    ['7 h 12', 'Le café est servi sur le balcon.'],
  ];
  function setNight(v) {
    night = clamp(v, 0, 1); knob.style.left = `${night * 100}%`;
    const i = night < .25 ? 0 : night < .75 ? 1 : 2;
    $('#nightKick').textContent = NIGHT[i][0]; $('#nightTitle').textContent = NIGHT[i][1];
  }
  const railDrag = (e) => { const r = rail.getBoundingClientRect(); setNight((e.clientX - r.left) / r.width); };
  knob.addEventListener('pointerdown', (e) => { knob.setPointerCapture(e.pointerId); knob.onpointermove = railDrag; });
  knob.addEventListener('pointerup', () => { knob.onpointermove = null; const s = [0, .5, 1].reduce((a, b) => (Math.abs(b - night) < Math.abs(a - night) ? b : a)); animTo((v) => setNight(v), night, s, 500); });
  rail.addEventListener('click', railDrag);
  function animTo(fn, a, b, ms) { const t0 = performance.now(); const f = (t) => { const k = clamp((t - t0) / ms, 0, 1); fn(a + (b - a) * smooth(k)); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }

  // pointer on the stage
  let stop = -1, cur = null;
  addEventListener('pointermove', (e) => {
    if (stop === 0 && !litDone) paint(e.clientX / W, e.clientY / H);
    if (dragging === 'orbit') { orbitTarget = clamp(orbitTarget + (e.clientX - dragging_x) / (W * .45), 0, 1); dragging_x = e.clientX; }
    if (dragging === 'key') { turn = clamp(turn + (e.clientX - dragging_x) / 140, 0, 1); dragging_x = e.clientX; if (turn >= 1) finishTurn(); }
  });
  let dragging_x = 0;
  addEventListener('pointerdown', (e) => {
    if (e.target.closest('button,a,input,select,.hot,#card,#after,.rail')) return;
    if (stop === 1) rip = { x: e.clientX / W, y: e.clientY / H, t0: performance.now() };
    if (stop === 2) { dragging = 'orbit'; dragging_x = e.clientX; }
  });
  lockKey.addEventListener('pointerdown', (e) => { e.stopPropagation(); dragging = 'key'; dragging_x = e.clientX; lockKey.style.cursor = 'grabbing'; });
  lockKey.addEventListener('click', () => { if (!turned) animTo((v) => { turn = v; if (v >= 1) finishTurn(); }, turn, 1, 700); });
  addEventListener('pointerup', () => { if (dragging === 'orbit') orbitTarget = 0; dragging = null; lockKey.style.cursor = 'grab'; });
  function finishTurn() { if (turned) return; turned = true; turn = 1; $('#turnText').innerHTML = 'Un déclic. <b>De l\'autre côté, on a laissé la lumière.</b>'; }

  /* ---------------- render ---------------- */
  const lenis = new Lenis({ lerp: .085, wheelMultiplier: .9, smoothWheel: true });
  let lastStop = -2;
  function frame(t) {
    lenis.raf(t);
    const y = lenis.scroll ?? scrollY;
    const inFilm = y < filmPx - 2;
    document.body.classList.toggle('after', !inFilm);
    const sg = segs.find((s) => y < s.y0 + s.len) || segs[segs.length - 1];
    const p = clamp((y - sg.y0) / sg.len, 0, 1);
    stop = sg.t === 'still' || sg.t === 'lift' ? sg.s : -1;
    if (stop !== lastStop) { onStop(stop); lastStop = stop; }

    let A = null, B = null, mix = 0, turnU = 0, lit = 0;
    if (sg.t === 'still') {
      A = IMG[sg.img];
      if (sg.s === 0) { lit = 1; if (litDone && litFill < 1) { litFill = Math.min(1, litFill + .012); mx.fillStyle = `rgba(255,255,255,${litFill * .08})`; mx.fillRect(0, 0, 192, 108); maskDirty = true; } }
      if (sg.s === 2 || orbit > .001) { orbit += (orbitTarget - orbit) * .12; if (orbit > .002) { A = nearestFrame(ORBIT.id, Math.round(orbit * (ORBIT.n - 1))) || A; } }
      if (sg.s === 3) { drinkMix += (drinkTarget - drinkMix) * .08; if (drink) { B = IMG[DR[drink]]; mix = drinkMix; } }
      if (sg.s === 10) { if (night <= .5) { A = IMG.K6; B = IMG.K6N; mix = night * 2; } else { A = IMG.K6N; B = IMG.K6A; mix = (night - .5) * 2; } }
    } else if (sg.t === 'clip') {
      const n = sg.n, f = Math.round(p * (n - 1));
      A = nearestFrame(sg.id, f) || IMG[sg.from];
      if (f < 5) { B = IMG[sg.from]; mix = 1 - f / 5; } else if (f > n - 6) { B = IMG[sg.to]; mix = (f - (n - 6)) / 5; }
    } else if (sg.t === 'turn') {
      A = IMG[sg.from]; B = IMG[sg.to]; turnU = smooth(p);
    } else if (sg.t === 'lift') {
      A = p < .5 ? IMG.KE : IMG.KC;
    }
    // lift overlay
    const lift = $('#lift');
    if (sg.t === 'lift') {
      lift.style.opacity = 1;
      const close = smooth(clamp(p / .28, 0, 1)), open = smooth(clamp((p - .74) / .26, 0, 1)), k = close * (1 - open);
      $('.leaf.l', lift).style.transform = `translateX(${-100 + k * 100}%)`; $('.leaf.r', lift).style.transform = `translateX(${100 - k * 100}%)`;
      const fl = clamp((p - .3) / .42, 0, 1); $('.dial', lift).style.opacity = k > .9 ? 1 : 0;
      $('#needle').setAttribute('transform', `rotate(${-90 + fl * 180} 100 100)`); $('#floorN').textContent = Math.round(fl * 5);
    } else lift.style.opacity = 0;
    // the key in the lock + the light in the joint
    const atDoor = sg.t === 'still' && sg.s === 7;
    if (atDoor && keyTaken) {
      const [x, yy, sc] = pt(.574, .634); const h = 190 * sc;
      Object.assign(lockKey.style, { opacity: 1, height: `${h}px`, left: `${x - h * .18}px`, top: `${yy - h * .12}px`, transform: `rotate(${-90 + turn * 90}deg)` });
    } else lockKey.style.opacity = 0;
    if (!atDoor && stop > 7 && !turned) finishTurn();
    const dl = $('#doorLight');
    if (atDoor) { const [x1, y1] = pt(.497, .26), [, y2] = pt(.497, .9); Object.assign(dl.style, { left: `${x1}px`, top: `${y1}px`, height: `${y2 - y1}px`, opacity: turned ? 1 : turn * .5 }); }
    else dl.style.opacity = 0;

    // draw
    if (A && !glLost) {
      bind(0, A); if (B) bind(1, B);
      if (lit) { bind(2, IMG.K1L); if (maskDirty) { gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, tex[3]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, mask); maskDirty = false; } }
      gl.uniform2f(U.uRes, W, H); gl.uniform1f(U.uAspA, asp(A)); gl.uniform1f(U.uAspB, asp(B || A)); gl.uniform1f(U.uAspL, asp(IMG.K1L));
      gl.uniform1f(U.uMix, B ? mix : 0); gl.uniform1f(U.uLit, lit); gl.uniform1f(U.uTurn, turnU);
      const age = (t - rip.t0) / 1000; gl.uniform3f(U.uRip, rip.x, rip.y, stop === 1 && age < 4 ? age : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (stop === 0 && !litDone && t % 30 < 17) { if (coverage() > .16) { litDone = true; $('#litText').innerHTML = 'Au cinquième, au-dessus de la porte, la fenêtre cintrée. <b>Ce soir, elle est à vous.</b>'; } }
    placeHots();
    requestAnimationFrame(frame);
  }
  function onStop(s) {
    $$('.tx').forEach((e) => e.classList.toggle('on', +e.dataset.s === s));
    if (s !== hotStop) buildHots(s);
    closeCard();
    $$('#hours span').forEach((e) => e.classList.toggle('on', +e.dataset.go === s));
  }

  /* ---------------- navigation, after-film ---------------- */
  function goStop(s) { const sg = segs.find((x) => x.s === s); if (sg) lenis.scrollTo(sg.y0 + sg.len * .35, { duration: 2.4 }); }
  $$('#hours span').forEach((e) => e.addEventListener('click', () => goStop(+e.dataset.go)));
  $('#toTop').addEventListener('click', (e) => { e.preventDefault(); lenis.scrollTo(0, { duration: 3 }); });
  $('#giveBack').addEventListener('click', () => {
    lenis.scrollTo(0, { duration: 4 });
    setTimeout(() => { litDone = false; litFill = 0; mx.fillStyle = '#000'; mx.fillRect(0, 0, 192, 108); maskDirty = true; $('#litText').textContent = "Merci d'être venu. Le palais s'éteint, fenêtre par fenêtre."; }, 3600);
  });
  $$('#dayNight button').forEach((b) => b.addEventListener('click', () => {
    $$('#dayNight button').forEach((x) => x.classList.toggle('on', x === b));
    $$('.grid3 img').forEach((i) => { i.style.opacity = 0; setTimeout(() => { i.src = i.dataset[b.dataset.t]; i.style.opacity = 1; }, 300); });
  }));
  $('#bookForm').addEventListener('submit', (e) => { e.preventDefault(); $('#bookMsg').textContent = "Le Cassiel est un palace imaginaire : aucune réservation n'est enregistrée."; });
  const today = new Date(); const iso = (d) => d.toISOString().slice(0, 10);
  $('#dIn').value = iso(new Date(today.getTime() + 864e5 * 14)); $('#dOut').value = iso(new Date(today.getTime() + 864e5 * 15));

  /* ---------------- boot ---------------- */
  addEventListener('resize', layout);
  (async () => {
    layout();
    const fill = $('#lfill'), pct = $('#lpct');
    let done = 0; const total = STILLS.length + 97 * 2;
    const tick = () => { done++; const v = Math.round((done / total) * 100); fill.style.width = `${v}%`; pct.textContent = `${v} %`; };
    await Promise.all(STILLS.map(async (n) => { IMG[n] = await loadImg(`img/${n}.jpg`); tick(); }));
    for (const id of ['01', '02']) { FR[id] = new Array(97).fill(null); await Promise.all(FR[id].map(async (_, k) => { FR[id][k] = await loadImg(frameSrc(id, k)); tick(); })); }
    $('#loader').classList.add('done');
    requestAnimationFrame(frame);
    for (const c of TL.filter((s) => s.t === 'clip' && !['01', '02'].includes(s.id))) await loadClip(c);
    await loadClip(ORBIT);
  })();
})();
