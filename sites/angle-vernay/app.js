/* L'Angle Vernay — built like the reel:
   - one fixed camera per state: aerial (hero), roofs, the open floors (SAME camera as the roofs), street;
   - every move is one pre-rendered clip whose first and last frames are the stills on either side
     (played forwards, or its reversed copy to go back); the floors open with a horizontal section cut;
   - the traffic is a separate transparent layer per camera; its loop starts and ends with an empty road, so the restart
     cannot be seen, and it keeps running through floor changes because the camera does not move. */
const D = window.DATA;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const scene = $('#scene'), stage = $('#stage'), pinsEl = $('#pins'), shapes = $('#shapes'), body = document.body;
let state = 'hero', busy = false, pending = null, unit = 'm2', selected = null, lastFloor = 'L5';

/* ---------- framing: the 16:9 stage covers the viewport */
function fit(){
  const W = innerWidth, H = innerHeight, s = Math.max(W / 1920, H / 1080);
  const fx = D.focus[D.states[state].cam] ?? .5;
  let x = W / 2 - fx * 1920 * s; x = Math.min(0, Math.max(W - 1920 * s, x));
  stage.style.transform = `translate(${x}px,${(H - 1080 * s) / 2}px) scale(${s})`;
}
addEventListener('resize', fit); addEventListener('load', fit); document.addEventListener('visibilitychange', () => { if (!document.hidden) fit(); });   // a tab opened in the background

/* ---------- layers */
const plates = {}, traffic = {}, clips = {};
for (const st of Object.values(D.states)){
  if (plates[st.plate]) continue;
  const im = new Image(); im.className = 'layer'; im.src = `media/plates/${st.plate}.jpg`; im.alt = '';
  $('#plates').appendChild(im); plates[st.plate] = im;
}
for (const cam of D.traffic){
  const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
  v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.className = 'layer';
  v.innerHTML = `<source src="media/traffic/${cam}.webm" type='video/webm; codecs="vp9"'>`;
  $('#traffic').appendChild(v); traffic[cam] = v;
}
function clipEl(name, rev){
  const key = name + (rev ? '_r' : '');
  if (!clips[key]){
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = `media/clips/${key}.mp4`;
    v.className = 'layer clip'; v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    stage.insertBefore(v, $('#traffic')); clips[key] = v;     // clips sit under the traffic layer
  }
  return clips[key];
}
function showPlate(name){ for (const [k, im] of Object.entries(plates)) im.classList.toggle('on', k === name);
  if (window.CarLayer && plates[name]) CarLayer.plate(plates[name].src); }
function trafficOn(cam){
  // photo cars driven by the site (no loop) for cameras without a traffic video
  if (window.CarLayer){
    if (cam && !traffic[cam] && CarLayer.has(cam)) CarLayer.on(cam, plates[D.states[state].plate]?.src || '');
    else CarLayer.off();
  }
  for (const [k, v] of Object.entries(traffic)){
    if (k === cam){ if (!v.classList.contains('on')){ v.currentTime = 0; v.play().catch(()=>{}); v.classList.add('on'); } }
    else if (v.classList.contains('on')){ v.classList.remove('on'); setTimeout(() => { if (!v.classList.contains('on')) v.pause(); }, 400); }
  }
}

/* ---------- moves: shortest path in the graph of clips */
function path(a, b){
  const prev = {[a]: null}, q = [a];
  while (q.length){ const n = q.shift(); if (n === b) break;
    for (const [x, y, clip] of D.edges) for (const [from, to, rev] of [[x, y, false], [y, x, true]])
      if (from === n && !(to in prev)){ prev[to] = {from, clip, rev}; q.push(to); }
  }
  const steps = []; let n = b; while (prev[n]){ steps.unshift({...prev[n], to: n}); n = prev[n].from; } return steps;
}
const nextPaint = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));   // the still is on screen before the clip goes
async function play(step, rate){
  const v = clipEl(step.clip, step.rev), moves = D.clips[step.clip].moves, to = D.states[step.to];
  if (v.readyState < 2) await new Promise(r => v.addEventListener('loadeddata', r, {once: true}));
  if (v.currentTime !== 0){ v.currentTime = 0; await new Promise(r => v.addEventListener('seeked', r, {once: true})); }
  trafficOn(moves ? null : to.cam);            // camera moves: the old camera's traffic fades out; fixed camera: traffic runs on
  v.playbackRate = rate * (D.clips[step.clip].speed || 1); v.classList.add('on');
  await new Promise(res => { v.onended = res; v.play().catch(res); });
  const im = plates[to.plate]; if (im.decode) await im.decode().catch(()=>{});
  showPlate(to.plate); await nextPaint(); v.classList.remove('on');
  setTimeout(() => { if (!v.classList.contains('on')) v.pause(); }, 400);
  if (!moves) trafficOn(to.cam);
}
async function goTo(target){
  if (busy){ pending = target; return; }
  if (!D.states[target] || target === state) return;
  busy = true; body.classList.add('busy'); closePanel(); hideHover(); hideBand(); pinsShow(false); setHomecard(null); body.classList.remove('ready');
  const steps = path(state, target);
  if (target === 'hero') body.classList.remove('s-roof', 's-homes', 's-street'); else setUI(target);   // the home-page text appears on arrival
  for (const st of steps){
    const static_ = !D.clips[st.clip].moves;
    compass(D.states[st.to].cam);
    await play(st, static_ && steps.length > 1 ? 1.7 : 1);
    state = st.to; fit();
    if (pending && pending !== target) break;
  }
  trafficOn(D.states[state].cam); arrive(); busy = false; body.classList.remove('busy');
  if (state[0] === 'L') lastFloor = state;
  if (pending){ const p = pending; pending = null; if (p !== state) goTo(p); }
}
function setUI(s){
  body.classList.remove('s-hero', 's-roof', 's-homes', 's-street');
  body.classList.add(s === 'hero' ? 's-hero' : s === 'roof' ? 's-roof' : s === 'street' ? 's-street' : 's-homes');
  $$('.tabs button').forEach(b => b.classList.toggle('on', (b.dataset.go === 'homes' && s[0] === 'L') || (b.dataset.go === 'street' && s === 'street')));
  if (s[0] === 'L') $$('#levels button').forEach(b => b.classList.toggle('on', b.dataset.l === s));
}
function arrive(){
  setUI(state);
  if (state[0] === 'L'){
    floorPins(state.slice(1)); pinsShow(true);
    const fl = D.floors[state.slice(1)], first = Object.keys(fl).find(k => fl[k].status !== 'sold');   // a home is pre-selected, as in the reel
    if (first) select(state.slice(1), first);
  } else if (state === 'street'){ streetPins(); pinsShow(true); body.classList.add('ready'); }
}
function compass(cam){ $('.compass svg').style.transform = `rotate(${-(D.heading[cam] || 0)}deg)`; }

/* ---------- pins, room outlines, hover card, home card */
const area = m2 => unit === 'm2' ? `${m2} m²` : `${Math.round(m2 * 10.764).toLocaleString('fr-FR')} ft²`;
function pinsShow(on){ pinsEl.classList.toggle('on-pins', on); }
function floorPins(lv){
  pinsEl.innerHTML = ''; shapes.innerHTML = '';
  for (const [k, h] of Object.entries(D.floors[lv])){
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = 'g' + h.id;
    for (const q of h.quads){ const p = document.createElementNS('http://www.w3.org/2000/svg', 'polygon'); p.setAttribute('points', q.map(([x, y]) => x + ',' + y).join(' ')); g.appendChild(p); }
    shapes.appendChild(g);
    const b = document.createElement('button'); b.className = 'pin' + (h.status === 'sold' ? ' sold' : ''); b.textContent = h.id; b.dataset.id = h.id;
    b.style.left = h.pin[0] * 100 + '%'; b.style.top = h.pin[1] * 100 + '%';
    b.onmouseenter = () => { g.classList.add('hl'); showHover(h, b); };
    b.onmouseleave = () => { g.classList.remove('hl'); hideHover(); };
    b.onclick = () => { select(lv, k); openPanel(lv, k); };
    pinsEl.appendChild(b);
  }
}
function streetPins(){
  pinsEl.innerHTML = ''; shapes.innerHTML = '';
  D.street.forEach((s, i) => { const b = document.createElement('button'); b.className = 'pin shop'; b.textContent = i + 1;
    b.style.left = s.pin[0] * 100 + '%'; b.style.top = s.pin[1] * 100 + '%'; b.onclick = () => toast(s.name + ' — ' + s.desc); pinsEl.appendChild(b); });
  $('#streetui .cards').innerHTML = D.street.map((s, i) => `<div class="sc"><img src="media/${s.img}" alt=""><div><b>${i + 1} · ${s.name}</b><span>${s.size} · ${s.desc}</span></div></div>`).join('');
}
const hov = $('#hover');
function showHover(h, el){
  hov.querySelector('img').src = `media/int/${h.photos[0]}_s.jpg`;
  hov.querySelector('b').textContent = `Logement ${h.id} · ${h.type}`;
  hov.querySelector('span').textContent = `${area(h.surface)} · ${h.faces}`;
  const r = el.getBoundingClientRect(); let x = r.left + r.width / 2 - 115, y = r.top - 250;   // centred above the pin
  x = Math.max(8, Math.min(innerWidth - 238, x)); if (y < 70) y = r.bottom + 14;
  hov.style.left = x + 'px'; hov.style.top = y + 'px'; hov.classList.add('show');
}
function hideHover(){ hov.classList.remove('show'); }
function select(lv, k){ selected = {lv, k}; const h = D.floors[lv][k]; setHomecard(h); $$('.pin').forEach(p => p.classList.toggle('active', p.dataset.id === h.id)); }
function setHomecard(h){
  const c = $('#homecard'); if (!h){ c.classList.remove('show'); return; }
  $('#hcNum').textContent = h.id; $('#hcType').textContent = h.type; $('#hcMeta').textContent = `${area(h.surface)} · ${h.level}e étage · ${h.faces}`;
  c.classList.add('show');
}
$('#hcOpen').onclick = () => selected && openPanel(selected.lv, selected.k);
$('#homecard .back').onclick = () => { selected = null; setHomecard(null); $$('.pin').forEach(p => p.classList.remove('active')); };

/* ---------- hero: floor bands on the building ("5e étage" on hover, click opens that floor) */
const bandTip = $('#bandtip');
for (const [lv, quads] of Object.entries(D.bands)){
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'g'); p.dataset.lv = lv; $('#bands').appendChild(p);
  for (const q of quads){ const pg = document.createElementNS('http://www.w3.org/2000/svg', 'polygon'); pg.setAttribute('points', q.map(([x, y]) => x + ',' + y).join(' ')); p.appendChild(pg); }
  p.onmousemove = e => { bandTip.innerHTML = `<b>${lv}e étage</b><span>${Object.values(D.floors[lv]).filter(h => h.status !== 'sold').length} logements disponibles</span>`;
    bandTip.style.left = e.clientX + 14 + 'px'; bandTip.style.top = e.clientY - 18 + 'px'; bandTip.classList.add('show'); p.classList.add('hl'); };
  p.onmouseleave = () => { hideBand(); p.classList.remove('hl'); };
  p.onclick = () => goTo('L' + lv);
}
function hideBand(){ bandTip.classList.remove('show'); }

/* ---------- panel: over the header; the scene shifts aside (no zoom) and keeps living */
function openPanel(lv, k){
  const h = D.floors[lv][k]; hideHover();
  $('#panel .ph img').src = `media/int/${h.photos[0]}.jpg`;
  $('#pEyebrow').textContent = `LOGEMENT ${h.id} · ${lv}E ÉTAGE`;
  $('#pTitle').textContent = h.title;
  $('#pGrid').innerHTML = [['SURFACE', area(h.surface)], ['ORIENTATION', h.faces], ['ÉTAGE', lv + 'e'], ['PIÈCES', h.rooms]].map(([a, b]) => `<div>${a}<b>${b}</b></div>`).join('');
  $('#pThumbs').innerHTML = h.photos.concat(D.extraPhotos.filter(p => !h.photos.includes(p))).slice(0, 3).map((p, i) => `<img src="media/int/${p}_s.jpg" data-p="${p}" class="${i ? '' : 'on'}" alt="">`).join('');
  $$('#pThumbs img').forEach(t => t.onclick = () => { $('#panel .ph img').src = `media/int/${t.dataset.p}.jpg`; $$('#pThumbs img').forEach(x => x.classList.toggle('on', x === t)); });
  body.classList.add('panel');
}
function closePanel(){ body.classList.remove('panel'); }
$('#panel .x').onclick = closePanel;
addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

/* ---------- controls */
for (const lv of Object.keys(D.floors).sort().reverse()){
  const b = document.createElement('button'); b.textContent = lv + 'E'; b.dataset.l = 'L' + lv; b.onclick = () => goTo('L' + lv); $('#levels').appendChild(b);
}
$$('[data-go]').forEach(b => b.onclick = () => { const g = b.dataset.go;
  goTo(g === 'homes' ? (state[0] === 'L' ? state : lastFloor) : g === 'roof' ? 'roof' : g === 'street' ? 'street' : 'hero'); });
$('.logo').onclick = () => goTo('hero');
$('#streetui .back').onclick = () => goTo(lastFloor);
$('.units').onclick = () => { unit = unit === 'm2' ? 'ft2' : 'm2'; $$('.units span').forEach(s => s.classList.toggle('on', s.dataset.u === unit));
  $$('[data-area]').forEach(e => e.textContent = area(+e.dataset.area)); if (selected) setHomecard(D.floors[selected.lv][selected.k]); };
let tt; function toast(t){ const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => e.classList.remove('on'), 2400); }
$$('[data-toast]').forEach(b => b.onclick = () => toast(b.dataset.toast));

/* ---------- start: aerial still + its traffic, slow push-in */
showPlate(D.states.hero.plate); trafficOn('A'); setUI('hero'); compass('A'); fit();
addEventListener('load', () => { for (const [, , c] of D.edges){ clipEl(c, false); clipEl(c, true); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden) for (const v of Object.values(traffic)) if (v.classList.contains('on') && v.paused) v.play().catch(()=>{}); });
const h0 = location.hash.slice(1); if (h0 && D.states[h0]) setTimeout(() => goTo(h0), 300);
