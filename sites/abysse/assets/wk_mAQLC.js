import{A as e,F as t,_ as n,g as r,m as i,s as a,u as o,w as s,x as c}from"./BuJhsgJA.js";import{GLSL as l}from"./1tex1Rnz.js";var u=9810,d=(e,t,n)=>{let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)},f=(e,t)=>e+(t-e)*Math.random(),p=`
uniform vec3 uSunDir, uSunCol, uSkyCol, uHorCol, uDeepCol;
vec3 envAir(vec3 d){
  vec3 sky = mix(uHorCol, uSkyCol, smoothstep(0., .55, d.y));
  vec3 sea = mix(uHorCol * .3, uDeepCol, 1. - smoothstep(-.25, 0., d.y));
  vec3 c = mix(sea, sky, smoothstep(-.03, .03, d.y));
  float s = max(dot(d, uSunDir), 0.);
  return c + uSunCol * (pow(s, 14.) * .3 + s * s * .05);
}
float sh21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float svn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(sh21(i), sh21(i + vec2(1., 0.)), f.x), mix(sh21(i + vec2(0., 1.)), sh21(i + vec2(1., 1.)), f.x), f.y); }`,m=`
uniform float uRb, uH, uTanL, uFingAmp, uFingN, uSeed;
varying vec3 vW; varying vec3 vN; varying float vV; varying float vF; varying float vTh;
float fing(float th){ float s = .5 + .5 * cos(th * uFingN + uSeed + .7 * sin(th * 3. + uSeed * 1.7)); return s * s * s * s; }
vec3 crownPos(float th, float v){
  float f = fing(th);
  float h = uH * (1. + uFingAmp * f * v * v * v);
  float r = uRb + uH * uTanL * pow(v, 1.5) + uH * .07 * smoothstep(.7, 1., v) * (.5 + f);
  r *= 1. + .035 * sin(th * 5. + uSeed * 2.3) * v;
  return vec3(cos(th) * r, h * v - 3. * (1. - v), sin(th) * r);
}
void main(){
  float th = uv.x * 6.2831853, v = uv.y;
  vec3 p = crownPos(th, v);
  vec3 dT = crownPos(th + .01, v) - crownPos(th - .01, v);
  vec3 dV = crownPos(th, min(v + .02, 1.)) - crownPos(th, max(v - .02, 0.));
  vec3 n = cross(dV, dT); n = dot(n, n) > 1e-12 ? normalize(n) : vec3(cos(th), 0., sin(th));
  vec4 w = modelMatrix * vec4(p, 1.);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * n); vV = v; vF = fing(th); vTh = th;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,h=`
uniform float uJ, uJr, uSeed;
varying vec3 vW; varying vec3 vN; varying float vV; varying float vF; varying float vTh;
vec3 jetPos(float th, float v){
  float r = uJr * (1. + 2.6 * pow(1. - v, 4.));
  float b = (v - .9) / .06, c = max(v - .93, 0.) / .07;
  r *= 1. + .45 * exp(-b * b);                                         // the bead that will pinch off
  r *= sqrt(max(0., 1. - c * c));                                      // round tip
  float sway = sin(v * 2.5 + uSeed) * uJ * .03;
  return vec3(cos(th) * r + sway, uJ * v - 2., sin(th) * r);
}
void main(){
  float th = uv.x * 6.2831853, v = uv.y;
  vec3 p = jetPos(th, v);
  vec3 dT = jetPos(th + .02, v) - jetPos(th - .02, v);
  vec3 dV = jetPos(th, min(v + .02, 1.)) - jetPos(th, max(v - .02, 0.));
  vec3 n = cross(dV, dT); n = dot(n, n) > 1e-12 ? normalize(n) : vec3(0., 1., 0.);
  vec4 w = modelMatrix * vec4(p, 1.);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * n); vV = v; vF = 1.; vTh = th;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,g=p+`
uniform float uAlpha, uBreak, uCover, uSeed;
varying vec3 vW; varying vec3 vN; varying float vV; varying float vF; varying float vTh;
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
  if (dot(N, V) < 0.) N = -N;
  float NV = clamp(dot(N, V), 0., 1.);
  float F = .02 + .98 * pow(1. - NV, 5.);
  vec3 R = reflect(-V, N);
  vec3 refl = envAir(R);
  float sR = max(dot(R, uSunDir), 0.);
  vec3 spec = uSunCol * (pow(sR, 500.) * 40. + pow(sR, 50.) * 1.1);
  float back = pow(max(dot(-V, uSunDir), 0.), 5.);                   // the low sun shining through the sheet
  vec3 behind = envAir(normalize(-V + N * .3));                       // what the sheet bends: the world behind it
  vec3 body = behind * .85 + uSunCol * back * .7;
  float edge = pow(1. - NV, 2.);
  float cover = uCover + .7 * edge;
  float bead = smoothstep(.86, .98, vV) * (.35 + .65 * vF);           // the thick rim, beading into fingers
  cover = min(1., cover + bead * .45);
  // the sheet thins and tears: between the fingers first, then holes everywhere
  float nz = svn(vec2(cos(vTh), sin(vTh)) * 4.5 + vec2(vV * 3.1, -vV * 2.3) + uSeed);
  float tear = uBreak > 0. ? smoothstep(1. - uBreak, 1.12 - uBreak, nz * (.6 + .4 * vV)) : 0.;
  float rim = smoothstep(.8, 1., vV) * (1. - vF) * uBreak;
  float mask = (1. - tear) * (1. - rim) * smoothstep(0., .12, vV) * (1. - smoothstep(.97, 1., vV + (1. - vF) * .02));
  float a = clamp(cover * mask * uAlpha, 0., 1.);
  vec3 col = mix(body, refl, F);
  gl_FragColor = vec4(col * a + spec * mask * uAlpha, a);
}`,ee=`
uniform float uD, uRc, uNeck, uSeed, uTau;
varying vec3 vW; varying vec3 vN; varying float vV;
vec3 cavPos(float th, float v){
  float k = (v - .52) / .17;
  float r = uRc * (.82 + .18 * v) * (1. - .93 * uNeck * exp(-k * k));
  r *= .55 + .45 * smoothstep(0., .12, v);
  r += 8. * pow(v, 6.);
  r *= 1. + .05 * sin(th * 4. + v * 9. + uSeed) + .03 * sin(v * 14. - uTau * 90. + th * 3.);
  return vec3(cos(th) * r, mix(-uD, 1.5, v), sin(th) * r);
}
void main(){
  float th = uv.x * 6.2831853, v = uv.y;
  vec3 p = cavPos(th, v);
  vec3 dT = cavPos(th + .02, v) - cavPos(th - .02, v);
  vec3 dV = cavPos(th, min(v + .02, 1.)) - cavPos(th, max(v - .02, 0.));
  vec3 n = cross(dV, dT); n = dot(n, n) > 1e-12 ? normalize(n) : vec3(0., -1., 0.);
  vec4 w = modelMatrix * vec4(p, 1.);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * n); vV = v;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,_=`
uniform vec3 uBubCol, uDeepCol; uniform float uAlpha, uLight;
varying vec3 vW; varying vec3 vN; varying float vV;
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
  if (dot(N, V) < 0.) N = -N;
  float NV = clamp(dot(N, V), 0., 1.);
  float tir = 1. - smoothstep(.6, .72, NV);                            // past the critical angle the air is a mirror
  vec3 R = reflect(-V, N);
  vec3 env = mix(uDeepCol * 1.6, uBubCol * 1.5, smoothstep(-.45, .9, R.y)) * uLight;
  vec3 through = uBubCol * .6 * uLight;                                // the light of the surface seen through the air
  vec3 col = mix(through, env, max(tir, .3));
  col += uBubCol * pow(1. - NV, 8.) * 1.2 * uLight;
  float a = (.5 + .45 * tir) * uAlpha * (1. - smoothstep(.9, 1., vV));
  gl_FragColor = vec4(col * a, a);
}`,v=`
#ifdef RIPPLES
${l}
#endif
varying vec2 vP;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vP = position.xz;
#ifdef RIPPLES
  w.y += rippleHeight(w.xz);
#endif
  w.y += .6;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,y=p+`
uniform float uRf, uWf, uRing, uInner, uRi, uTau, uSeed, uAbove, uBelow;
varying vec2 vP;
vec2 fh2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
float lace(vec2 x, float w){
  vec2 n = floor(x), f = fract(x); float F1 = 8., F2 = 8.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 g = vec2(float(i), float(j)); vec2 r = g + fh2(n + g) - f; float d = dot(r, r);
    if (d < F1){ F2 = F1; F1 = d; } else if (d < F2) F2 = d;
  }
  return 1. - smoothstep(0., w, sqrt(F2) - sqrt(F1));                  // bright on the walls between bubbles
}
void main(){
  float r = length(vP);
  float x = (r - uRf) / uWf;
  float ring = exp(-x * x) * uRing;
  float inner = uInner * (1. - smoothstep(uRi * .4, uRi, r));
  float cover = ring + inner;
  if (cover < .004) discard;
  vec2 q = vP * .085 / (1. + uTau * .5) + uSeed;                        // the cells grow as the foam ages
  float w = mix(.32, .1, clamp(uTau, 0., 1.));
  float m = lace(q, w) * .75 + lace(q * 2.3 + 7.1, w) * .45 + svn(vP * .6) * .12;
  float a = clamp(cover * (m * 1.25 + .06), 0., 1.);
  vec3 lit = uSunCol * (.2 + .8 * max(uSunDir.y, 0.)) * .45 + uSkyCol * .9 + uHorCol * .15;
  vec3 c; float k;
  if (gl_FrontFacing){ c = lit; k = uAbove; }
  else { c = uDeepCol * 2.5 + uSkyCol * .25; k = uBelow * .7; }       // from below: foam shades the light
  a *= k;
  gl_FragColor = vec4(c * a, a);
}`,te=`
attribute vec3 iPos; attribute vec3 iVel; attribute vec4 iData;   // diameter (mm), alpha, age (s), kind (0 drop, 1 blob/big bubble)
uniform float uShutter;
varying vec2 vUv; varying vec4 vAx; varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(iPos, 1.);
  float d = iData.x;
#ifdef BUBBLE
  vec2 ay = normalize((mat3(viewMatrix) * vec3(0., 1., 0.)).xy + vec2(0., 1e-4));
  vec2 ax = vec2(ay.y, -ay.x);
  float ob = iData.w * (.16 + .07 * sin(iData.z * 40. + d * 3.));     // big bubbles flatten and wobble
  float lx = d * (1. + ob), ly = d * (1. - ob);
#else
  vec3 vel = mat3(modelViewMatrix) * iVel;
  float sp = length(vel.xy);
  vec2 ax = sp > 1e-3 ? vel.xy / sp : vec2(1., 0.);
  vec2 ay = vec2(-ax.y, ax.x);
  float wob = iData.w * .22 * exp(-iData.z * 6.) * sin(iData.z * 270.);   // ~43 Hz, the ring of a 4 mm drop
  float lx = d * (1. + wob) + sp * uShutter, ly = d * (1. - wob);
#endif
  mv.xy += ax * position.x * lx + ay * position.y * ly;
  vUv = position.xy * 2.; vAx = vec4(ax, ay); vA = iData.y;
  gl_Position = projectionMatrix * mv;
}`,ne=p+`
uniform float uVis;
varying vec2 vUv; varying vec4 vAx; varying float vA;
void main(){
  float r2 = dot(vUv, vUv); if (r2 >= 1.) discard;
  float nz = sqrt(1. - r2);
  vec3 nV = vec3(vAx.xy * vUv.x + vAx.zw * vUv.y, nz);
  float F = .02 + .98 * pow(1. - nz, 5.);
  vec3 Rv = reflect(vec3(0., 0., -1.), nV);
  vec3 Tv = normalize(vec3(-nV.xy * 1.4, -1.));                         // the ball lens: the world behind, upside down
  mat3 toW = transpose(mat3(viewMatrix));
  vec3 Rw = toW * Rv, Tw = toW * Tv;
  float sR = max(dot(Rw, uSunDir), 0.), sT = max(dot(Tw, uSunDir), 0.);
  vec3 c = envAir(Tw) * (1. - F) * (1. - .6 * smoothstep(.5, 1., r2)) + envAir(Rw) * F;
  c += uSunCol * (pow(sR, 700.) * 30. + pow(sR, 60.) * 1.1 + pow(sT, 30.) * 5.);   // glint + the sun focused through the drop
  float a = (1. - smoothstep(.8, 1., r2)) * vA * uVis;
  gl_FragColor = vec4(c * a, a);
}`,re=`
uniform vec3 uBubCol; uniform float uLight, uVis;
varying vec2 vUv; varying vec4 vAx; varying float vA;
void main(){
  float r2 = dot(vUv, vUv); if (r2 >= 1.) discard;
  float r = sqrt(r2);
  float rim = smoothstep(.6, .92, r) * (1. - smoothstep(.92, 1., r));
  // the quad's y axis is world up: the light of the surface sits on top, its refracted echo below
  float hi = 1. - smoothstep(0., .24, length(vUv - vec2(-.15, .45)));
  float hi2 = (1. - smoothstep(0., .16, length(vUv + vec2(-.1, .55)))) * .35;
  float core = .07 * (1. - r);
  vec3 c = uBubCol * uLight * (rim * .9 + core) + vec3(1., .98, .93) * uLight * (hi * 1.8 + hi2);
  float a = clamp(rim * .55 + hi * .8 + core, 0., 1.) * vA * uVis;
  gl_FragColor = vec4(c * vA * uVis, a * .6);
}`,b=e=>Object.assign(e,{transparent:!0,depthWrite:!1,fog:!1,blending:5,blendEquation:100,blendSrc:201,blendDst:205,blendSrcAlpha:201,blendDstAlpha:205});function ie({ripples:l=null,timeScale:p=.42,drops:ie=320,bubbles:ae=280}={}){let x=new i;x.name=`splash`,x.visible=!1;let S=new i;x.add(S);let C={uSunDir:{value:new t(-.35,.42,-1).normalize()},uSunCol:{value:new a(1,.64,.4).multiplyScalar(2.2)},uSkyCol:{value:new a(.2,.32,.48)},uHorCol:{value:new a(.7,.52,.44)},uDeepCol:{value:new a(.006,.03,.04)},uBubCol:{value:new a(.7,.93,1)}},w={...C,uRb:{value:21},uH:{value:0},uTanL:{value:.25},uFingAmp:{value:0},uFingN:{value:18},uSeed:{value:0},uAlpha:{value:0},uBreak:{value:0},uCover:{value:.16}},T=new c(new s(1,1,144,28),b(new e({uniforms:w,vertexShader:m,fragmentShader:g,side:2})));T.frustumCulled=!1,T.renderOrder=6,S.add(T);let oe={...C,uJ:{value:0},uJr:{value:3},uSeed:w.uSeed,uAlpha:{value:0},uBreak:{value:0},uCover:{value:.45}},E=new c(new s(1,1,24,40),b(new e({uniforms:oe,vertexShader:h,fragmentShader:g,side:2})));E.frustumCulled=!1,E.renderOrder=6,S.add(E);let D={uBubCol:C.uBubCol,uDeepCol:C.uDeepCol,uD:{value:0},uRc:{value:20},uNeck:{value:0},uSeed:w.uSeed,uTau:{value:0},uAlpha:{value:0},uLight:{value:1}},O=new c(new s(1,1,48,24),b(new e({uniforms:D,vertexShader:ee,fragmentShader:_,side:2})));O.frustumCulled=!1,O.renderOrder=5,S.add(O);let k={...C,uRf:{value:30},uWf:{value:6},uRing:{value:0},uInner:{value:0},uRi:{value:40},uTau:{value:0},uSeed:{value:0},uAbove:{value:1},uBelow:{value:0}};l&&Object.assign(k,l.uniforms);let se=new s(720,720,56,56);se.rotateX(-Math.PI/2);let A=new c(se,b(new e({uniforms:k,vertexShader:v,fragmentShader:y,side:2,defines:l?{RIPPLES:1}:{}})));A.frustumCulled=!1,A.renderOrder=5,S.add(A);function ce(t,i,a,l){let u=new n,d=new s(1,1);u.index=d.index,u.setAttribute(`position`,d.attributes.position);let f=new r(new Float32Array(t*3),3).setUsage(o),p=new r(new Float32Array(t*3),3).setUsage(o),m=new r(new Float32Array(t*4),4).setUsage(o);u.setAttribute(`iPos`,f),u.setAttribute(`iVel`,p),u.setAttribute(`iData`,m),u.instanceCount=0;let h=b(new e({uniforms:{...C,...a},vertexShader:te,fragmentShader:i,defines:l})),g=new c(u,h);return g.frustumCulled=!1,g.renderOrder=7,{mesh:g,geo:u,mat:h,iPos:f,iVel:p,iData:m}}let j=ie+12,M=ae,N=ce(j,ne,{uShutter:{value:1/600},uVis:{value:1}},{}),P=ce(M,re,{uShutter:{value:0},uVis:{value:1},uLight:D.uLight},{BUBBLE:1});S.add(N.mesh,P.mesh);let F={n:j,st:new Uint8Array(j),p:new Float32Array(j*3),v:new Float32Array(j*3),d:new Float32Array(j),birth:new Float32Array(j),age:new Float32Array(j),kind:new Uint8Array(j)},I={n:M,st:new Uint8Array(M),p:new Float32Array(M*3),v:new Float32Array(M*3),d:new Float32Array(M),age:new Float32Array(M),ph:new Float32Array(M),kind:new Uint8Array(M)},L=!1,R=0,z=1,B=0,le=18,V=-1,H=-1,U=-1,W=1,ue=!1,de=!1,fe=!1,G=0,K=0,q=NaN,pe=1.1,J={H:0,Rb:21,tanL:.25,fing:0,brk:0,alpha:0,tpk:.08,tend:.18},Y={...J},me=new t(0,1,0),he=new t;function ge(e,t){let n=1150*Math.sqrt(z),r=14e3,i=8800,a=n/r,o=n*n/(2*r),s=a+Math.sqrt(2*o/i),c;if(e<a)c=n*e-.5*r*e*e;else{let t=e-a;c=o-.5*i*t*t}return t.H=Math.max(0,c),t.Rb=21+15*z**.3*(1-Math.exp(-Math.max(e,0)/.05)),t.tanL=.25+.5*d(a*.6,s,e),t.fing=.38*d(.015,a,e),t.brk=d(a*.85,s,e),t.alpha=d(0,.008,e)*(1-d(s-.04,s,e)),t.tpk=a,t.tend=s,t}let _e=e=>{let t=.5+.5*Math.cos(e*le+B+.7*Math.sin(e*3+B*1.7));return t*t*t*t};function X(e,t,n,r){ge(t,Y);let i=_e(e),a=Y.H*(1+Y.fing*i),o=(Y.Rb+Y.H*Y.tanL+Y.H*.07*(.5+i))*(1+.035*Math.sin(e*5+B*2.3));n[r]=Math.cos(e)*o,n[r+1]=a,n[r+2]=Math.sin(e)*o}let Z=new Float32Array(3),Q=new Float32Array(3);function $(e,t,n,r,i,a,o,s,c,l){F.st[e]=1,F.birth[e]=t,F.age[e]=0,F.d[e]=c,F.kind[e]=l,F.p[e*3]=n,F.p[e*3+1]=r,F.p[e*3+2]=i,F.v[e*3]=a,F.v[e*3+1]=o,F.v[e*3+2]=s}function ve(e,t){e.geo.instanceCount=t,e.mesh.visible=t>0,t!==0&&(e.iPos.clearUpdateRanges(),e.iPos.addUpdateRange(0,t*3),e.iPos.needsUpdate=!0,e.iVel.clearUpdateRanges(),e.iVel.addUpdateRange(0,t*3),e.iVel.needsUpdate=!0,e.iData.clearUpdateRanges(),e.iData.addUpdateRange(0,t*4),e.iData.needsUpdate=!0)}function ye(){for(let e=0;e<I.n;e++)if(I.st[e]===0)return e;return-1}function be(e,t,n,r,i,a,o){let s=ye();s<0||(I.st[s]=2,I.age[s]=0,I.d[s]=o,I.ph[s]=Math.random()*6.283,I.kind[s]=+(o>3.2),I.p[s*3]=e,I.p[s*3+1]=t,I.p[s*3+2]=n,I.v[s*3]=r,I.v[s*3+1]=i,I.v[s*3+2]=a)}function xe(e=1){z=Math.min(2,Math.max(.25,e)),L=!0,x.visible=!0,R=0,B=Math.random()*100,w.uSeed.value=B,k.uSeed.value=Math.random()*50,le=Math.round(16+6*Math.random()+2*z),w.uFingN.value=le,V=-1,H=-1,U=-1,ue=!1,de=!1,fe=!1,K=0,G=0,F.st.fill(0),I.st.fill(0),ge(0,J);let t=J.tend,n=J.tpk;q=NaN;let r=Math.min(ie,Math.round(ie*Math.min(1.3,.45+.55*z))),i=Math.sqrt(z);for(let e=0;e<r;e++){let n=Math.random();if(n<.15){let t=Math.random()*6.283,n=f(.2,.6),r=f(1800,3200)*i,a=f(21,26);$(e,f(0,.025),Math.cos(t)*a,f(.5,3),Math.sin(t)*a,Math.cos(t)*Math.cos(n)*r,Math.sin(n)*r,Math.sin(t)*Math.cos(n)*r,f(.3,.9),0)}else if(n<.25){let t=Math.random()*6.283,n=f(18,30),r=f(250,900)*i;$(e,f(0,.06),Math.cos(t)*n,f(1,6),Math.sin(t)*n,Math.cos(t)*r,f(1400,2600)*i,Math.sin(t)*r,f(.25,.6),0)}else{let n=0;for(let e=0;e<8&&(n=Math.random()*6.283,!(Math.random()<_e(n)+.05));e++);let r=.025+(t*.85-.025)*Math.random()**1.3;X(n,r,Z,0),X(n,r+.002,Q,0);let a=Math.cos(n),o=Math.sin(n),s=f(250,800)*i,c=f(150,700)*i,l=f(-60,60);$(e,r,Z[0],Z[1],Z[2],(Q[0]-Z[0])/.002+a*s-o*l,(Q[1]-Z[1])/.002+c,(Q[2]-Z[2])/.002+o*s+a*l,(.6+2.2*Math.random()**2.2)*(1+.5*r/t),0)}}for(let e=0,a=r;e<4&&a<j-3;e++,a++){let e=0;for(let t=0;t<12&&(e=Math.random()*6.283,!(_e(e)>.8));t++);let r=f(n*.9,t*.8);X(e,r,Z,0),X(e,r+.002,Q,0),$(a,r,Z[0],Z[1],Z[2],(Q[0]-Z[0])/.002+Math.cos(e)*300*i,(Q[1]-Z[1])/.002+f(300,600)*i,(Q[2]-Z[2])/.002+Math.sin(e)*300*i,f(2.8,4.2)*z**.3,1)}for(let e=0;e<F.n;e++)F.st[e]===1&&(F.st[e]=3);l&&l.addDrop(0,0,30*z**.3,-4.5*z)}function Se(e){if(U<0||e<U)return 0;let t=e-U,n=1050*Math.sqrt(z)*W;return Math.max(0,n*t-.5*u*t*t)}function Ce(e,t,n={}){if(!L){x.visible&&=!1;return}let r=Math.min(Math.max(t||0,0),.05)*p;if(R+=r,R>pe){L=!1,x.visible=!1,N.geo.instanceCount=0,P.geo.instanceCount=0;return}let i=n.waterY??0;if(S.position.set(0,i,0),typeof n.heightAt==`function`){let e=n.heightAt(0,0),t=n.heightAt(60,0),r=n.heightAt(0,60);he.set(-(t-e)/60,1,-(r-e)/60).normalize(),S.quaternion.setFromUnitVectors(me,he)}else S.quaternion.identity();n.sunDir&&C.uSunDir.value.copy(n.sunDir).normalize();let a=Math.min(1,Math.max(0,n.underwater??0));D.uLight.value=n.light??1;let o=(n.watchTop??18)-i,s=(n.watchBottom??-18)-i;if(Number.isNaN(q)&&(q=o),r>0){let e=(o-q)/r;G+=(Math.max(-3e3,Math.min(3e3,e))-G)*Math.min(1,r*30)}q=o;let c=1-d(.9500000000000001,pe,R);if(ge(R,J),w.uH.value=J.H,w.uRb.value=J.Rb,w.uTanL.value=J.tanL,w.uFingAmp.value=J.fing,w.uBreak.value=J.brk,w.uAlpha.value=J.alpha*(1-d(.15,.55,a)),T.visible=J.alpha>.002&&J.H>.3,!de&&R>J.tend-.01&&(de=!0,l)){let e=J.Rb+20*z*.75;for(let t=0;t<10;t++){let n=t/10*6.283+B;l.addDrop(Math.cos(n)*e,Math.sin(n)*e,16,-.9*z)}}let m=-o;V<0&&m>2&&R<.4&&(V=R),V>=0&&H<0&&R>V+.1&&(H=R),U<0&&(H>=0?(U=H,W=1):(R>.4||V<0&&R>.16)&&(U=Math.max(R,.16),W=.6));let h=0;if(V>=0){let e=R-V,t=d(.03,.1,e);h=d(0,.02,e)*(H>=0?1-d(H,H+.035,R):1),D.uD.value=Math.min(140,Math.max(0,m)),D.uRc.value=19*z**.15,D.uNeck.value=t,D.uTau.value=R,D.uAlpha.value=h*(.15+.85*a)}if(O.visible=h>.002&&m>2,H>=0&&!ue){ue=!0;let e=Math.min(140,Math.max(4,m)),t=Math.round(110*Math.min(1.4,z));for(let n=0;n<t;n++){let t=Math.random()**.7,n=-e*t*.95-1,r=Math.random()*6.283,i=Math.sqrt(Math.random())*16,a=t>.7&&Math.random()<.25;be(Math.cos(r)*i,n,Math.sin(r)*i,-Math.cos(r)*i*4,f(-60,120),-Math.sin(r)*i*4,a?f(3,6.5):.4+2.4*Math.random()**2)}}let g=Se(R);if(U>=0&&R>=U){let e=R-U,t=1050*Math.sqrt(z)*W,n=t/u;oe.uJ.value=g,oe.uJr.value=(2+1.1*Math.sqrt(z))*W*(1+.8*d(n,2*n,e)),oe.uAlpha.value=d(0,.01,e)*(1-d(.15,.55,a))*c;for(let i=0;i<3;i++){let a=n*(.62+i*.17),o=j-1-i;e>=a&&F.st[o]===0&&e-r<a&&$(o,R,f(-1,1),g+1,f(-1,1),f(-70,70),t-u*e+f(150,260),f(-70,70),(4.2-i*.8)*z**.3*W,1)}!fe&&e>n&&g<=.5&&(fe=!0,l&&l.addDrop(0,0,12,-1.6*z*W))}E.visible=g>.6;let ee=z**.4;k.uTau.value=R,k.uRf.value=24+190*ee*(1-Math.exp(-R/.45)),k.uWf.value=5+38*R,k.uRing.value=d(0,.04,R)*Math.exp(-R/.6)*c,k.uInner.value=d(J.tend*.8,J.tend+.05,R)*Math.exp(-Math.max(0,R-J.tend)/.4)*c,k.uRi.value=J.Rb*1.9,k.uAbove.value=1-.3*a,k.uBelow.value=a;let _=0;if(r>0)for(let e=0;e<F.n;e++){let t=F.st[e];if(t===0)continue;if(t===3){if(R<F.birth[e])continue;F.st[e]=1}let n=e*3,i=F.d[e],a=2.6/Math.max(i,.25),o=Math.exp(-a*r);F.v[n+1]-=u*r,F.v[n]*=o,F.v[n+1]*=o,F.v[n+2]*=o,F.p[n]+=F.v[n]*r,F.p[n+1]+=F.v[n+1]*r,F.p[n+2]+=F.v[n+2]*r,F.age[e]+=r,F.p[n+1]<-i*.5&&F.v[n+1]<0&&(F.st[e]=0,l&&i>.8&&_<6&&(_++,l.addDrop(F.p[n],F.p[n+2],Math.max(8,i*5),-Math.min(1.2,i*.3))))}if(r>0){if(R<.03)for(K+=r*900*z;K>=1;){K--;let e=Math.random()*6.283,t=f(18,26);be(Math.cos(e)*t,f(-12,-2),Math.sin(e)*t,0,f(-200,0),0,f(.3,1.2))}else if(R<.75&&s<-3){K+=r*170*z*(1-d(.4,.75,R));let e=Math.min(o,-3),t=Math.min(0,G);for(;K>=1;){K--;let n=Math.random()*6.283,r=Math.sqrt(Math.random())*15;be(Math.cos(n)*r,e-Math.random()*4,Math.sin(n)*r,Math.cos(n)*30,t*.8,Math.sin(n)*30,.35+1.8*Math.random()**2.5)}}for(let e=0;e<I.n;e++){if(I.st[e]===0)continue;let t=e*3,n=I.d[e],i=Math.min(320,90+70*n);I.v[t+1]+=(i-I.v[t+1])*Math.min(1,r*7);let a=Math.exp(-6*r);I.v[t]*=a,I.v[t+2]*=a,I.p[t]+=I.v[t]*r,I.p[t+1]+=I.v[t+1]*r,I.p[t+2]+=I.v[t+2]*r,I.age[e]+=r,I.p[t+1]>-n*.5&&(I.st[e]=0,l&&n>1.6&&_<8&&(_++,l.addDrop(I.p[t],I.p[t+2],Math.max(7,n*3),.25)))}}let v=0;{let e=N.iPos.array,t=N.iVel.array,n=N.iData.array;for(let r=0;r<F.n;r++){if(F.st[r]!==1)continue;let i=r*3,a=v*3,o=v*4;e[a]=F.p[i],e[a+1]=F.p[i+1],e[a+2]=F.p[i+2],t[a]=F.v[i],t[a+1]=F.v[i+1],t[a+2]=F.v[i+2],n[o]=F.d[r],n[o+1]=Math.min(1,F.age[r]*200)*c,n[o+2]=F.age[r],n[o+3]=F.kind[r],v++}}let y=0;{let e=P.iPos.array,t=P.iVel.array,n=P.iData.array;for(let r=0;r<I.n;r++){if(I.st[r]===0)continue;let i=r*3,a=y*3,o=y*4,s=I.d[r],l=I.age[r],u=I.ph[r],f=s*(.35+.1*s);e[a]=I.p[i]+Math.sin(l*(24-s*2)+u)*f,e[a+1]=I.p[i+1],e[a+2]=I.p[i+2]+Math.cos(l*(21-s*2)+u)*f,t[a]=0,t[a+1]=0,t[a+2]=0,n[o]=s,n[o+1]=Math.min(1,l*40)*c*(1-d(-s*2.5,-s*.5,I.p[i+1])*.6),n[o+2]=l,n[o+3]=I.kind[r],y++}}ve(N,v),ve(P,y),N.mat.uniforms.uVis.value=1-.85*a,P.mat.uniforms.uVis.value=.3+.7*a}function we(){for(let e of[T,E,O,A,N.mesh,P.mesh])e.geometry.dispose(),e.material.dispose()}return{group:x,trigger:xe,update:Ce,dispose:we,uniforms:C,get active(){return L},get time(){return R/p},set timeScale(e){p=e},get timeScale(){return p}}}export{ie as createSplash};