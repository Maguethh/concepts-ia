import{A as e,E as t,F as n,I as r,O as i,P as a,T as o,b as s,i as c,j as l,m as u,p as d,r as f,s as p,x as m}from"./BuJhsgJA.js";var h=16,g=14,_=.1,v=Math.PI*2,y=new n(0,1,0),b=(e,t,n)=>{let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)},x=e=>e.toFixed(5);function S(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}var C={atolla:{kind:0,H:.4,squeeze:.13,segs:132,n:46,Lmax:7.6,spotS:.86,profile:e=>[e*(1-.03*b(.9,1,e)),.4*Math.max(0,1-e**2.2)**.9-.045*Math.exp(-(((e-.46)/.035)**2))-.04*b(.88,1,e)],thick:e=>.1*(1-e)+.018,spread:.16,sway:.05,armR:.06,armY:.2,tentCol:`vec3(.52, .2, .16)`,tentA:.5,tentGlow:`vec3(.0, .006, .018)`,armCol:`vec3(.5, .2, .2)`,armA:.2,r:[13,90],kick:.85},aurelia:{kind:1,H:.3,squeeze:.19,segs:96,n:40,Lmax:1.9,spotS:.9,profile:e=>[e*(1-.025*b(.9,1,e)),.3*Math.max(0,1-e**2.5)**.75-.03*b(.85,1,e)],thick:e=>.07*(1-e)+.012,spread:.55,sway:.07,armR:.06,armY:.2,tentCol:`vec3(.8, .88, .92)`,tentA:.32,tentGlow:`vec3(.004, .02, .014)`,armCol:`vec3(.84, .78, .88)`,armA:.16,r:[14,80],kick:1},comb:{kind:2,H:2,squeeze:.018,segs:96,n:40,Lmax:1,spotS:.5,profile:e=>[e**.55*(1-.1*b(.85,1,e)),2*(1-e)],thick:()=>.045,spread:0,sway:0,armR:.06,armY:.2,tentCol:`vec3(1.)`,tentA:0,tentGlow:`vec3(0.)`,armCol:`vec3(1.)`,armA:0,r:[8,30],kick:0}},w=[`atolla`,`aurelia`,`atolla`,`comb`,`aurelia`,`atolla`,`aurelia`],T=`
#define NS ${h}
#define NH ${g}
#define HSTEP ${_.toFixed(3)}
uniform float uTime, uPh, uPulse, uFlare, uFade, uDist, uGlow, uWave, uScale, uTorchStr, uFogDen, uHistAcc;
uniform vec3 uTorchPos, uTorchDir, uFogCol, uAmb;
uniform vec2 uHist[NH];
// the cursor dive torch (world space), same cone as the SpotLight in main.js (angle .3, penumbra .8, distance 2600)
float torchAt(vec3 w) {
  vec3 L = w - uTorchPos; float d = max(length(L), 1.);
  float cone = smoothstep(.955, .998, dot(L, uTorchDir) / d);
  float att = clamp(1. - d / 2600., 0., 1.);
  return uTorchStr * cone * att * att;
}
// two blue lights chasing each other round the margin (Atolla alarm display); uWave is integrated on the CPU
float spotWave(float ang) {
  float a = ang * 6.28318 - uWave;
  return pow(.5 + .5 * cos(a), 16.) + .7 * pow(.5 + .5 * cos(a + 3.14159), 16.);
}
`,E=`
// pulse/flare of the bell 'lag' seconds ago
vec2 histAt(float lag) {
  if (lag <= uHistAcc) return mix(uHist[0], uHist[1], lag / max(uHistAcc, 1e-3));
  float f = min(1. + (lag - uHistAcc) / HSTEP, float(NH) - 1.001);
  int i = int(f);
  return mix(uHist[i], uHist[i + 1], fract(f));
}
// swim-cycle deformation of a bell-space point; s = profile parameter (0 apex .. 1 margin), ang = angle / 2pi
vec3 deform(vec3 p, float s, float ang, float pulse, float flare) {
  float w = smoothstep(.06, 1., s);
  float k = 1. - pulse * SQUEEZE * w + flare * SQUEEZE * .9 * w * w * w;
  k *= 1. + .022 * sin(ang * 18.8496 + uTime * .55 + uPh) * w;
#if KIND == 0
  k *= 1. + .05 * (pow(abs(cos(ang * 69.115)), .5) - .62) * smoothstep(.8, 1., s);
#endif
  p.xz *= k;
  p.y = p.y * (1. + pulse * SQUEEZE * 1.1 * (1. - w)) + (flare * .45 - pulse * .5) * SQUEEZE * w * w;
  return p;
}
`,D=T+E+`
attribute float aSide;
varying vec3 vN, vVP, vW, vLoc;
varying vec2 vUv;
varying float vSide;
void main() {
  vec3 p = deform(position, uv.y, uv.x, uPulse, uFlare);
  vLoc = position; vUv = uv; vSide = aSide;
  vec4 w = modelMatrix * vec4(p, 1.);
  vW = w.xyz;
  vec4 mv = viewMatrix * w;
  vVP = mv.xyz;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}
`,O=T+`
varying vec3 vN, vVP, vW, vLoc;
varying vec2 vUv;
varying float vSide;
float lineAA(float d, float w) { float fw = fwidth(d) + 1e-5; return 1. - smoothstep(w - fw, w + fw, d); }
void main() {
  float s = vUv.y, ang = vUv.x;
  vec3 n = normalize(vN), v = normalize(-vVP);
  float ndv = abs(dot(n, v));
  float F = pow(1. - ndv, 3.);
  float tl = torchAt(vW) * 1.6;
  vec3 light = uAmb + vec3(.92, .98, 1.) * tl;
  vec3 col; float a; vec3 e = vec3(0.);
#if KIND == 0
  // Atolla: wine-red mesoglea, darker stomach dome, coronal furrow, pedalia separated by grooves
  float groove = exp(-pow((s - .46) / .02, 2.));
  float seg = abs(fract(ang * 22. + .5) - .5) * 2.;
  float notch = smoothstep(.7, 1., seg) * smoothstep(.48, .56, s);
  float dome = 1. - smoothstep(.28, .44, s);
  vec3 red = vec3(.36, .045, .035), deep = vec3(.13, .012, .03);
  vec3 tint = mix(red, deep, clamp(dome * vSide * .9 + notch * .5 + groove * .6, 0., 1.));
  a = clamp(.14 + .5 * F + .25 * groove + .12 * notch + .32 * dome * vSide, 0., .9);
  col = tint * light * (.8 + 2.2 * F) + red * tl * .55 * (1. - ndv) + uAmb * F * .8;
  // the photophores' blue light scattering through the coronal muscle
  float band = exp(-pow((s - .86) / .09, 2.));
  e = vec3(.16, .42, 1.) * (uGlow * .025 + uDist * (.02 + .45 * spotWave(ang))) * band
    + vec3(.3, .04, .12) * uGlow * .012 * dome;
#elif KIND == 1
  // Aurelia: milky saucer, horseshoe gonads and canals on the subumbrella
  float r = length(vLoc.xz);
  float th = ang * 6.28318;
  float t2 = th - .7854;
  float k = floor(t2 / 1.5708 + .5);
  float la = t2 - k * 1.5708;
  vec2 g = r * vec2(cos(la), sin(la)) - vec2(.34, 0.);
  float ga = atan(g.y, g.x);
  float dd = abs(length(g) - .115 - .007 * sin(ga * 26.));
  float gon = (1. - smoothstep(.016, .032, dd)) * smoothstep(.3, .8, 3.14159 - abs(ga)) * vSide;
  float cl = abs(fract(ang * 16. + .5) - .5) * .3927 * r;
  float cl2 = abs(fract(ang * 32. + .5) - .5) * .19635 * r;
  float canal = lineAA(cl, .005) * smoothstep(.18, .3, r)
              + lineAA(cl2, .0035) * smoothstep(.6, .8, r) * .7
              + lineAA(abs(r - .955), .006);
  canal = min(canal, 1.) * vSide;
  vec3 milk = vec3(.74, .84, .9), pink = vec3(.86, .46, .66);
  vec3 tint = mix(milk, pink, gon);
  a = clamp(.03 + .3 * F + .42 * gon + .1 * canal, 0., .85);
  col = tint * light * (.9 + 1.8 * F) + tint * tl * .35 * (1. - ndv) + uAmb * F * 1.2;
  float dots = pow(.5 + .5 * cos(ang * 6.28318 * 48.), 6.) * smoothstep(.94, .99, s);
  e = vec3(.22, 1., .66) * dots * (uGlow * .05 + uDist * .55) + pink * gon * uGlow * .01;
#else
  // comb jelly: clear body, eight rows of ciliary plates diffracting light into travelling thin-film colours
  float rr = length(vLoc.xz);
  float rowD = abs(fract(ang * 8. + .5) - .5) * .7854 * rr;
  float row = floor(ang * 8. + .5);
  float band = lineAA(rowD, .035) * smoothstep(.05, .12, s) * (1. - smoothstep(.8, .9, s)) * (1. - vSide);
  float pl = fract(s * 30.);
  float plates = smoothstep(.1, .35, pl) * (1. - smoothstep(.55, .9, pl));
  float mwave = pow(.5 + .5 * sin(s * 44. - uTime * 6. + row * 1.7), 2.);
  float tf = s * 2.6 - uTime * .7 + ndv * 1.3 + mwave * .35 + row * .11;
  vec3 irid = .5 + .5 * cos(6.28318 * (tf + vec3(0., .33, .67)));
  irid = mix(vec3(dot(irid, vec3(.333))), irid, .85);
  float comb = band * mix(.35, 1., plates) * (.3 + .7 * mwave);
  float canal = lineAA(rowD, .02) * vSide * smoothstep(.05, .15, s);
  a = clamp(.025 + .22 * F + .12 * comb + .05 * canal, 0., .7);
  float lum = dot(light, vec3(.3, .5, .2));
  col = vec3(.8, .72, .8) * light * (.9 + 1.6 * F) + uAmb * F;
  e = irid * comb * (.04 + 1.8 * lum)
    + vec3(.12, .85, .95) * band * uDist * pow(.5 + .5 * sin(s * 8. - uTime * 4.5 + row), 5.) * .9
    + vec3(.12, .7, .9) * band * uGlow * .03;
#endif
  float fogF = exp(-length(vVP) * uFogDen);
  vec3 rgb = (col * a + e) * fogF + uFogCol * a * (1. - fogF);
  gl_FragColor = vec4(rgb, a) * uFade;
}
`,ee=T+E+`
uniform vec3 uSpine[NS];
uniform float uSpineLen;
uniform vec2 uRes;
attribute vec4 aExt;           // length (bell radii), width (bell radii), random, kind (0 hair, 1 oral-arm curtain)
varying float vEdge, vS, vAW, vFog, vKind;
varying vec3 vLight;
vec3 trail(float u) {
  float f = min(clamp(u / uSpineLen, 0., 1.) * float(NS - 1), float(NS) - 1.001);
  int i = int(f);
  return mix(uSpine[i], uSpine[i + 1], fract(f)) - uSpine[0];
}
vec3 tentPos(float s, float ang, float len, float rnd, float kind) {
  float a = ang * 6.28318;
  vec3 rad = vec3(cos(a), 0., sin(a));
  float u = s * len;
  vec2 h = histAt(u * .17);    // the contraction travels down the tentacle
  vec3 root = kind > .5
    ? deform(vec3(rad.x * ARM_R, ARM_Y, rad.z * ARM_R), .05, ang, h.x, h.y)
    : deform(vec3(rad.x * MARGIN_R, MARGIN_Y, rad.z * MARGIN_R), 1., ang, h.x, h.y);
  float ph = rnd * 6.28318 + uPh;
  float sw = u * (kind > .5 ? .09 : SWAY);
  vec3 p = root + rad * (kind > .5 ? .1 : SPREAD) * u * (1. - .4 * s) + trail(u);
  p.x += sin(u * 1.9 - uTime * 1.05 + ph) * sw;
  p.z += cos(u * 1.6 - uTime * .85 + ph * 1.37) * sw;
  p.y += sin(u * 2.4 - uTime * .7 + ph * .7) * sw * .3;
  return p;
}
void main() {
  float s = position.x, side = position.y, ang = position.z;
  float len = aExt.x, wl = aExt.y, rnd = aExt.z, kind = aExt.w;
  vec3 p = tentPos(s, ang, len, rnd, kind);
  float ds = s < .985 ? .015 : -.015;
  vec3 T = (tentPos(s + ds, ang, len, rnd, kind) - p) * sign(ds);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  vec4 wp = modelMatrix * vec4(p, 1.);
  vAW = 1.;
  if (kind < .5) {
    // camera-facing hairline, never thinner than ~1.25 px: sub-pixel width becomes transparency instead of shimmer
    vec3 tv = mat3(modelViewMatrix) * T;
    vec3 sv = cross(tv, mv.xyz);
    float sl = length(sv);
    sv = sl > 1e-6 ? sv / sl : vec3(1., 0., 0.);
    float pix = -mv.z * 2. / (projectionMatrix[1][1] * uRes.y);
    float wt = wl * uScale * (1. - .65 * s);
    float wd = max(wt, pix * 1.25);
    vAW = wt / wd;
    mv.xyz += sv * side * wd * .5;
  } else {
    // oral arm: a twisted curtain in its own plane with ruffled edges
    float aa = ang * 6.28318;
    vec3 rad = vec3(cos(aa), 0., sin(aa));
    vec3 tg = vec3(-rad.z, 0., rad.x);
    vec3 Tn = normalize(T + vec3(0., -1e-5, 0.));
    float tw = s * 2.4 + sin(uTime * .35 + rnd * 6.) * .6;
    vec3 lat = cos(tw) * tg + sin(tw) * rad;
    lat = normalize(lat - Tn * dot(lat, Tn) + 1e-5);
    vec3 nr = cross(Tn, lat);
    float w = wl * (1. - .6 * s) * (.82 + .18 * sin(s * 11. + rnd * 5.));
    vec3 q = p + lat * side * w * .5 + nr * sin(s * 34. - uTime * 1.3 + rnd * 9. + side * 1.9) * w * .3;
    mv = modelViewMatrix * vec4(q, 1.);
    wp = modelMatrix * vec4(q, 1.);
  }
  vEdge = side; vS = s; vKind = kind;
  vLight = uAmb + vec3(.92, .98, 1.) * torchAt(wp.xyz) * 1.6;
  vFog = exp(-length(mv.xyz) * uFogDen);
  gl_Position = projectionMatrix * mv;
}
`,te=T+`
varying float vEdge, vS, vAW, vFog, vKind;
varying vec3 vLight;
void main() {
  float edge = 1. - vEdge * vEdge;
  vec3 tint; float a; vec3 e = vec3(0.);
  if (vKind < .5) {
    tint = TENT_COL;
    a = TENT_A * edge * vAW * (1. - .55 * vS);
    e = TENT_GLOW * (uGlow * .4 + uDist) * (1. - vS) * a;
  } else {
    tint = ARM_COL;
    float frill = .6 + .4 * sin(vS * 70. + vEdge * 3.);
    a = ARM_A * (.45 + .55 * pow(abs(vEdge), 3.)) * frill * (1. - .5 * vS);
  }
  vec3 rgb = tint * vLight * a + e;
  rgb = rgb * vFog + uFogCol * a * (1. - vFog);
  gl_FragColor = vec4(rgb, a) * uFade;
}
`,ne=T+E+`
uniform vec2 uRes;
attribute float aAng, aRnd;
varying float vI;
void main() {
  vec3 p = deform(position, SPOT_S, aAng, uPulse, uFlare);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  float px = uScale * .16 * projectionMatrix[1][1] * uRes.y * .5 / max(-mv.z, 1.);
  float ps = clamp(px, 2., 64.);
  float k = min(px / ps, 1.); k *= k;
  float fogF = exp(-length(mv.xyz) * uFogDen);
  float tw = .75 + .25 * sin(uTime * 1.7 + aRnd * 40.);
  vI = uFade * fogF * k * (uGlow * .16 * tw + uDist * (.1 + 3.4 * spotWave(aAng)));
  gl_PointSize = ps;
  gl_Position = projectionMatrix * mv;
}
`,re=`
varying float vI;
void main() {
  vec2 c = gl_PointCoord * 2. - 1.;
  float d2 = dot(c, c);
  if (d2 > 1. || vI < 1e-4) discard;
  float g = 1. - d2;
  float core = g * g * g * g * .9 + g * .12;
  gl_FragColor = vec4(vec3(.16, .45, 1.) * vI * core, 0.);   // alpha 0 + premultiplied blending = pure light
}
`;function k(e){let t=e.profile,n=e.n,r=e.segs,i=.001,a=[];for(let e=0;e<=n;e++){let r=e/n,[o,s]=t(r),c=t(Math.max(0,r-i)),l=t(Math.min(1,r+i)),u=-(l[1]-c[1]),d=l[0]-c[0],f=Math.hypot(u,d)||1;u/=f,d/=f,a.push([o,s,u,d,r])}let o=[];for(let e of a)o.push([e[0],e[1],e[2],e[3],e[4],0]);for(let t=n;t>=0;t--){let n=a[t],r=e.thick(n[4]);o.push([Math.max(0,n[0]-n[2]*r),n[1]-n[3]*r,-n[2],-n[3],n[4],1])}let s=o.length,l=(r+1)*s,u=new Float32Array(l*3),d=new Float32Array(l*3),p=new Float32Array(l*2),m=new Float32Array(l),h=0;for(let e=0;e<=r;e++){let t=e/r,n=t*v,i=Math.cos(n),a=Math.sin(n);for(let e=0;e<s;e++,h++){let n=o[e];u[h*3]=n[0]*i,u[h*3+1]=n[1],u[h*3+2]=n[0]*a,d[h*3]=n[2]*i,d[h*3+1]=n[3],d[h*3+2]=n[2]*a,p[h*2]=t,p[h*2+1]=n[4],m[h]=n[5]}}let g=new Uint32Array(r*(s-1)*6),_=0;for(let e=0;e<r;e++)for(let t=0;t<s-1;t++){let n=e*s+t,r=n+s,i=n+1,a=r+1;g[_++]=n,g[_++]=r,g[_++]=i,g[_++]=r,g[_++]=a,g[_++]=i}let y=new c;return y.setAttribute(`position`,new f(u,3)),y.setAttribute(`normal`,new f(d,3)),y.setAttribute(`uv`,new f(p,2)),y.setAttribute(`aSide`,new f(m,1)),y.setIndex(new f(g,1)),y.computeBoundingSphere(),y.boundingSphere.radius*=1.4,y}function ie(e){let t=0,r=0;for(let n of e)t+=(n.segs+1)*2,r+=n.segs*6;let i=new Float32Array(t*3),a=new Float32Array(t*4),o=new Uint16Array(r),s=0,u=0;for(let t of e){let e=s;for(let e=0;e<=t.segs;e++)for(let n=-1;n<=1;n+=2,s++)i[s*3]=e/t.segs,i[s*3+1]=n,i[s*3+2]=t.ang,a[s*4]=t.len,a[s*4+1]=t.w,a[s*4+2]=t.rnd,a[s*4+3]=t.kind;for(let n=0;n<t.segs;n++){let t=e+n*2,r=t+1,i=t+2,a=t+3;o[u++]=t,o[u++]=r,o[u++]=i,o[u++]=r,o[u++]=a,o[u++]=i}}let d=new c;return d.setAttribute(`position`,new f(i,3)),d.setAttribute(`aExt`,new f(a,4)),d.setIndex(new f(o,1)),d.boundingSphere=new l(new n,10),d}function ae(e,t){let n=[];if(e===`atolla`){for(let e=0;e<22;e++)n.push({ang:(e+.5)/22,len:1.5+1.1*t(),w:.011,rnd:t(),kind:0,segs:18});n.push({ang:5.5/22,len:7.2,w:.028,rnd:t(),kind:0,segs:60})}else if(e===`aurelia`){for(let e=0;e<84;e++)n.push({ang:(e+.5+(t()-.5)*.5)/84,len:.22+.4*t(),w:.0065,rnd:t(),kind:0,segs:7});for(let e=0;e<4;e++)n.push({ang:e/4+(t()-.5)*.02,len:1.15+.35*t(),w:.22,rnd:t(),kind:1,segs:32})}return n}function oe(e,t){let[n,r]=e.profile(e.spotS),i=.001,a=e.profile(e.spotS-i),o=e.profile(e.spotS+i),s=-(o[1]-a[1]),l=o[0]-a[0],u=Math.hypot(s,l)||1;s/=u,l/=u;let d=new Float32Array(66),p=new Float32Array(22),m=new Float32Array(22);for(let e=0;e<22;e++){let i=e/22,a=i*v,o=n+s*.012;d[e*3]=Math.cos(a)*o,d[e*3+1]=r+l*.012,d[e*3+2]=Math.sin(a)*o,p[e]=i,m[e]=t()}let h=new c;return h.setAttribute(`position`,new f(d,3)),h.setAttribute(`aAng`,new f(p,1)),h.setAttribute(`aRnd`,new f(m,1)),h}var A={transparent:!0,depthWrite:!1,depthTest:!0,fog:!1,blending:5,blendEquation:100,blendSrc:201,blendDst:205,blendSrcAlpha:201,blendDstAlpha:205};function j({count:c=14,renderOrder:f=20,seed:T=20261124}={}){let E=S(T),j=(e,t)=>e+(t-e)*E(),M=new u;M.name=`jellyfish`;let N={uTorchPos:{value:new n},uTorchDir:{value:new n(0,0,-1)},uTorchStr:{value:0},uFogCol:{value:new p(.003,.016,.022)},uFogDen:{value:1/2600},uAmb:{value:new p},uRes:{value:new a(1920,1080)}},P=new r,se=e=>{e.getCurrentViewport(P),P.w>0&&N.uRes.value.set(P.z,P.w)},F={};for(let e of Object.keys(C)){let t=C[e],[n,r]=t.profile(1),i={KIND:t.kind,SQUEEZE:x(t.squeeze),MARGIN_R:x(n),MARGIN_Y:x(r),ARM_R:x(t.armR),ARM_Y:x(t.armY),SPREAD:x(t.spread),SWAY:x(t.sway),SPOT_S:x(t.spotS),TENT_COL:t.tentCol,TENT_A:x(t.tentA),TENT_GLOW:t.tentGlow,ARM_COL:t.armCol,ARM_A:x(t.armA)},a=ae(e,E);F[e]={defines:i,bell:k(t),tent:a.length?ie(a):null,spots:t.kind===0?oe(t,E):null}}let I=[];for(let t=0;t<c;t++){let r=w[t%w.length],i=C[r],s=F[r],c,l;if(t%5!=4){let e=-(420+2580*E()**.9);c=new n(e*j(-.62,.62),e*j(-.32,.3),e),l=c.length()}else c=new n(j(-1,1),j(-.45,.4),j(-1,1)).normalize(),l=Math.max(950,420+2600*E()),c.multiplyScalar(l);let d=Math.min(i.r[0]+(i.r[1]-i.r[0])*E()**1.6,.06*l+15),f=(d-i.r[0])/(i.r[1]-i.r[0]),p={uTorchPos:N.uTorchPos,uTorchDir:N.uTorchDir,uTorchStr:N.uTorchStr,uFogCol:N.uFogCol,uFogDen:N.uFogDen,uAmb:N.uAmb,uRes:N.uRes,uTime:{value:0},uPh:{value:j(0,v)},uPulse:{value:0},uFlare:{value:0},uFade:{value:0},uDist:{value:0},uGlow:{value:0},uWave:{value:j(0,v)},uScale:{value:d},uHist:{value:Array.from({length:g},()=>new a)},uHistAcc:{value:0},uSpine:{value:Array.from({length:h},(e,t)=>new n(0,-t*i.Lmax/15,0))},uSpineLen:{value:i.Lmax}},_=new u;_.scale.setScalar(d);let y=new m(s.bell,new e({...A,side:2,uniforms:p,defines:s.defines,vertexShader:D,fragmentShader:O}));y.frustumCulled=!1,_.add(y);let b=null,x=null;s.tent&&(b=new m(s.tent,new e({...A,side:2,forceSinglePass:!0,uniforms:p,defines:s.defines,vertexShader:ee,fragmentShader:te})),b.frustumCulled=!1,b.onBeforeRender=se,_.add(b)),s.spots&&(x=new o(s.spots,new e({...A,uniforms:p,defines:s.defines,vertexShader:ne,fragmentShader:re})),x.frustumCulled=!1,x.onBeforeRender=se,_.add(x)),M.add(_);let S=i.kind===2?new n(j(-1,1),j(-.5,.5),j(-1,1)).normalize():new n(j(-.4,.4),1,j(-.4,.4)).normalize(),T=c.clone().add(new n(j(-250,250),j(-200,200),j(-250,250))),k={name:r,sp:i,r:d,U:p,obj:_,bell:y,tent:b,spots:x,home:c,pos:T,axis:S,vel:new n,ph:p.uPh.value,slow:(30/d)**.25,lt:j(0,100),dc:i.kind===0?.38+.12*f:.32+.1*f,dr:i.kind===0?1.05+.7*f:.95+.5*f,pause:j(0,.6),ct:0,c:0,fl:0,kick:i.kick*j(.85,1.1),speed:d*.5+4,f1:j(.03,.07),f2:j(.03,.07),f3:j(.04,.09),gw:v/j(6,10),spin:j(0,v),spinRate:(i.kind===2?j(.18,.35):j(.02,.06))*(E()<.5?-1:1),dist:0,flash:0,wave:p.uWave.value,hacc:0,dC:1e9,above:!0,P:null,Q:null};if(k.ct=j(0,k.dc+k.dr),b){let e=i.Lmax*d/15;k.P=[],k.Q=[];for(let t=0;t<h;t++){let n=T.clone().addScaledVector(S,-e*t);k.P.push(n),k.Q.push(n.clone())}}I.push(k)}let L=I.slice(),R=new s,z=new s,B=new s,V=new d,H=new l,U=new n,W=new n,G=new n,K=new i,q=new n,J=new n,Y=new n,X=new n,ce=new n,le=new t,ue=new t,Z={ray:new i,L:new i,s:0,on:!1},Q=[],$=new i;function de(e,t,n,r,i,a){let o=e.r,s=e.sp,c=e.U,l=e.ph,u=s.kind===2;e.lt+=n*e.slow;let d,f;if(u)d=.5+.5*Math.sin(e.lt*1.3+l),f=0;else{e.ct+=n*(1+.7*e.dist);let t=e.dc+e.dr+e.pause;if(e.ct>=t&&(e.ct-=t,e.pause=e.dist>.25?0:E()<.22?.5+1.8*E():.15*E()),e.ct<e.dc){let t=e.ct/e.dc;d=t*t*(3-2*t),f=0}else if(e.ct<e.dc+e.dr){let t=(e.ct-e.dc)/e.dr,n=1-t;d=n*n*n*(1+3*t),f=6.75*t*n*n}else d=0,f=0}let p=Math.max(0,d-e.c);e.c=d,e.fl=f,X.set(Math.sin(t*e.f1+l)*.7,u?Math.sin(t*e.f3+l)*.3:.5+.4*Math.sin(t*e.f3+l*2),Math.cos(t*e.f2+l*1.3)*.7),J.subVectors(e.home,e.pos);let m=J.length();m>1&&X.addScaledVector(J,b(150,900,m)*2.4/m),q.copy(e.pos).addScaledVector(e.axis,o*s.H*.5);let g=0;if(i){let t=K.distanceSqToPoint(q),n=250+o;if(t<n*n){g=1,K.closestPointToPoint(q,Y),Y.subVectors(q,Y);let t=Y.length();t>.001&&X.addScaledVector(Y,1.4*e.dist/t)}}if(a>.03){Y.subVectors(q,W);let e=Y.length();if(e>1&&e<2600){let t=Y.dot(G)/e;t>.94&&(g=Math.max(g,a*b(.94,.985,t)))}}if(Z.on){Z.L.closestPointToPoint(q,Y);let t=Y.distanceTo(Z.L.origin);Y.subVectors(q,Y);let r=Y.length(),i=150+o*1.4+t*.12,a=(1-b(i*.4,i*1.6,r))*Z.s;a>.005&&r>.001&&(g=Math.max(g,a),X.addScaledVector(Y,1.8*a/r),u||e.vel.addScaledVector(Y,o*.9*a*n/r))}e.dist+=(g-e.dist)*(1-Math.exp(-n*(g>e.dist?4:.28)));let x=X.length();x>1e-4?X.multiplyScalar(1/x):X.copy(y),u&&X.negate(),e.axis.lerp(X,1-Math.exp(-n*(.2+.5*e.dist))).normalize(),u?(Y.copy(e.axis).multiplyScalar(-e.speed*(1+e.dist)),e.vel.lerp(Y,1-Math.exp(-n*.7))):(e.vel.addScaledVector(e.axis,o*1.05*e.kick*p),e.vel.y-=.07*o*n,e.vel.multiplyScalar(Math.exp(-n*1.4))),Y.subVectors(q,U);let S=Y.length(),C=S-o*1.3;C<480&&S>.001&&e.vel.addScaledVector(Y,(480-Math.max(C,0))*1.2*n/S);let w=q.length(),T=w-o*1.3;if(T<320&&w>.001&&e.vel.addScaledVector(q,(320-Math.max(T,0))*1.2*n/w),e.pos.addScaledVector(e.vel,n).addScaledVector(ce,n),e.spin+=n*e.spinRate,le.setFromUnitVectors(y,e.axis),ue.setFromAxisAngle(y,e.spin),e.obj.quaternion.multiplyQuaternions(le,ue),e.obj.position.copy(e.pos),e.obj.updateMatrix(),e.P){let t=e.P,r=e.Q,i=s.Lmax*o/15,a=Math.exp(-n*2.6),l=n*n,u=1.8,d=.3*o;t[0].copy(e.pos),r[0].copy(e.pos);for(let n=1;n<h;n++){let o=t[n],s=r[n],c=(o.x-s.x)*a,f=(o.y-s.y)*a,p=(o.z-s.z)*a;s.copy(o);let m=e.pos.x-e.axis.x*i*n,h=e.pos.y-e.axis.y*i*n,g=e.pos.z-e.axis.z*i*n;o.x+=c+(m-o.x)*u*l,o.y+=f+((h-o.y)*u-d)*l,o.z+=p+(g-o.z)*u*l}for(let e=1;e<h;e++){let n=t[e-1],r=t[e],a=r.x-n.x,o=r.y-n.y,s=r.z-n.z,c=i/(Math.sqrt(a*a+o*o+s*s)||1e-6);r.set(n.x+a*c,n.y+o*c,n.z+s*c)}z.copy(e.obj.matrix).invert();let f=c.uSpine.value;for(let e=0;e<h;e++)f[e].copy(t[e]).applyMatrix4(z)}let D=c.uHist.value;if(D[0].set(d,f),e.hacc+=n,e.hacc>=_){for(let e=13;e>=2;e--)D[e].copy(D[e-1]);D[1].set(d,f),e.hacc=0}c.uHistAcc.value=e.hacc,q.copy(e.pos).addScaledVector(e.axis,o*s.H*.5),S=q.distanceTo(U),e.dC=S,Y.subVectors(U,e.pos),e.above=Y.dot(e.axis)>0;let O=r*b(150,420,S-o*1.3)*b(4700,3700,S);H.center.copy(e.pos).addScaledVector(e.axis,-o*s.Lmax*.35).applyMatrix4(M.matrixWorld),H.radius=o*(1.5+s.Lmax*.7)+60,e.obj.visible=O>.003&&V.intersectsSphere(H),e.flash*=Math.exp(-n*1.3),e.wave=(e.wave+n*(1.3+3.4*(e.dist+e.flash)))%v,c.uTime.value=e.lt,c.uPulse.value=d,c.uFlare.value=f,c.uFade.value=O,c.uDist.value=Math.min(e.dist+e.flash*1.2,2.2),c.uGlow.value=.5+.5*Math.sin(t*e.gw+l),c.uWave.value=e.wave}function fe(e,t,n={}){let r=n.intensity??1;if(M.visible=r>.002,!M.visible||!n.camera){Q.length=0;return}t=Math.min(Math.max(t||0,0),1/20);let i=n.camera;R.copy(M.matrixWorld).invert(),U.setFromMatrixPosition(i.matrixWorld).applyMatrix4(R),B.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse),V.setFromProjectionMatrix(B);let a=n.torch,o=a&&a.strength||0;N.uTorchStr.value=o,a&&a.pos&&(N.uTorchPos.value.copy(a.pos),W.copy(a.pos).applyMatrix4(R)),a&&a.dir&&(N.uTorchDir.value.copy(a.dir).normalize(),G.copy(N.uTorchDir.value).transformDirection(R));let s=!!n.pointerRay;s&&K.copy(n.pointerRay).applyMatrix4(R),n.fogColor&&N.uFogCol.value.copy(n.fogColor),n.fogDensity&&(N.uFogDen.value=n.fogDensity);let c=N.uFogCol.value,l=n.ambient??1;for(N.uAmb.value.setRGB((c.r*3+.006)*l,(c.g*3+.01)*l,(c.b*3+.014)*l),ce.set(Math.sin(e*.031)*7,Math.sin(e*.023)*2,Math.cos(e*.027)*5),Z.on&&Z.L.copy(Z.ray).applyMatrix4(R);Q.length;){let e=Q.pop();$.copy(e.ray).applyMatrix4(R);for(let t of I){let n=t.r;q.copy(t.pos).addScaledVector(t.axis,n*t.sp.H*.5),$.closestPointToPoint(q,Y);let r=Y.distanceTo($.origin);Y.subVectors(q,Y);let i=Y.length(),a=200+n*1.5+r*.15,o=e.power*(1-b(a*.5,a*1.8,i));o<.02||(t.dist=Math.max(t.dist,o),t.flash=Math.max(t.flash,o),t.sp.kind!==2&&t.c<.3&&(t.ct=0,t.pause=0),i>.001&&t.vel.addScaledVector(Y,n*(t.sp.kind===2?1.2:2.2)*o/i))}}for(let n=0;n<I.length;n++)de(I[n],e,t,r,s,o);for(let e=1;e<L.length;e++){let t=L[e],n=e-1;for(;n>=0&&L[n].dC<t.dC;)L[n+1]=L[n],n--;L[n+1]=t}for(let e=0;e<L.length;e++){let t=L[e],n=f+e*3;t.tent?(t.tent.renderOrder=t.above?n:n+1,t.bell.renderOrder=t.above?n+1:n):t.bell.renderOrder=n,t.spots&&(t.spots.renderOrder=n+2)}}function pe(){for(let e of Object.keys(F))F[e].bell.dispose(),F[e].tent?.dispose(),F[e].spots?.dispose();for(let e of I)e.bell.material.dispose(),e.tent?.material.dispose(),e.spots?.material.dispose()}function me(e,t=1){Z.on=!!e&&t>.005,Z.on&&(Z.ray.copy(e),Z.s=Math.min(t,1))}function he(e,t=1){e&&Q.length<4&&Q.push({ray:e.clone(),power:t})}return{group:M,update:fe,dispose:pe,jellies:I,uniforms:N,setCursor:me,touch:he}}export{j as createJellyfish};