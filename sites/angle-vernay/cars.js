/* Car layer: real car photos (cut out of one AI image) driven by the site along the lanes computed in Blender.
   No video, so no loop: cars appear at random, a few at a time, and never repeat the same sequence.
   - lanes: for each camera, points along each driving lane with their screen position, pixels per metre and direction;
   - an occluder layer (the still itself, masked to what stands between the camera and the road: trees, railings…)
     is drawn above the cars, so they pass behind the trees. */
window.CarLayer = (function(){
  const C = window.DATA.cars; if (!C) return null;
  const canvas = document.getElementById('cars'), ctx = canvas.getContext('2d'), occ = document.getElementById('occ');
  canvas.width = 1920; canvas.height = 1080;
  const sprites = {}; for (const s of C.sprites){ const im = new Image(); im.src = `media/sprites/${s.name}.png`; sprites[s.name] = {...s, im}; }
  let cam = null, cars = [], last = 0, nextSpawn = {}, running = false, raf = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  // position on a lane polyline at coordinate a (metres along the street)
  function at(lane, a){
    const p = lane.pts; if (a <= p[0][0]) return p[0]; if (a >= p[p.length - 1][0]) return p[p.length - 1];
    let i = 1; while (p[i][0] < a) i++;
    const q = p[i - 1], r = p[i], t = (a - q[0]) / (r[0] - q[0]);
    return [a, q[1] + (r[1] - q[1]) * t, q[2] + (r[2] - q[2]) * t, q[3] + (r[3] - q[3]) * t, q[4] + (r[4] - q[4]) * t];
  }
  function spawn(name, lane, now){
    const view = C.view[cam];
    const pool = C.sprites.filter(s => s.row === view && (lane.bus || s.name !== C.bus));
    let s = pool[Math.floor(Math.random() * pool.length)]; if (!s) return;
    const isBus = s.name === C.bus;
    const len = isBus ? 12 : (s.name === C.van ? 5 : 4.5);
    const p = lane.pts, dir = lane.dir;
    cars.push({lane, s: sprites[s.name], len, a: dir > 0 ? p[0][0] - len : p[p.length - 1][0] + len, dir, v: isBus ? rnd(8, 9.5) : rnd(10.5, 13.5), name});
  }
  function frame(t){
    if (!running) return;
    const dt = Math.min(.1, (t - (last || t)) / 1000); last = t;
    const lanes = C.lanes[cam] || {};
    for (const [name, lane] of Object.entries(lanes)){
      if (!(name in nextSpawn)) nextSpawn[name] = t + rnd(400, 2600);
      if (t >= nextSpawn[name] && cars.length < C.max[cam]){
        const near = cars.some(c => c.lane === lane && Math.abs(c.a - (lane.dir > 0 ? lane.pts[0][0] : lane.pts[lane.pts.length - 1][0])) < 14);
        if (!near) spawn(name, lane, t);
        nextSpawn[name] = t + rnd(C.gap[0], C.gap[1]);
      }
    }
    for (const c of cars){
      // keep a safe distance behind the car ahead on the same lane
      const ahead = cars.filter(o => o !== c && o.lane === c.lane && (o.a - c.a) * c.dir > 0).sort((x, y) => Math.abs(x.a - c.a) - Math.abs(y.a - c.a))[0];
      const gap = ahead ? Math.abs(ahead.a - c.a) - (ahead.len + c.len) / 2 : 1e9;
      const v = gap < 6 ? Math.min(c.v, ahead.v) : c.v;
      c.a += c.dir * v * dt;
    }
    cars = cars.filter(c => { const p = c.lane.pts; return c.dir > 0 ? c.a < p[p.length - 1][0] + c.len : c.a > p[0][0] - c.len; });
    ctx.clearRect(0, 0, 1920, 1080);
    // far lanes first (smaller pixels-per-metre = further away)
    const draw = cars.map(c => ({c, p: at(c.lane, c.a)})).sort((x, y) => x.p[3] - y.p[3]);
    for (const {c, p} of draw){
      const s = c.s; if (!s.im.complete) continue;
      const ppm = p[3], travel = -p[4] + (c.dir < 0 ? 180 : 0);   // screen direction of travel, degrees clockwise from +x
      let rot = travel - s.axis, flip = false;
      rot = ((rot + 540) % 360) - 180;
      if (Math.abs(rot) > 90){ flip = true; rot = ((travel - (180 - s.axis) + 540) % 360) - 180; }
      const w = c.len * ppm * (s.row === 'top' ? 1.18 : 1.04), h = w * s.h / s.w;
      ctx.save(); ctx.translate(p[1] * 1920, p[2] * 1080); ctx.rotate(rot * Math.PI / 180); if (flip) ctx.scale(-1, 1);
      ctx.drawImage(s.im, -w / 2, s.row === 'side' ? -h * .78 : -h / 2, w, h);
      ctx.restore();
    }
    raf = requestAnimationFrame(frame);
  }
  return {
    has: c => !!(C.lanes[c] && Object.keys(C.lanes[c]).length),
    on(c, plateSrc){
      if (cam !== c){ cars = []; nextSpawn = {}; ctx.clearRect(0, 0, 1920, 1080); }   // a new camera starts with an empty road
      cam = c; occ.style.backgroundImage = `url(${plateSrc})`;
      occ.style.webkitMaskImage = occ.style.maskImage = `url(media/occ/${c}.png)`;
      canvas.classList.add('on'); occ.classList.add('on');
      if (!running){ running = true; last = 0; raf = requestAnimationFrame(frame); }
    },
    plate(src){ occ.style.backgroundImage = `url(${src})`; },
    off(){ canvas.classList.remove('on'); occ.classList.remove('on'); cam = null; setTimeout(() => { if (!cam){ running = false; cancelAnimationFrame(raf); cars = []; } }, 350); }
  };
})();
