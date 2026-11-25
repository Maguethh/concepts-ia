import{A as e,M as t,N as n,O as r,P as i,S as a,T as o,_ as s,a as c,b as l,c as u,h as d,i as f,l as p,n as m,o as h,p as g,r as _,t as v,u as y,x as b}from"./CLX5H_s7.js";var x=Math.PI*2,S=918273,C=()=>(S=S*16807%2147483647)/2147483647,w=(e,t)=>e+(t-e)*C(),T=(e,t,n)=>e<t?t:e>n?n:e,E=(e,t,n)=>{let r=T((n-e)/(t-e),0,1);return r*r*(3-2*r)},D=()=>new n,O=`
uniform float uVis, uFogK;
`,k=`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float cFogD = vFogDepth * uFogK;
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * cFogD * cFogD );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
  #endif
  fogFactor = 1.0 - ( 1.0 - fogFactor ) * uVis;
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#else
  gl_FragColor.rgb *= uVis;
#endif
`,A=new i;function ee(e){return function(t){t.getCurrentViewport(A),e.uniforms.uHalfH.value=Math.max(1,A.w*.5)}}function te(t,n,r,i){let a=new e({uniforms:{uHalfH:{value:450},...n},vertexShader:r,fragmentShader:i,transparent:!0,depthWrite:!1,blending:2,fog:!1}),s=new o(t,a);return s.frustumCulled=!1,s.renderOrder=6,s.visible=!1,s.onBeforeRender=ee(a),s}var j=-.42,ne={sardine:{H:.1,W:.48,peak:1.35,blunt:.72,ped:.024,belly:1.08,seg:18,rad:10,K:6.6,bend:2,tail:[[-.42,.024],[-.6,.14],[-.535,0],[-.6,-.14],[-.42,-.024]],dorsal:[-.04,.1,-.08,.07],anal:[-.28,-.19,-.3,.035]},tuna:{H:.125,W:.8,peak:1,blunt:.62,ped:.012,belly:1,seg:26,rad:14,K:5.2,bend:3.2,tail:[[-.42,.014],[-.61,.23],[-.49,0],[-.61,-.23],[-.42,-.014]],dorsal:[.06,.2,.02,.1],dorsal2:[-.13,-.05,-.17,.075],anal:[-.13,-.05,-.17,.075]},lantern:{H:.11,W:.56,peak:1.65,blunt:.45,ped:.03,belly:1,seg:14,rad:8,K:6.3,bend:2,tail:[[-.42,.03],[-.58,.125],[-.52,0],[-.58,-.125],[-.42,-.03]],dorsal:[-.06,.12,-.05,.055],anal:[-.3,-.18,-.31,.04]}},M=(e,t)=>e.H*Math.max(Math.sin(Math.PI*t**+e.peak),0)**+e.blunt+e.ped*(1-t)*(1-t),N=e=>T((e-j)/.9199999999999999,0,1);function re(e){let t=[],n=[],r=[],i=e.seg,a=e.rad;for(let r=0;r<=i;r++){let o=r/i,s=j+.9199999999999999*o,c=M(e,o),l=c*e.W;for(let r=0;r<a;r++){let i=r/a*x,u=Math.sin(i),d=Math.cos(i);t.push(s,c*u*(u<0?e.belly:1),l*d),n.push(o,u)}}let o=(e,t)=>e*a+t%a;for(let e=0;e<i;e++)for(let t=0;t<a;t++)r.push(o(e,t),o(e+1,t),o(e,t+1),o(e,t+1),o(e+1,t),o(e+1,t+1));let s=t.length/3;t.push(-.424,0,0),n.push(0,0);for(let e=0;e<a;e++)r.push(s,o(0,e),o(0,e+1));let c=(e,i,a)=>{let o=t.length/3;t.push(e[0],e[1],0,i[0],i[1],0,a[0],a[1],0),n.push(-1,0,-1,0,-1,0),r.push(o,o+1,o+2)},l=e.tail;c(l[0],l[1],l[2]),c(l[0],l[2],l[4]),c(l[4],l[2],l[3]);let u=t=>M(e,N(t)),d=t=>-M(e,N(t))*e.belly;for(let t of[e.dorsal,e.dorsal2])t&&c([t[0],u(t[0])*.9],[t[1],u(t[1])*.9],[t[2],u(t[2])+t[3]]);if(e.anal){let t=e.anal;c([t[1],d(t[1])*.9],[t[0],d(t[0])*.9],[t[2],d(t[2])-t[3]])}let f=new h;return f.setAttribute(`position`,new y(t,3)),f.setAttribute(`uv`,new y(n,2)),f.setIndex(r),f.computeVertexNormals(),f}var P=`
attribute vec2 aSwim;              // x: tail-beat phase (rad), y: amplitude (body lengths)
uniform float uK, uBend;
varying vec3 vLoc; varying vec2 vFish;
`,ie=`#include <beginnormal_vertex>
float fS = clamp(.5 - position.x, 0., 1.25);
float fW = pow(fS, uBend);
float fArg = position.x * uK - aSwim.x;
objectNormal = normalize(vec3(objectNormal.x - cos(fArg) * uK * aSwim.y * fW * objectNormal.z, objectNormal.y, objectNormal.z));
`,F=`#include <begin_vertex>
vLoc = position; vFish = uv;
transformed.z += sin(fArg) * aSwim.y * fW;
`,ae={sardine:`
  float tb = smoothstep(.12, .55, yN);
  c = mix(vec3(.78, .81, .84), vec3(.02, .055, .09), tb);
  c += vec3(.03, .1, .09) * exp(-pow((yN - .16) / .08, 2.));                       // blue-green sheen on the lateral line
  float bel = 1. - smoothstep(-.85, -.3, yN);
  c = mix(c, vec3(.9, .91, .92), bel);
  float cell = fract((vLoc.x + .1) * 16.) - .5;
  float spot = (1. - smoothstep(.3, .5, length(vec2(cell, (yN - .36) * 3.)))) * step(-.14, vLoc.x) * step(vLoc.x, .3);
  c *= 1. - .55 * spot;
  float opx = vLoc.x - (.335 + .035 * yN * yN);
  c *= 1. - .3 * exp(-opx * opx / .00005) * step(-.6, yN) * step(yN, .5);           // gill cover
  float er = length(vec2(vLoc.x - .41, vLoc.y - .012));
  float eye = 1. - smoothstep(.012, .016, er), ring = (1. - smoothstep(.02, .024, er)) - eye;
  c = mix(c, vec3(.01), eye); c = mix(c, vec3(.85, .8, .6), ring * .6);
  fMetal = mix(mix(.95, .45, tb), .65, bel) * (1. - .6 * eye);
  fRough = mix(.2, .42, tb);
  if (fFin > .5) { c = vec3(.32, .37, .42); fMetal = .25; fRough = .5; }`,tuna:`
  float tb = smoothstep(.0, .45, yN);
  c = mix(vec3(.5, .55, .6), vec3(.012, .03, .06), tb);
  float bel = 1. - smoothstep(-.8, -.25, yN);
  c = mix(c, vec3(.78, .8, .82), bel);
  c *= 1. - .16 * smoothstep(.3, .9, sin(vLoc.x * 70.)) * (1. - tb) * step(-.3, yN);   // faint flank bars
  float er = length(vec2(vLoc.x - .4, vLoc.y - .01));
  float eye = 1. - smoothstep(.012, .018, er);
  c = mix(c, vec3(.01), eye);
  fMetal = mix(.85, .35, tb); fRough = mix(.28, .45, tb);
  if (fFin > .5) { c = vec3(.04, .06, .09); fMetal = .3; fRough = .5; }`,lantern:`
  float tb = smoothstep(.1, .6, yN);
  c = mix(vec3(.09, .095, .11), vec3(.012, .012, .016), tb);
  c = mix(c, vec3(.03, .03, .035), 1. - smoothstep(-.9, -.4, yN));
  float er = length(vec2(vLoc.x - .39, vLoc.y - .015));
  float eye = 1. - smoothstep(.034, .04, er), pupil = 1. - smoothstep(.02, .026, er);
  c = mix(c, vec3(.25, .3, .32), eye); c = mix(c, vec3(.005), pupil);
  fMetal = mix(.75, .3, tb); fRough = mix(.32, .5, tb);
  if (fFin > .5) { c = vec3(.03); fMetal = .1; fRough = .6; }`};function oe(e){let t=ne[e],n=new a({color:16777215,metalness:.9,roughness:.3,side:2}),r={uVis:{value:1},uFogK:{value:1},uGlint:{value:0},uK:{value:t.K},uBend:{value:t.bend}},i=e!==`lantern`;return n.onBeforeCompile=t=>{Object.assign(t.uniforms,r),t.vertexShader=t.vertexShader.replace(`#include <common>`,`#include <common>
`+P).replace(`#include <beginnormal_vertex>`,ie).replace(`#include <begin_vertex>`,F),t.fragmentShader=t.fragmentShader.replace(`#include <common>`,`#include <common>
`+O+`uniform float uGlint;
varying vec3 vLoc; varying vec2 vFish;
`).replace(`#include <color_fragment>`,`#include <color_fragment>
        float fMetal = metalness, fRough = roughness;
        float fFin = step(vFish.x, -.5);
        #ifdef USE_MAP
          fFin = 0.; fMetal = .55; fRough = .36;               // a textured model: its own colours, the flank still flashes
        #else
        {
          float yN = vFish.y; vec3 c = vec3(1.);
          ${ae[e]}
          diffuseColor.rgb = c;
        }
        #endif`).replace(`#include <roughnessmap_fragment>`,`#include <roughnessmap_fragment>
roughnessFactor = fRough;`).replace(`#include <metalnessmap_fragment>`,`#include <metalnessmap_fragment>
metalnessFactor = fMetal;`).replace(`#include <emissivemap_fragment>`,i?`#include <emissivemap_fragment>
        {   // the sardine flash: the flank mirrors the bright surface when the fish rolls
          vec3 upV = normalize((viewMatrix * vec4(0., 1., 0., 0.)).xyz);
          vec3 rv = reflect(-normalize(vViewPosition), normal);
          float fGl = pow(max(dot(rv, upV), 0.), 9.);
          totalEmissiveRadiance += vec3(.72, .9, 1.) * fGl * uGlint * fMetal * (1. - fFin);
        }`:`#include <emissivemap_fragment>`).replace(`#include <fog_fragment>`,k)},n.customProgramCacheKey=()=>`abysse-fish-`+e,{mat:n,u:r}}function se(e,t){let n=re(ne[e]),r=new d(new Float32Array(t*2),2);r.setUsage(p),n.setAttribute(`aSwim`,r);let{mat:i,u:a}=oe(e),o=new s(n,i,t);return o.instanceMatrix.setUsage(p),o.frustumCulled=!1,o.visible=!1,o.castShadow=o.receiveShadow=!1,{mesh:o,u:a,swim:r.array,attr:r,M:o.instanceMatrix.array}}var I=new Float32Array(9);function ce(e,t,n,r,i,a,o,s,c,l){let u=-s,d=a,f=Math.hypot(u,d);f<1e-5?(u=0,d=1):(u/=f,d/=f);let p=-d*o,m=d*a-u*s,h=u*o,g=Math.cos(c),_=Math.sin(c),v=p*g+u*_,y=m*g,b=h*g+d*_,x=u*g-p*_,S=-m*_,C=d*g-h*_;I[0]=a,I[1]=o,I[2]=s,I[3]=v,I[4]=y,I[5]=b,I[6]=x,I[7]=S,I[8]=C,e[t]=a*l,e[t+1]=o*l,e[t+2]=s*l,e[t+3]=0,e[t+4]=v*l,e[t+5]=y*l,e[t+6]=b*l,e[t+7]=0,e[t+8]=x*l,e[t+9]=S*l,e[t+10]=C*l,e[t+11]=0,e[t+12]=n,e[t+13]=r,e[t+14]=i,e[t+15]=1}function le(e,t){e.metalness=0,e.roughness=.6,e.side=2,e.onBeforeCompile=e=>{Object.assign(e.uniforms,t),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
uniform float uFlap, uFlapA;`).replace(`#include <beginnormal_vertex>`,`#include <beginnormal_vertex>
        float mA = clamp(abs(position.z) / .5, 0., 1.);
        float mArg = uFlap - mA * 1.7 - position.x * 2.25;
        float mW = pow(mA, 1.5);
        float mSg = position.z < 0. ? -1. : 1.;
        float mFy = uFlapA * sin(mArg) * mW;
        float mDz = uFlapA * (cos(mArg) * (-1.7 / .5) * mW + sin(mArg) * 1.5 * sqrt(mA) / .5) * mSg;
        float mDx = uFlapA * cos(mArg) * (-2.25) * mW;
        objectNormal = normalize(objectNormal + vec3(-mDx, 0., -mDz) * (objectNormal.y < 0. ? -1. : 1.));`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
        transformed.y += mFy;
        transformed.z -= mSg * abs(mFy) * .22 * mA;
        float mT = 1. - smoothstep(-.9, -.3, position.x);                     // the tail lags the wave
        transformed.z += mT * mT * .05 * sin(uFlap * .5 + position.x * 5.);`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
`+O).replace(`#include <fog_fragment>`,k)},e.customProgramCacheKey=()=>`abysse-ray`}var ue=`
attribute float aI;        // intensity (0 = hidden)
attribute vec4 aS;         // size (mm), owner seed, index along the row, unused
uniform float uTime, uHalfH;
varying vec3 vC; varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  float d = max(-mv.z, 1.);
  float px = aS.x * projectionMatrix[1][1] * uHalfH / d;
  float a = aI;
  float fs = aS.y;
  float breath = .35 + .65 * pow(.5 + .5 * sin(uTime * (.5 + fs * .8) + fs * 50.), 4.);
  float ripple = pow(max(0., sin(uTime * 2.6 - aS.z * .8 + fs * 20.)), 10.) * step(.72, fract(uTime * .07 + fs * 3.));
  a *= breath + ripple * 1.2;
  vC = vec3(.22, .5, 1.) * 2.4;
  if (px < 2.) { a *= px * px * .25; px = 2.; }
  vA = a;
  gl_PointSize = aI > .0005 ? px : 0.;
  gl_Position = aI > .0005 ? projectionMatrix * mv : vec4(2., 2., 2., 1.);
}`,de=`
varying vec3 vC; varying float vA;
void main(){
  vec2 q = gl_PointCoord - .5; float r2 = dot(q, q) * 4.;
  float g = (exp(-r2 * 9.) + .25 * exp(-r2 * 3.)) * (1. - smoothstep(.7, 1., r2));
  gl_FragColor = vec4(vC * g * vA, 1.);
}`,fe=`
attribute vec4 aK;         // size (mm), seed, hop rate (Hz), tint
uniform float uTime, uHalfH, uBox, uRise, uI, uAmb, uLume;
uniform vec3 uCenter;
varying vec3 vC; varying float vA;
void main(){
  float s = aK.y;
  vec3 hd = normalize(vec3(sin(s * 91.), sin(s * 57.) * .6, cos(s * 91.)));
  float hp = uTime * aK.z + s * 17.;
  float hops = floor(hp) + smoothstep(0., .3, fract(hp));
  vec3 p = position + hd * hops * 14. + vec3(sin(uTime * .13 + s * 40.) * 30., uRise + sin(uTime * .2 + s * 30.) * 15., cos(uTime * .11 + s * 25.) * 30.);
  p = mod(p - uCenter, uBox) - uBox * .5 + uCenter;
  vec3 rel = p - uCenter;
  float edge = max(max(abs(rel.x), abs(rel.y)), abs(rel.z)) / (uBox * .5);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  float d = max(-mv.z, 1.);
  float px = aK.x * projectionMatrix[1][1] * uHalfH / d;
  float a = (1. - smoothstep(.75, 1., edge)) * smoothstep(60., 220., d);
  float glint = pow(.5 + .5 * sin(uTime * (1.5 + s * 2.5) + s * 70.), 14.);
  float lr = length(p);
  float lume = uLume / (1. + lr * lr / 8100.);
  vec3 tint = mix(vec3(.5, .68, .75), vec3(.85, .62, .5), step(.78, aK.w));
  vC = tint * uAmb * (.35 + 1.4 * glint) + vec3(.39, 1., .89) * lume * 1.2;
  if (px < 1.5) { a *= px * px / 2.25; px = 1.5; }
  vA = a * uI;
  gl_PointSize = px;
  gl_Position = projectionMatrix * mv;
}`,pe=`
varying vec3 vC; varying float vA;
void main(){
  float r = length(gl_PointCoord - .5) * 2.;
  float g = 1. - smoothstep(.15, 1., r);
  gl_FragColor = vec4(vC * g * g * vA, 1.);
}`,me=`
attribute vec4 aB;         // birth time, life (s), size (mm), seed
attribute vec3 aV;         // initial drift (mm/s), dragged by the cursor
uniform float uTime, uHalfH, uI;
varying vec3 vC; varying float vA;
void main(){
  float age = uTime - aB.x, life = aB.y, s = aB.w;
  if (age < 0. || age > life) { vA = 0.; vC = vec3(0.); gl_PointSize = 0.; gl_Position = vec4(2., 2., 2., 1.); return; }
  float u = age / life;
  vec3 p = position + aV * (1. - exp(-age * 2.5)) / 2.5
         + vec3(sin(s * 61. + age * 1.3), .5 + .5 * cos(s * 37.), cos(s * 83. + age * 1.1)) * age * 8.;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  float d = max(-mv.z, 1.);
  float px = aB.z * projectionMatrix[1][1] * uHalfH / d;
  float I = smoothstep(0., .04, age) * (.6 * exp(-age * 7.) + .4) * (1. - smoothstep(.35, 1., u));
  I *= .8 + .2 * sin(age * 30. + s * 40.);
  vC = mix(vec3(.7, 1., 1.), vec3(.08, .55, 1.), smoothstep(0., .45, age)) * 2.6;
  if (px < 1.5) { I *= px * px / 2.25; px = 1.5; }
  vA = I * uI;
  gl_PointSize = px;
  gl_Position = projectionMatrix * mv;
}`;function he(){let e=new g;e.name=`creatures`;let i=se(`sardine`,460);e.add(i.mesh);let a=se(`tuna`,5);e.add(a.mesh),new v().load(`./assets/fish/tuna.glb`,e=>{let t=null;if(e.scene.traverse(e=>{!t&&e.isMesh&&(t=e)}),!t)return;let n=t.geometry;n.setAttribute(`aSwim`,a.attr),n.attributes.normal||n.computeVertexNormals();let r=a.mesh.material,i=t.material;i.map&&(r.map=i.map,r.aoMap=i.aoMap||null,r.needsUpdate=!0);let o=a.mesh.geometry;a.mesh.geometry=n,o.dispose()},void 0,()=>{});let o={u:{uVis:{value:1},uFogK:{value:1.5},uFlap:{value:0},uFlapA:{value:.05}}},s=new g;s.name=`stingray`,s.matrixAutoUpdate=!1,s.visible=!1,e.add(s),new v().load(`./assets/fish/stingray.glb`,e=>{e.scene.updateMatrixWorld(!0);let t=[];e.scene.traverse(e=>{e.isMesh&&t.push(e)});let n=new f;for(let e of t)e.geometry.applyMatrix4(e.matrixWorld),e.geometry.rotateY(Math.PI/2),e.geometry.computeBoundingBox(),n.union(e.geometry.boundingBox);let r=n.max.z-n.min.z,i=n.max.x-.42*r,a=(n.min.y+n.max.y)/2,c=(n.min.z+n.max.z)/2;for(let e of t){e.geometry.translate(-i,-a,-c),e.geometry.scale(1/r,1/r,1/r);let t=new l(e.geometry,e.material);t.frustumCulled=!1,le(t.material,o.u),s.add(t)}},void 0,()=>{});let d=se(`lantern`,110);e.add(d.mesh);let y=[];{let e=ne.lantern;for(let t of[1,-1]){for(let n=0;n<6;n++){let r=-.28+n*.12,i=M(e,N(r)),a=i*e.W;y.push([r,-i*.866*1.08,t*a*.5*1.08,n])}let n=.38,r=M(e,N(n)),i=r*e.W;y.push([n,-r*.2,t*i*.95*1.1,6])}}let S=1540,O=new h,k=new Float32Array(S*3),A=new Float32Array(S),ee=new Float32Array(S*4);for(let e=0;e<110;e++){let t=C();for(let n=0;n<14;n++){let r=e*14+n;ee.set([w(1.3,2.1),t,y[n][3],0],r*4)}}let j=new c(k,3).setUsage(p),re=new c(A,1).setUsage(p);O.setAttribute(`position`,j),O.setAttribute(`aI`,re),O.setAttribute(`aS`,new c(ee,4));let P=te(O,{uTime:{value:0}},ue,de);e.add(P);let ie=1400,F=2400,ae=new h,oe=new Float32Array(ie*3),he=new Float32Array(ie*4);for(let e=0;e<ie;e++)oe.set([w(0,F),w(0,F),w(0,F)],e*3),he.set([w(.7,2),C(),w(.15,.6),C()],e*4);ae.setAttribute(`position`,new c(oe,3)),ae.setAttribute(`aK`,new c(he,4));let ge=te(ae,{uTime:{value:0},uBox:{value:F},uRise:{value:0},uI:{value:0},uAmb:{value:0},uLume:{value:0},uCenter:{value:new n}},fe,pe);e.add(ge);let L={n:0,hold:[],mix:[],a:new Float32Array(7),len:new Float32Array(7),prm:new Float32Array(56),scare:0,pp:new Float32Array(21),h:new Float32Array(21),fresh:!0};for(let e=0;e<7;e++){let t=L.prm,n=e*8;t[n]=w(45,85),t[n+1]=w(.8,1.2),t[n+2]=(C()<.35?-1:1)*w(.45,.75),t[n+3]=w(-25,25),t[n+4]=w(-120,-50),t[n+5]=w(28,58),t[n+6]=w(4,10),t[n+7]=w(.15,.35),L.a[e]=w(0,x),L.len[e]=w(30,42)}let _e=new g;_e.name=`guppies`,_e.visible=!1,e.add(_e),new v().load(`./assets/fish/guppy.glb`,e=>{let n=e.animations[0],r=new f().setFromObject(e.scene),i=r.getCenter(D()),a=Math.max(r.max.z-r.min.z,.001),o=null;e.scene.traverse(e=>{e.isMesh&&!o&&(o=e.material)});let s=e=>{let n=new b({map:o?.map??null,side:2,transparent:!!o?.transparent,alphaTest:o?.alphaTest??0,roughness:.42,metalness:0,specularIntensity:.7,iridescence:.3,iridescenceIOR:1.35,iridescenceThicknessRange:[260,480],sheen:.3,sheenRoughness:.4,sheenColor:new u(.62,.66,.66)}),r=Math.cos(e),i=Math.sin(e);return n.onBeforeCompile=e=>{e.uniforms.uGupHue={value:new t(r,i)},e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
uniform vec2 uGupHue;`).replace(`#include <map_fragment>`,`#include <map_fragment>
          { vec3 c = diffuseColor.rgb, k = vec3(.57735);
            c = c * uGupHue.x + cross(k, c) * uGupHue.y + k * dot(k, c) * (1. - uGupHue.x);
            float l = dot(c, vec3(.2126, .7152, .0722));
            diffuseColor.rgb = clamp(mix(vec3(l), c, 1.75), 0., 1.) * .8; }`)},n.customProgramCacheKey=()=>`guppy-skin`,n},c=[s(0),s(2.75)];o?.dispose();for(let t=0;t<7;t++){let r=new g;r.matrixAutoUpdate=!1;let o=new g;o.rotation.y=-Math.PI/2,o.scale.setScalar(1/a);let s=m(e.scene);s.position.copy(i).negate(),s.traverse(e=>{e.isMesh&&(e.frustumCulled=!1,e.material=c[+(t%3==2)])}),o.add(s),r.add(o),_e.add(r);let l=null;if(n){l=new _(s);let e=l.clipAction(n);e.time=C()*n.duration,e.timeScale=w(.8,1.2),e.play()}L.hold.push(r),L.mix.push(l)}L.n=7},void 0,()=>{});let ve=new h,R=new Float32Array(1800),z=new Float32Array(2400),ye=new Float32Array(1800);for(let e=0;e<600;e++)z[e*4]=-1e4;let be=new c(R,3).setUsage(p),xe=new c(z,4).setUsage(p),B=new c(ye,3).setUsage(p);ve.setAttribute(`position`,be),ve.setAttribute(`aB`,xe),ve.setAttribute(`aV`,B);let V=te(ve,{uTime:{value:0},uI:{value:1}},me,pe);e.add(V),V.renderOrder=7;let H={pos:D(),right:D(),up:D(),fwd:D(),tanH:.3,aspect:1.7},U=D(),W=D(),Se=D();function Ce(e){let t=e.matrixWorld.elements;H.right.set(t[0],t[1],t[2]).normalize(),H.up.set(t[4],t[5],t[6]).normalize(),H.fwd.set(-t[8],-t[9],-t[10]).normalize(),H.pos.set(t[12],t[13],t[14]),H.tanH=Math.tan((e.fov||30)*Math.PI/360)/(e.zoom||1),H.aspect=e.aspect||1.7}function we(e,t){Se.subVectors(e,H.pos);let n=Se.dot(H.fwd);if(n<10)return!1;let r=Se.dot(H.right)/(n*H.tanH*H.aspect),i=Se.dot(H.up)/(n*H.tanH);return Math.abs(r)<t&&Math.abs(i)<t}let Te=e=>({o:e,a:D(),b:D(),bulge:D(),dir:D(),s:0,dur:1,state:0,wait:e.delay,side:e.side0,L:D(),LV:D(),Lp:D(),jump:!0,first:!0});function Ee(e){let t=e.o,n=t.near&&C()<t.near[2]?w(t.near[0],t.near[1]):w(t.dMin,t.dMax),r=n*H.tanH,i=r*H.aspect+t.margin;e.side=-e.side;let a=(w(-.45,.45)+t.yBias)*r,o=a+w(-.3,.3)*r;e.a.copy(H.pos).addScaledVector(H.fwd,n).addScaledVector(H.right,-e.side*i).addScaledVector(H.up,a),e.b.copy(H.pos).addScaledVector(H.fwd,n*w(.82,1.18)).addScaledVector(H.right,e.side*i).addScaledVector(H.up,o),e.bulge.copy(H.fwd).multiplyScalar(w(-.28,.22)*n).addScaledVector(H.up,w(-.12,.12)*r),e.dir.subVectors(e.b,e.a).normalize(),e.dur=e.a.distanceTo(e.b)/t.speed,e.s=e.first&&t.firstS||0,e.first=!1,e.state=1,e.jump=!0}function De(e,t,n){if(e.Lp.copy(e.L),e.state===1){e.s+=n/e.dur;let r=Math.min(e.s,1);e.L.lerpVectors(e.a,e.b,r).addScaledVector(e.bulge,Math.sin(Math.PI*r)),e.L.y+=Math.sin(t*.37+e.o.seed)*e.o.bob,e.s>=1&&(e.state=2,e.wait=w(e.o.wMin,e.o.wMax))}else e.L.addScaledVector(e.dir,e.o.speed*n),e.wait-=n;e.jump?(e.LV.copy(e.dir).multiplyScalar(e.o.speed),e.jump=!1):n>1e-5&&e.LV.subVectors(e.L,e.Lp).divideScalar(n)}function Oe(e,t,n){let r={off:e,n:t,o:n,p:new Float32Array(t*3),v:new Float32Array(t*3),h:new Float32Array(t*3),fear:new Float32Array(t),roll:new Float32Array(t),ph:new Float32Array(t),sz:new Float32Array(t),sd:new Float32Array(t),rt:Te(n),c:D(),threat:D(),threatT:-99,placed:!1};for(let e=0;e<t;e++)r.sz[e]=w(.82,1.18),r.sd[e]=C(),r.ph[e]=w(0,x),r.h[e*3]=1;return r}let ke=[Oe(0,260,{v0:470,len:112,amp:.07,speed:520,dMin:650,dMax:2100,near:[450,650,.25],margin:850,yBias:0,bob:70,wMin:2,wMax:6,delay:0,side0:1,seed:1.3}),Oe(260,200,{v0:500,len:102,amp:.07,speed:560,dMin:1500,dMax:3800,margin:900,yBias:.12,bob:90,wMin:3,wMax:8,delay:3.5,side0:-1,seed:4.1})],Ae=1/90,je=new Int32Array(4096),Me=new Int32Array(512),Ne=new Int32Array(512),Pe=new Int32Array(512),Fe=new Int32Array(512),Ie=(e,t,n)=>(Math.imul(e,73856093)^Math.imul(t,19349663)^Math.imul(n,83492791))&4095,Le=new Int32Array(5);function Re(e){let t=e.rt,n=e.p,r=e.v,i=e.o;if(!e.placed){for(let a=0;a<e.n;a++){let o=C(),s=Math.cbrt(C()),c=C()*x,l=Math.acos(2*o-1);n[a*3]=t.a.x+Math.sin(l)*Math.cos(c)*420*s,n[a*3+1]=t.a.y+Math.cos(l)*150*s,n[a*3+2]=t.a.z+Math.sin(l)*Math.sin(c)*260*s,r[a*3]=t.dir.x*i.v0,r[a*3+1]=0,r[a*3+2]=t.dir.z*i.v0,e.h[a*3]=t.dir.x,e.h[a*3+1]=0,e.h[a*3+2]=t.dir.z}e.c.copy(t.a),e.placed=!0}else if(we(e.c,1.25))t.a.copy(e.c),t.dir.subVectors(t.b,t.a).normalize(),t.dur=t.a.distanceTo(t.b)/i.speed,t.s=0;else{let r=t.a.x-e.c.x,i=t.a.y-e.c.y,a=t.a.z-e.c.z;for(let t=0;t<e.n;t++)n[t*3]+=r,n[t*3+1]+=i,n[t*3+2]+=a;e.c.copy(t.a)}t.L.copy(t.a),t.Lp.copy(t.a),t.jump=!0}function ze(e,t,n,r,a){let{n:o,p:s,v:c,h:l,fear:u,roll:d,ph:f,sz:p,sd:m,o:h,rt:g}=e;je.fill(-1);let _=0,v=0,y=0;for(let e=0;e<o;e++){let t=e*3,n=Math.floor(s[t]*Ae),r=Math.floor(s[t+1]*Ae),i=Math.floor(s[t+2]*Ae);Ne[e]=n,Pe[e]=r,Fe[e]=i;let a=Ie(n,r,i);Me[e]=je[a],je[a]=e,_+=s[t],v+=s[t+1],y+=s[t+2]}e.c.set(_/o,v/o,y/o),r&&(r.closestPointToPoint(e.c,U),U.distanceToSquared(e.c)<562500&&(e.threat.copy(U),e.threatT=t));let b=t-e.threatT<1.6,S=0;for(let t=0;t<5;t++){let n=t*3,r=G.p[n]-e.c.x,i=G.p[n+1]-e.c.y,a=G.p[n+2]-e.c.z;r*r+i*i+a*a<225e4&&(Le[S++]=t)}let C=Math.exp(-n/.9),w=.88**(n*60),D=g.LV.x,O=g.LV.y,k=g.LV.z,A=Math.hypot(D,O,k)||1,ee=D/A,te=O/A,j=k/A,ne=g.L.x,M=g.L.y,N=g.L.z,re=H.pos.x,P=H.pos.y,ie=H.pos.z,F=r?r.origin.x:0,ae=r?r.origin.y:0,oe=r?r.origin.z:0,se=r?r.direction.x:0,I=r?r.direction.y:0,le=r?r.direction.z:0,ue=i.M,de=i.swim,fe=e.off;for(let i=0;i<o;i++){let o=i*3,g=s[o],_=s[o+1],v=s[o+2],y=c[o],A=c[o+1],pe=c[o+2],me=0,he=0,ge=0,L=0,_e=0,ve=0,R=0,z=0,ye=Ne[i],be=Pe[i],xe=Fe[i];for(let e=-1;e<=1;e++)for(let t=-1;t<=1;t++)for(let n=-1;n<=1;n++)for(let r=je[Ie(ye+e,be+t,xe+n)];r!==-1;r=Me[r]){if(r===i)continue;let e=r*3,t=s[e]-g,n=s[e+1]-_,a=s[e+2]-v,o=t*t+n*n+a*a;if(!(o>8100)&&(L+=c[e],_e+=c[e+1],ve+=c[e+2],R++,u[r]>z&&(z=u[r]),o<4624)){let e=Math.sqrt(o)+.001,r=(1-e/68)/e;me-=t*r,he-=n*r,ge-=a*r}}let B=Math.max(u[i]*C,z*w*.92),V=me*2600,H=he*2600,U=ge*2600;R&&(V+=(L/R-y)*1.6,H+=(_e/R-A)*1.6,U+=(ve/R-pe)*1.6);let W=ne-g,Se=M-_,Ce=N-v,we=W*ee+Se*te+Ce*j,Te=.9*(1-.85*B);V+=(W-ee*we*.6)*Te,H+=(Se-te*we*.6)*Te*1.5,U+=(Ce-j*we*.6)*Te,V+=(D-y)*.7,H+=(O-A)*.7,U+=(k-pe)*.7;let Ee=m[i]*40;V+=Math.sin(t*1.1+Ee)*90,H+=Math.sin(t*.9+Ee*1.3)*40,U+=Math.cos(t*1.3+Ee*.7)*90;let De=g*g+_*_+v*v;if(De<78400){let e=Math.sqrt(De)+.001,t=Math.min((280-e)/160,1),n=5200*t*t/e;V+=g*n,H+=_*n,U+=v*n}let Oe=g-re,ke=_-P,Ae=v-ie;if(De=Oe*Oe+ke*ke+Ae*Ae,De<144400){let e=Math.sqrt(De)+.001,t=Math.min((380-e)/200,1),n=6e3*t*t/e;V+=Oe*n,H+=ke*n,U+=Ae*n}if(r){let e=(g-F)*se+(_-ae)*I+(v-oe)*le;if(e>50){let t=g-(F+se*e),n=_-(ae+I*e),r=v-(oe+le*e),i=t*t+n*n+r*r,a=110+e*.09;if(i<a*a){let e=Math.sqrt(i)+.001,o=1-e/a,s=9e3*o/e;V+=t*s,H+=n*s*.6,U+=r*s,.6+.4*o>B&&(B=.6+.4*o)}}}if(b&&B>.05){let t=g-e.threat.x,n=_-e.threat.y,r=v-e.threat.z,i=Math.hypot(t,n,r)+.001,a=2200*B/i;V+=t*a,H+=n*a*.5,U+=r*a}for(let e=0;e<S;e++){let t=Le[e]*3,n=g-G.p[t],r=_-G.p[t+1],i=v-G.p[t+2],a=n*n+r*r+i*i;if(a<230400){let e=Math.sqrt(a)+.001,t=1-e/480,o=7e3*t/e;V+=n*o,H+=r*o,U+=i*o,.5+.5*t>B&&(B=.5+.5*t)}}u[i]=B;let Re=y+V*n,ze=(A+H*n)*(1-Math.min(1,n*.9)),Be=pe+U*n,K=Math.hypot(Re,ze,Be),q=h.v0*p[i]*(1.2+2.3*B),J=h.v0*.5;if(K<.001)Re=ee*J,ze=0,Be=j*J,K=J;else if(K>q){let e=q/K;Re*=e,ze*=e,Be*=e,K=q}else if(K<J){let e=J/K;Re*=e,ze*=e,Be*=e,K=J}let Y=g+Re*n,X=_+ze*n,Z=v+Be*n;if(De=Y*Y+X*X+Z*Z,De<15625){let e=125/(Math.sqrt(De)+.001);Y*=e,X*=e,Z*=e}s[o]=Y,s[o+1]=X,s[o+2]=Z,c[o]=Re,c[o+1]=ze,c[o+2]=Be;let Ve=l[o],He=l[o+2],Ue=Math.min(1,n*8),We=Ve+(Re/K-Ve)*Ue,Q=l[o+1]+(ze/K-l[o+1])*Ue,$=He+(Be/K-He)*Ue;Q=T(Q,-.55,.55);let Ge=Math.hypot(We,Q,$)||1;We/=Ge,Q/=Ge,$/=Ge,l[o]=We,l[o+1]=Q,l[o+2]=$;let Ke=n>1e-5?(He*We-Ve*$)/n:0,qe=.24*Math.sin(t*(1.3+m[i]*1.7)+Ee)*(.6+B);d[i]+=(T(-Ke*.3,-.9,.9)+qe-d[i])*Math.min(1,n*5);let Je=h.len*p[i],Ye=B>.3?1:.55+.45*E(-.3,.3,Math.sin(t*.8+Ee));f[i]=(f[i]+x*T(K/(.75*Je),2.5,13)*n*(.6+.4*Ye))%x;let Xe=fe+i;de[Xe*2]=f[i],de[Xe*2+1]=(h.amp+.045*B)*(.5+.5*Ye),ce(ue,Xe*16,Y,X,Z,We,Q,$,d[i],Je*a)}}let G={p:new Float32Array(15),v:new Float32Array(15),h:new Float32Array(15),roll:new Float32Array(5),ph:new Float32Array(5),len:new Float32Array(5),off:new Float32Array(15),sd:new Float32Array(5),placed:!1,rt:Te({speed:900,dMin:2200,dMax:5200,margin:2200,yBias:-.1,bob:120,wMin:7,wMax:15,delay:4,side0:-1,seed:2.2,firstS:.05})};for(let e=0;e<5;e++)G.len[e]=w(400,700),G.sd[e]=C(),G.ph[e]=w(0,x),G.h[e*3]=1,G.off.set([-e*520+w(-150,150),w(-260,260),w(-650,650)],e*3),G.p.set([1e6,1e6,1e6],e*3);function Be(){let e=G.rt,t=e.dir.x,n=e.dir.z,r=Math.hypot(t,n)||1;for(let i=0;i<5;i++){let a=i*3,o=G.off[a],s=G.off[a+1],c=G.off[a+2];G.placed&&we(U.set(G.p[a],G.p[a+1],G.p[a+2]),1.2)||(G.p[a]=e.a.x+(t*o-n*c)/r,G.p[a+1]=e.a.y+s,G.p[a+2]=e.a.z+(n*o+t*c)/r,G.v[a]=e.dir.x*e.o.speed,G.v[a+1]=0,G.v[a+2]=e.dir.z*e.o.speed,G.h[a]=t/r,G.h[a+1]=0,G.h[a+2]=n/r)}G.placed=!0,e.L.copy(e.a),e.Lp.copy(e.a)}function K(e,t,n){let r=G.rt,i=Math.hypot(r.LV.x,r.LV.z)||1,o=r.LV.x/i,s=r.LV.z/i;for(let i=0;i<5;i++){let c=i*3,l=G.off[c],u=G.off[c+1],d=G.off[c+2],f=G.sd[i]*30,p=r.L.x+o*l-s*d+Math.sin(e*.23+f)*200,m=r.L.y+u+Math.sin(e*.31+f)*90,h=r.L.z+s*l+o*d+Math.cos(e*.19+f)*200,g=G.v[c],_=G.v[c+1],v=G.v[c+2];g+=((p-G.p[c])*1.3-(g-r.LV.x)*1.8)*t,_+=((m-G.p[c+1])*1.3-(_-r.LV.y)*1.8)*t,v+=((h-G.p[c+2])*1.3-(v-r.LV.z)*1.8)*t;let y=Math.hypot(g,_,v);y>2200&&(g*=2200/y,_*=2200/y,v*=2200/y,y=2200),G.v[c]=g,G.v[c+1]=_,G.v[c+2]=v,G.p[c]+=g*t,G.p[c+1]+=_*t,G.p[c+2]+=v*t;let b=y||1,S=G.h[c],C=G.h[c+2],w=Math.min(1,t*2.5),E=S+(g/b-S)*w,D=G.h[c+1]+(_/b-G.h[c+1])*w,O=C+(v/b-C)*w;D=T(D,-.35,.35);let k=Math.hypot(E,D,O)||1;E/=k,D/=k,O/=k,G.h[c]=E,G.h[c+1]=D,G.h[c+2]=O;let A=t>1e-5?(C*E-S*O)/t:0;G.roll[i]+=(T(-A*.5,-.6,.6)+.06*Math.sin(e*.7+f)-G.roll[i])*Math.min(1,t*3),G.ph[i]=(G.ph[i]+x*T(y/(.8*G.len[i]),1.2,3.5)*t)%x,a.swim[i*2]=G.ph[i],a.swim[i*2+1]=.055,ce(a.M,i*16,G.p[c],G.p[c+1],G.p[c+2],E,D,O,G.roll[i],G.len[i]*n)}}let q={rt:Te({speed:620,dMin:3e3,dMax:5200,margin:800,yBias:.32,bob:60,wMin:6,wMax:14,delay:1.5,side0:1,seed:7.7,firstS:.12}),h:new n(1,0,0),roll:0,flap:0,placed:!1},J={p:new Float32Array(330),v:new Float32Array(330),h:new Float32Array(330),ph:new Float32Array(110),len:new Float32Array(110),sd:new Float32Array(110),dart:new Float32Array(110),fl:new Float32Array(110),placed:!1};for(let e=0;e<110;e++)J.len[e]=w(40,80),J.sd[e]=C(),J.ph[e]=w(0,x),J.h[e*3]=1;let Y=3e3,X=Y/2,Z=0,Ve=0,He=-99,Ue=!1,We=D(),Q=D(),$=D(),Ge={ray:new r,s:0,on:!1},Ke=[];for(let e=0;e<4;e++)Ke.push({ray:new r,point:D(),power:0});let qe=0;function Je(e,t){let n=t.x-e.origin.x,r=t.y-e.origin.y,i=t.z-e.origin.z,a=e.direction,o=Math.max(0,n*a.x+r*a.y+i*a.z);return Je.t=o,Math.hypot(n-a.x*o,r-a.y*o,i-a.z*o)}Je.t=0;function Ye(e,t,n,r){for(let i=0;i<n;i++){let n=Z,i=C()*2-1,a=C()*x,o=Math.sqrt(1-i*i),s=1.5+15*Math.cbrt(C())*C()**.35;U.set(o*Math.cos(a),i*.55,o*Math.sin(a)),R[n*3]=t.x+U.x*s,R[n*3+1]=t.y+U.y*s,R[n*3+2]=t.z+U.z*s;let c=w(4,16)*(.6+.4*r);ye[n*3]=U.x*c,ye[n*3+1]=U.y*c+w(-3,3),ye[n*3+2]=U.z*c,z[n*4]=e+s/55+C()*.06,z[n*4+1]=w(.8,2),z[n*4+2]=w(.18,.65),z[n*4+3]=C(),Z=(Z+1)%600}be.needsUpdate=xe.needsUpdate=B.needsUpdate=!0,He=Math.max(He,e+.4)}let Xe=null,Ze=0,Qe=[ke[0].rt,ke[1].rt,G.rt,q.rt];function $e(e,t,n){let r=n.camera;if(!r)return;Ce(r),t=T(t||0,0,.1);let c=n.pointerRay||null,l=T(n.epi||0,0,1),u=T(n.meso||0,0,1),f=T(n.abyss||0,0,1),p=T(n.light??1,0,1),m=n.depth||0;Xe===null&&(Xe=m);let h=T((m-Xe)*5,-40,40);Xe=m,Ze+=h;let g=l>.001;if(i.mesh.visible=a.mesh.visible=s.visible=g,g){let n=E(0,.85,l),r=Math.sqrt(E(0,.25,l));i.u.uVis.value=a.u.uVis.value=o.u.uVis.value=n,i.u.uGlint.value=1.4*p*n,a.u.uGlint.value=.9*p*n;for(let n=0;n<Qe.length;n++){let r=Qe[n];r.state!==1&&r.wait<=0&&(l>.3?(Ee(r),r===G.rt?Be():r===q.rt?(r.L.lerpVectors(r.a,r.b,r.s),r.Lp.copy(r.L),q.placed=!0):Re(r===ke[0].rt?ke[0]:ke[1])):r.wait=.5),r.state===0?r.wait-=t:De(r,e,t)}G.placed&&K(e,t,r),a.mesh.visible=G.placed;for(let n=0;n<ke.length;n++){let a=ke[n];for(let t=0;t<qe&&a.placed;t++){let n=Ke[t];if(!(n.point.distanceTo(a.c)>1400)){a.threat.copy(n.point),a.threatT=e;for(let e=0;e<a.n;e++){let t=e*3,r=Math.hypot(a.p[t]-n.point.x,a.p[t+1]-n.point.y,a.p[t+2]-n.point.z);r<520&&(a.fear[e]=Math.max(a.fear[e],n.power*(1-r/520)))}}}if(a.placed)ze(a,e,t,c,r);else for(let e=0;e<a.n;e++)ce(i.M,(a.off+e)*16,0,-1e6,0,1,0,0,0,0)}if(i.mesh.instanceMatrix.needsUpdate=!0,i.attr.needsUpdate=!0,a.mesh.instanceMatrix.needsUpdate=!0,a.attr.needsUpdate=!0,s.visible=q.placed,q.placed){let n=q.rt,i=n.LV.length()||1,a=q.h,c=a.x,l=a.z,u=Math.min(1,t*1.2);a.x+=(n.LV.x/i-a.x)*u,a.y+=(n.LV.y/i*.5-a.y)*u,a.z+=(n.LV.z/i-a.z)*u,a.normalize();let d=t>1e-5?(l*a.x-c*a.z)/t:0;q.roll+=(T(-d*1.2,-.35,.35)-q.roll)*Math.min(1,t*1.5);let f=.35+.65*E(-.2,.6,Math.sin(e*.13+1));q.flap+=t*x/2.4*(.45+.55*f),o.u.uFlap.value=q.flap,o.u.uFlapA.value=.055*f,ce(s.matrix.elements,0,n.L.x,n.L.y-Math.cos(q.flap)*10*f,n.L.z,a.x,a.y,a.z,q.roll,900*r),s.matrixWorldNeedsUpdate=!0}}let _=u>.001;d.mesh.visible=ge.visible=_;let v=_?u:0;if(_){let n=E(0,.85,u),r=Math.sqrt(E(0,.25,u));d.u.uVis.value=n,W.copy(H.pos).addScaledVector(H.fwd,1400);let i=J.p,a=J.v,o=J.h;if(!J.placed){for(let e=0;e<110;e++)i[e*3]=W.x+w(-1500,X),i[e*3+1]=W.y+w(-1500,X),i[e*3+2]=W.z+w(-1500,X);J.placed=!0}let s=c?c.origin.x:0,l=c?c.origin.y:0,f=c?c.origin.z:0,g=c?c.direction.x:0,_=c?c.direction.y:0,v=c?c.direction.z:0,b=ne.lantern;for(let u=0;u<110;u++){let p=u*3,m=J.sd[u]*x,S=i[p],D=i[p+1]+h*.7,O=i[p+2];S=W.x+((S-W.x+X)%Y+Y)%Y-X,D=W.y+((D-W.y+X)%Y+Y)%Y-X,O=W.z+((O-W.z+X)%Y+Y)%Y-X;let ee=m+.7*Math.sin(e*.05*(1+J.sd[u])+m*3)+.3*Math.sin(e*.13+m*5),te=.25*Math.sin(e*.07+m*2),j=Math.cos(te)*Math.cos(ee),ne=Math.sin(te),M=Math.cos(te)*Math.sin(ee);if(J.dart[u]>0?J.dart[u]-=t:C()<t/14&&(J.dart[u]=w(.25,.45)),J.fl[u]*=Math.exp(-t*1.8),Ge.on){U.set(S,D,O);let e=Je(Ge.ray,U),t=60+Je.t*.1;Je.t>40&&e<t*2&&(J.fl[u]=Math.max(J.fl[u],Ge.s*(1-E(t*.5,t*2,e))))}for(let e=0;e<qe;e++){let t=Ke[e],n=S-t.point.x,r=D-t.point.y,i=O-t.point.z,o=Math.hypot(n,r,i);if(o<650){let e=t.power*(1-o/650);J.fl[u]=Math.max(J.fl[u],e),J.dart[u]=Math.max(J.dart[u],.5*e),a[p]+=n/(o+.001)*380*e,a[p+1]+=r/(o+.001)*200*e,a[p+2]+=i/(o+.001)*380*e}}if(c){let e=(S-s)*g+(D-l)*_+(O-f)*v;if(e>40){let t=S-(s+g*e),n=D-(l+_*e),r=O-(f+v*e),i=Math.hypot(t,n,r);if(i<80+e*.08){J.dart[u]=Math.max(J.dart[u],.45);let e=1/(i+.001);j=t*e,ne=n*e*.5,M=r*e}}}let N=Math.hypot(S,D,O);N<230&&N>1&&(j+=S/N*2,ne+=D/N*2,M+=O/N*2);let re=Math.hypot(j,ne,M)||1,P=J.dart[u]>0,ie=P?420:35+30*J.sd[u],F=Math.min(1,t*(P?6:1.2));a[p]+=(j/re*ie-a[p])*F,a[p+1]+=(ne/re*ie-a[p+1])*F,a[p+2]+=(M/re*ie-a[p+2])*F,S+=a[p]*t,D+=a[p+1]*t,O+=a[p+2]*t,i[p]=S,i[p+1]=D,i[p+2]=O;let ae=Math.hypot(a[p],a[p+1],a[p+2]);if(ae>5){let e=Math.min(1,t*(P?8:2)),n=o[p]+(a[p]/ae-o[p])*e,r=o[p+1]+(a[p+1]/ae-o[p+1])*e,i=o[p+2]+(a[p+2]/ae-o[p+2])*e;r=T(r,-.5,.5);let s=Math.hypot(n,r,i)||1;o[p]=n/s,o[p+1]=r/s,o[p+2]=i/s}let oe=Math.max(Math.abs(S-W.x),Math.abs(D-W.y),Math.abs(O-W.z))/X,se=Math.hypot(S-H.pos.x,D-H.pos.y,O-H.pos.z);N=Math.hypot(S,D,O);let le=(1-E(.72,.97,oe))*E(160,320,se)*E(130,200,N),ue=P?.09:.03;J.ph[u]=(J.ph[u]+x*(P?9:2.2)*t)%x,d.swim[u*2]=J.ph[u],d.swim[u*2+1]=ue;let de=J.len[u]*le*r;ce(d.M,u*16,S,D,O,o[p],o[p+1],o[p+2],0,de);let fe=le*n*(1+2.6*J.fl[u]);for(let e=0;e<14;e++){let t=y[e],n=t[0],r=.5-n,i=t[2]+Math.sin(n*b.K-J.ph[u])*ue*r*r,a=u*14+e,o=a*3;k[o]=S+(I[0]*n+I[3]*t[1]+I[6]*i)*de,k[o+1]=D+(I[1]*n+I[4]*t[1]+I[7]*i)*de,k[o+2]=O+(I[2]*n+I[5]*t[1]+I[8]*i)*de,A[a]=fe}}d.mesh.instanceMatrix.needsUpdate=!0,d.attr.needsUpdate=!0;let S=ge.material.uniforms;S.uTime.value=e,S.uRise.value=Ze,S.uI.value=n,S.uCenter.value.copy(H.pos).addScaledVector(H.fwd,900),S.uAmb.value=p**.35*.55+.03,S.uLume.value=E(90,260,m)}else if(J.placed)for(let e=0;e<1540;e++)A[e]=0;let b=T(n.landed||0,0,1),S=n.floorY,D=f>.001&&b>.001&&S!==void 0&&L.n>0;if(_e.visible=D,D){for(let e=0;e<qe;e++)Ke[e].point.lengthSq()<36e4&&(L.scare=Math.max(L.scare,Ke[e].power));L.scare*=Math.exp(-t*1.2);let n=1+3*L.scare,r=Math.sqrt(E(0,.5,b))*E(0,.3,f),i=L.prm;for(let a=0;a<L.n;a++){let o=a*8,s=i[o+2],c=i[o+1],l=e*i[o+7]+a*2.1;L.a[a]+=s*n*t;let u=L.a[a],d=i[o]*(1+.15*Math.sin(e*.09+a*1.7)),f=a*3,p=i[o+3]+d*Math.cos(u),m=i[o+4]+d*c*Math.sin(u),h=Math.hypot(p,m),g=Math.sqrt(h*h+4225)/Math.max(h,.001);p*=g,m*=g;let _=S+i[o+5]+i[o+6]*Math.sin(l),v=p-L.pp[f],y=_-S-L.pp[f+1],b=m-L.pp[f+2],x=Math.hypot(v,y,b);if(L.fresh||x<1e-4)v=-Math.sin(u)*s,y=0,b=c*Math.cos(u)*s,x=Math.hypot(v,b)||1,L.h[f]=v/x,L.h[f+1]=0,L.h[f+2]=b/x;else{let e=Math.min(1,t*5);L.h[f]+=(v/x-L.h[f])*e,L.h[f+1]+=(y/x-L.h[f+1])*e,L.h[f+2]+=(b/x-L.h[f+2])*e}L.pp[f]=p,L.pp[f+1]=_-S,L.pp[f+2]=m;let C=L.h,w=Math.hypot(C[f],C[f+1],C[f+2])||1,T=E(100,170,Math.hypot(p-H.pos.x,_-H.pos.y,m-H.pos.z));ce(L.hold[a].matrix.elements,0,p,_,m,C[f]/w,C[f+1]/w,C[f+2]/w,s>0?.12:-.12,L.len[a]*r*T),L.hold[a].matrixWorldNeedsUpdate=!0,L.mix[a]&&L.mix[a].update(t*n)}L.fresh=!1}else L.fresh=!0;if(P.visible=v>0,P.visible&&(P.material.uniforms.uTime.value=e,j.needsUpdate=!0,re.needsUpdate=!0),c&&f>.02){if(Q.copy(c.direction).normalize(),Ue){let n=Math.acos(T(Q.dot(We),-1,1));Ve+=n*1100*f;let r=Math.floor(Ve);if(Ve-=r,r=Math.min(r,45),r>0){let n=t>1e-4?1/t:0;for(let t=0;t<r;t++){let i=(t+C())/r,a=250+650*C()**.8;W.copy(We).lerp(Q,i).normalize(),$.subVectors(Q,We).multiplyScalar(n*a*.18);let o=$.length();o>260&&$.multiplyScalar(260/o);let s=Z,l=6+a*.02;R[s*3]=c.origin.x+W.x*a+w(-l,l),R[s*3+1]=c.origin.y+W.y*a+w(-l,l),R[s*3+2]=c.origin.z+W.z*a+w(-l,l),z[s*4]=e-C()*.03,z[s*4+1]=w(1.1,1.9),z[s*4+2]=w(.8,2.2),z[s*4+3]=C(),ye[s*3]=$.x,ye[s*3+1]=$.y,ye[s*3+2]=$.z,Z=(Z+1)%600}be.needsUpdate=xe.needsUpdate=B.needsUpdate=!0,He=e}}We.copy(Q),Ue=!0}else Ue=!1;let O=Math.max(f,u*.6);for(let t=0;t<qe;t++)O>.02&&Ye(e,Ke[t].point,Math.round(46*Ke[t].power*(.5+.5*O)),O);qe=0,V.visible=e-He<2,V.visible&&(V.material.uniforms.uTime.value=e)}function et(e,t=1){Ge.on=!!e&&t>.005,Ge.on&&(Ge.ray.copy(e),Ge.s=Math.min(t,1))}function tt(e,t,n=1){if(!e||!t||qe>=Ke.length)return;let r=Ke[qe++];r.ray.copy(e),r.point.copy(t),r.power=n}return{group:e,update:$e,setCursor:et,touch:tt}}export{he as createCreatures};