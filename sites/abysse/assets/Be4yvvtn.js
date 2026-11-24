import{A as e,E as t,F as n,I as r,M as i,N as a,O as o,S as s,T as c,a as l,b as u,c as d,d as f,g as p,i as m,l as h,m as g,n as _,r as v,s as y,t as b,u as x,v as S,x as ee}from"./vDA4NHid.js";var C=Math.PI*2,w=918273,T=()=>(w=w*16807%2147483647)/2147483647,E=(e,t)=>e+(t-e)*T(),D=(e,t,n)=>e<t?t:e>n?n:e,O=(e,t,n)=>{let r=D((n-e)/(t-e),0,1);return r*r*(3-2*r)},k=()=>new n,A=`
uniform float uVis, uFogK;
`,j=`
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
`,M=new r;function te(e){return function(t){t.getCurrentViewport(M),e.uniforms.uHalfH.value=Math.max(1,M.w*.5)}}function ne(t,n,r,i){let a=new e({uniforms:{uHalfH:{value:450},...n},vertexShader:r,fragmentShader:i,transparent:!0,depthWrite:!1,blending:2,fog:!1}),o=new c(t,a);return o.frustumCulled=!1,o.renderOrder=6,o.visible=!1,o.onBeforeRender=te(a),o}var N=-.42,re={sardine:{H:.1,W:.48,peak:1.35,blunt:.72,ped:.024,belly:1.08,seg:18,rad:10,K:6.6,bend:2,tail:[[-.42,.024],[-.6,.14],[-.535,0],[-.6,-.14],[-.42,-.024]],dorsal:[-.04,.1,-.08,.07],anal:[-.28,-.19,-.3,.035]},tuna:{H:.125,W:.8,peak:1,blunt:.62,ped:.012,belly:1,seg:26,rad:14,K:5.2,bend:3.2,tail:[[-.42,.014],[-.61,.23],[-.49,0],[-.61,-.23],[-.42,-.014]],dorsal:[.06,.2,.02,.1],dorsal2:[-.13,-.05,-.17,.075],anal:[-.13,-.05,-.17,.075]},lantern:{H:.11,W:.56,peak:1.65,blunt:.45,ped:.03,belly:1,seg:14,rad:8,K:6.3,bend:2,tail:[[-.42,.03],[-.58,.125],[-.52,0],[-.58,-.125],[-.42,-.03]],dorsal:[-.06,.12,-.05,.055],anal:[-.3,-.18,-.31,.04]}},ie=(e,t)=>e.H*Math.max(Math.sin(Math.PI*t**+e.peak),0)**+e.blunt+e.ped*(1-t)*(1-t),ae=e=>D((e-N)/.9199999999999999,0,1);function P(e){let t=[],n=[],r=[],i=e.seg,a=e.rad;for(let r=0;r<=i;r++){let o=r/i,s=N+.9199999999999999*o,c=ie(e,o),l=c*e.W;for(let r=0;r<a;r++){let i=r/a*C,u=Math.sin(i),d=Math.cos(i);t.push(s,c*u*(u<0?e.belly:1),l*d),n.push(o,u)}}let o=(e,t)=>e*a+t%a;for(let e=0;e<i;e++)for(let t=0;t<a;t++)r.push(o(e,t),o(e+1,t),o(e,t+1),o(e,t+1),o(e+1,t),o(e+1,t+1));let s=t.length/3;t.push(-.424,0,0),n.push(0,0);for(let e=0;e<a;e++)r.push(s,o(0,e),o(0,e+1));let c=(e,i,a)=>{let o=t.length/3;t.push(e[0],e[1],0,i[0],i[1],0,a[0],a[1],0),n.push(-1,0,-1,0,-1,0),r.push(o,o+1,o+2)},l=e.tail;c(l[0],l[1],l[2]),c(l[0],l[2],l[4]),c(l[4],l[2],l[3]);let u=t=>ie(e,ae(t)),d=t=>-ie(e,ae(t))*e.belly;for(let t of[e.dorsal,e.dorsal2])t&&c([t[0],u(t[0])*.9],[t[1],u(t[1])*.9],[t[2],u(t[2])+t[3]]);if(e.anal){let t=e.anal;c([t[1],d(t[1])*.9],[t[0],d(t[0])*.9],[t[2],d(t[2])-t[3]])}let p=new m;return p.setAttribute(`position`,new f(t,3)),p.setAttribute(`uv`,new f(n,2)),p.setIndex(r),p.computeVertexNormals(),p}var F=`
attribute vec2 aSwim;              // x: tail-beat phase (rad), y: amplitude (body lengths)
uniform float uK, uBend;
varying vec3 vLoc; varying vec2 vFish;
`,oe=`#include <beginnormal_vertex>
float fS = clamp(.5 - position.x, 0., 1.25);
float fW = pow(fS, uBend);
float fArg = position.x * uK - aSwim.x;
objectNormal = normalize(vec3(objectNormal.x - cos(fArg) * uK * aSwim.y * fW * objectNormal.z, objectNormal.y, objectNormal.z));
`,I=`#include <begin_vertex>
vLoc = position; vFish = uv;
transformed.z += sin(fArg) * aSwim.y * fW;
`,L={sardine:`
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
  if (fFin > .5) { c = vec3(.03); fMetal = .1; fRough = .6; }`};function R(e){let t=re[e],n=new s({color:16777215,metalness:.9,roughness:.3,side:2}),r={uVis:{value:1},uFogK:{value:1},uGlint:{value:0},uK:{value:t.K},uBend:{value:t.bend}},i=e!==`lantern`;return n.onBeforeCompile=t=>{Object.assign(t.uniforms,r),t.vertexShader=t.vertexShader.replace(`#include <common>`,`#include <common>
`+F).replace(`#include <beginnormal_vertex>`,oe).replace(`#include <begin_vertex>`,I),t.fragmentShader=t.fragmentShader.replace(`#include <common>`,`#include <common>
`+A+`uniform float uGlint;
varying vec3 vLoc; varying vec2 vFish;
`).replace(`#include <color_fragment>`,`#include <color_fragment>
        float fMetal = metalness, fRough = roughness;
        float fFin = step(vFish.x, -.5);
        #ifdef USE_MAP
          fFin = 0.; fMetal = .55; fRough = .36;               // a textured model: its own colours, the flank still flashes
        #else
        {
          float yN = vFish.y; vec3 c = vec3(1.);
          ${L[e]}
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
        }`:`#include <emissivemap_fragment>`).replace(`#include <fog_fragment>`,j)},n.customProgramCacheKey=()=>`abysse-fish-`+e,{mat:n,u:r}}function se(e,t){let n=P(re[e]),r=new p(new Float32Array(t*2),2);r.setUsage(x),n.setAttribute(`aSwim`,r);let{mat:i,u:a}=R(e),o=new S(n,i,t);return o.instanceMatrix.setUsage(x),o.frustumCulled=!1,o.visible=!1,o.castShadow=o.receiveShadow=!1,{mesh:o,u:a,swim:r.array,attr:r,M:o.instanceMatrix.array}}var z=new Float32Array(9);function ce(e,t,n,r,i,a,o,s,c,l){let u=-s,d=a,f=Math.hypot(u,d);f<1e-5?(u=0,d=1):(u/=f,d/=f);let p=-d*o,m=d*a-u*s,h=u*o,g=Math.cos(c),_=Math.sin(c),v=p*g+u*_,y=m*g,b=h*g+d*_,x=u*g-p*_,S=-m*_,ee=d*g-h*_;z[0]=a,z[1]=o,z[2]=s,z[3]=v,z[4]=y,z[5]=b,z[6]=x,z[7]=S,z[8]=ee,e[t]=a*l,e[t+1]=o*l,e[t+2]=s*l,e[t+3]=0,e[t+4]=v*l,e[t+5]=y*l,e[t+6]=b*l,e[t+7]=0,e[t+8]=x*l,e[t+9]=S*l,e[t+10]=ee*l,e[t+11]=0,e[t+12]=n,e[t+13]=r,e[t+14]=i,e[t+15]=1}function le(){let e=[],t=[],n=[],r=[.012,.016,.02],i=[.3,.33,.35],a=[.03,.035,.04];for(let o of[1,-1]){let s=e.length/3;for(let n=0;n<=48;n++){let s=(n/48*2-1)*1.25,c=Math.abs(s)/1.25,l=.42-.72*c**1.6,u=-.5+.2*c**2.2;for(let n=0;n<=12;n++){let d=n/12,f=u+(l-u)*d,p=(.075*(1-c)**1.3+.06*Math.exp(-((s/.28)**2)))*Math.max(Math.sin(Math.PI*d**.7),0)**.6;e.push(f,o>0?p:-p*.55,s);let m=o>0?r:c>.8||d<.08?a:i;t.push(m[0],m[1],m[2])}}for(let e=0;e<48;e++)for(let t=0;t<12;t++){let r=s+e*13+t,i=r+1,a=r+12+1,c=a+1;o>0?n.push(r,a,i,i,a,c):n.push(r,i,a,i,c,a)}}for(let i of[1,-1]){let a=e.length/3;e.push(.38,0,.11*i,.38,0,.2*i,.56,-.03,.12*i,.55,-.05,.19*i);for(let e=0;e<4;e++)t.push(...r);n.push(a,a+2,a+1,a+1,a+2,a+3)}let o=new m;o.setAttribute(`position`,new f(e,3)),o.setAttribute(`color`,new f(t,3)),o.setIndex(n),o.computeVertexNormals();let s=new h(.004,.012,.75,5,1);s.rotateZ(Math.PI/2),s.translate(-.87,0,0),s.deleteAttribute(`uv`);let c=new Float32Array(s.attributes.position.count*3);for(let e=0;e<c.length;e+=3)c.set(r,e);return s.setAttribute(`color`,new v(c,3)),_([o,s])}function ue(){let e=new s({vertexColors:!0,roughness:.55,metalness:0,side:2}),t={uVis:{value:1},uFogK:{value:.55},uFlap:{value:0},uFlapA:{value:.3}};return e.onBeforeCompile=e=>{Object.assign(e.uniforms,t),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
uniform float uFlap, uFlapA;`).replace(`#include <beginnormal_vertex>`,`#include <beginnormal_vertex>
        float mA = clamp(abs(position.z) / 1.25, 0., 1.);
        float mArg = uFlap - mA * 1.7 - position.x * .9;
        float mW = pow(mA, 1.5);
        float mSg = position.z < 0. ? -1. : 1.;
        float mFy = uFlapA * sin(mArg) * mW;
        float mDz = uFlapA * (cos(mArg) * (-1.7 / 1.25) * mW + sin(mArg) * 1.5 * sqrt(mA) / 1.25) * mSg;
        float mDx = uFlapA * cos(mArg) * (-.9) * mW;
        objectNormal = normalize(objectNormal + vec3(-mDx, 0., -mDz) * (objectNormal.y < 0. ? -1. : 1.));`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
        transformed.y += mFy;
        transformed.z -= mSg * abs(mFy) * .22 * mA;`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
`+A).replace(`#include <fog_fragment>`,j)},e.customProgramCacheKey=()=>`abysse-manta`,{mat:e,u:t}}var B={H:.34,W:.85,peak:1.5,blunt:.45,ped:.05,belly:1},de=-.5,fe=e=>B.H*Math.max(Math.sin(Math.PI*e**+B.peak),0)**+B.blunt+B.ped*(1-e)*(1-e),pe=e=>-.5+.38*O(.72,1,e),V=[new n(.34,.265,0),new n(.42,.43,0),new n(.6,.45,0),new n(.72,.26,0)],me=V[3];function H(e,t,n){let r=e.attributes.position.count,i=new Float32Array(r*2);for(let e=0;e<r;e++)i[e*2]=t,i[e*2+1]=n?n(e):0;e.setAttribute(`aPart`,new v(i,2));for(let t of Object.keys(e.attributes))[`position`,`normal`,`uv`,`aPart`].includes(t)||e.deleteAttribute(t);if(!e.index){let t=[];for(let e=0;e<r;e++)t.push(e);e.setIndex(t)}return e}function he(){let e=[],r=[],o=[];for(let t=0;t<=30;t++){let n=t/30,i=de+1*n,a=fe(n),o=a*B.W;for(let t=0;t<22;t++){let s=t/22*C;e.push(i,a*Math.sin(s),o*Math.cos(s)),r.push(n,Math.sin(s))}}let s=(e,t)=>e*22+t%22;for(let e=0;e<30;e++)for(let t=0;t<22;t++)o.push(s(e,t),s(e+1,t),s(e,t+1),s(e,t+1),s(e+1,t),s(e+1,t+1));let c=e.length/3;e.push(-.504,0,0),r.push(0,0);for(let e=0;e<22;e++)o.push(c,s(0,e),s(0,e+1));let u=new m;u.setAttribute(`position`,new f(e,3)),u.setAttribute(`uv`,new f(r,2)),u.setIndex(o),u.computeVertexNormals();let p=[H(u,0)];for(let e of[1,-1])for(let r=0;r<8;r++)for(let i of[1,-1]){let a=.76+r/7*.225,o=de+1*a,s=fe(a),c=s*B.W,l=D(pe(a)+i*.065,-.98,.98),u=Math.sqrt(1-l*l)*e,f=.028+r/7*.05*(.8+.4*T()),m=new d(.0065,f,4,1),h=new n(.22,-i,-e*.35).normalize();m.applyQuaternion(new t().setFromUnitVectors(new n(0,1,0),h)),m.translate(o*.995+h.x*f*.35,s*l*.985+h.y*f*.35,c*u*.985+h.z*f*.35),p.push(H(m,1))}let h=new a(new l(V),24,.006,5,!1);p.push(H(h,2,e=>Math.floor(e/6)/24));let g=new i(.028,12,8);g.translate(me.x,me.y,me.z),p.push(H(g,3,()=>1));let v=(e,t,n,r)=>{let i=new m,a=[e,t,n],o=[];for(let e of r)a.push(e[0],e[1],e[2]);for(let e=1;e<r.length;e++)o.push(0,e,e+1);return i.setAttribute(`position`,new f(a,3)),i.setAttribute(`uv`,new f(new Float32Array(a.length/3*2),2)),i.setIndex(o),i.computeVertexNormals(),H(i,4)},y=(e,t)=>{let n=[];for(let r=0;r<=e;r++)n.push(t(r/e));return n};p.push(v(-.49,0,0,y(10,e=>{let t=Math.PI*(.78+.44*e);return[-.49+Math.cos(t)*.21,Math.sin(t)*.21,0]}))),p.push(v(-.18,fe(U(-.18))*.9,0,y(6,e=>[-.3+e*.22,fe(U(-.3+e*.22))*.9+Math.sin(Math.PI*e)*.07,0])));for(let e of[1,-1]){let t=fe(.52)*B.W*.95;p.push(v(.03,-.06,e*t,y(6,n=>{let r=Math.PI*n;return[.03-Math.sin(r)*.12,-.06-Math.cos(r)*.05,e*(t+.02+Math.sin(r)*.05)]})))}return _(p)}function U(e){return D((e-de)/1,0,1)}function ge(){let e=new s({color:16777215,roughness:.5,metalness:0,side:2}),t={uVis:{value:1},uFogK:{value:1},uSway:{value:new n},uTailT:{value:0},uLureView:{value:new n},uLureCol:{value:new y(.45,.85,1)},uLureI:{value:1},uLureR:{value:.2}};return e.onBeforeCompile=e=>{Object.assign(e.uniforms,t),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
attribute vec2 aPart; uniform vec3 uSway; uniform float uTailT;
varying vec3 vLoc; varying vec2 vFish; varying float vPart;`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
        vLoc = position; vFish = uv; vPart = aPart.x;
        transformed += uSway * aPart.y * aPart.y;
        float aTw = clamp((.1 - position.x) / .6, 0., 1.);
        transformed.z += sin(position.x * 5. - uTailT) * .035 * aTw * aTw;`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
        ${A}
        uniform vec3 uLureView, uLureCol; uniform float uLureI, uLureR;
        varying vec3 vLoc; varying vec2 vFish; varying float vPart;
        float aHash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
        float aNoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
          return mix(mix(mix(aHash(i), aHash(i + vec3(1., 0., 0.)), f.x), mix(aHash(i + vec3(0., 1., 0.)), aHash(i + vec3(1., 1., 0.)), f.x), f.y),
                     mix(mix(aHash(i + vec3(0., 0., 1.)), aHash(i + vec3(1., 0., 1.)), f.x), mix(aHash(i + vec3(0., 1., 1.)), aHash(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }`).replace(`#include <color_fragment>`,`#include <color_fragment>
        float aPartF = floor(vPart + .5), aRough = .5, aSpec = 1.;
        {
          vec3 c = vec3(.02, .017, .016);
          if (aPartF < .5) {
            float n = aNoise(vLoc * 60.) * .6 + aNoise(vLoc * 150.) * .4;
            c *= .7 + .6 * n; aRough = .38 + .25 * n;
            float my = mix(-.5, -.12, smoothstep(.72, 1., vFish.x));
            float gape = (1. - smoothstep(.03, .06, abs(vFish.y - my))) * smoothstep(.7, .78, vFish.x);
            c = mix(c, vec3(.004, .001, .001), gape); aRough = mix(aRough, .9, gape); aSpec = 1. - gape;
            float er = length(vec2(vLoc.x - .4, vFish.y - .42));
            c = mix(c, vec3(.05, .07, .08), 1. - smoothstep(.012, .02, er));
          } else if (aPartF < 1.5) { c = vec3(.5, .5, .46); aRough = .3; }
          else if (aPartF < 2.5) { c = vec3(.025); }
          else if (aPartF < 3.5) { c = vec3(.6, .8, .85); aRough = .2; }
          else { c = vec3(.03, .028, .03); aRough = .6; }
          diffuseColor.rgb = c;
        }`).replace(`#include <roughnessmap_fragment>`,`#include <roughnessmap_fragment>
roughnessFactor = aRough;`).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
        {   // the lure lights its own face: wrapped diffuse + a wet highlight, falling off with distance
          vec3 aL = uLureView + vViewPosition; float aD = max(length(aL), 1e-3); aL /= aD;
          float aAtt = uLureI / (1. + aD * aD / (uLureR * uLureR));
          float aWrap = max((dot(normal, aL) + .35) / 1.35, 0.);
          float aSp = pow(max(dot(reflect(-aL, normal), normalize(vViewPosition)), 0.), 22.) * aSpec;
          totalEmissiveRadiance += uLureCol * aAtt * (diffuseColor.rgb * aWrap * 5. + aSp * .35);
          if (aPartF > 2.5 && aPartF < 3.5) totalEmissiveRadiance += uLureCol * uLureI * 2.2;
        }`).replace(`#include <fog_fragment>`,j)},e.customProgramCacheKey=()=>`abysse-angler`,{mat:e,u:t}}var _e=`
attribute float aI;        // intensity (0 = hidden)
attribute vec4 aS;         // size (mm), owner seed, index along the row, type (0 photophore, 1 lure core, 2 lure halo)
uniform float uTime, uHalfH;
varying vec3 vC; varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  float d = max(-mv.z, 1.);
  float px = aS.x * projectionMatrix[1][1] * uHalfH / d;
  float a = aI;
  if (aS.w < .5) {
    float fs = aS.y;
    float breath = .35 + .65 * pow(.5 + .5 * sin(uTime * (.5 + fs * .8) + fs * 50.), 4.);
    float ripple = pow(max(0., sin(uTime * 2.6 - aS.z * .8 + fs * 20.)), 10.) * step(.72, fract(uTime * .07 + fs * 3.));
    a *= breath + ripple * 1.2;
    vC = vec3(.22, .5, 1.) * 2.4;
  } else if (aS.w < 1.5) { vC = vec3(.7, .95, 1.) * 4.; }
  else { vC = vec3(.2, .65, 1.) * .45; }
  if (px < 2.) { a *= px * px * .25; px = 2.; }
  vA = a;
  gl_PointSize = aI > .0005 ? px : 0.;
  gl_Position = aI > .0005 ? projectionMatrix * mv : vec4(2., 2., 2., 1.);
}`,W=`
varying vec3 vC; varying float vA;
void main(){
  vec2 q = gl_PointCoord - .5; float r2 = dot(q, q) * 4.;
  float g = (exp(-r2 * 9.) + .25 * exp(-r2 * 3.)) * (1. - smoothstep(.7, 1., r2));
  gl_FragColor = vec4(vC * g * vA, 1.);
}`,G=`
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
}`,K=`
varying vec3 vC; varying float vA;
void main(){
  float r = length(gl_PointCoord - .5) * 2.;
  float g = 1. - smoothstep(.15, 1., r);
  gl_FragColor = vec4(vC * g * g * vA, 1.);
}`,ve=`
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
}`;function ye(){let e=new g;e.name=`creatures`;let t=se(`sardine`,460);e.add(t.mesh);let r=se(`tuna`,5);e.add(r.mesh),new b().load(`./assets/fish/tuna.glb`,e=>{let t=null;if(e.scene.traverse(e=>{!t&&e.isMesh&&(t=e)}),!t)return;let n=t.geometry;n.setAttribute(`aSwim`,r.attr),n.attributes.normal||n.computeVertexNormals();let i=r.mesh.material,a=t.material;a.map&&(i.map=a.map,i.aoMap=a.aoMap||null,i.needsUpdate=!0);let o=r.mesh.geometry;r.mesh.geometry=n,o.dispose()},void 0,()=>{});let i=ue(),a=new ee(le(),i.mat);a.matrixAutoUpdate=!1,a.frustumCulled=!1,a.visible=!1,e.add(a);let s=se(`lantern`,110);e.add(s.mesh);let c=[];{let e=re.lantern;for(let t of[1,-1]){for(let n=0;n<6;n++){let r=-.28+n*.12,i=ie(e,ae(r)),a=i*e.W;c.push([r,-i*.866*1.08,t*a*.5*1.08,n])}let n=.38,r=ie(e,ae(n)),i=r*e.W;c.push([n,-r*.2,t*i*.95*1.1,6])}}let l=1542,d=new m,f=new Float32Array(l*3),p=new Float32Array(l),h=new Float32Array(l*4);for(let e=0;e<110;e++){let t=T();for(let n=0;n<14;n++){let r=e*14+n;h.set([E(1.3,2.1),t,c[n][3],0],r*4)}}h.set([16,0,0,1],6160),h.set([130,0,0,2],6164);let _=new v(f,3).setUsage(x),y=new v(p,1).setUsage(x);d.setAttribute(`position`,_),d.setAttribute(`aI`,y),d.setAttribute(`aS`,new v(h,4));let S=ne(d,{uTime:{value:0}},_e,W);e.add(S);let w=1400,A=2400,j=new m,M=new Float32Array(w*3),te=new Float32Array(w*4);for(let e=0;e<w;e++)M.set([E(0,A),E(0,A),E(0,A)],e*3),te.set([E(.7,2),T(),E(.15,.6),T()],e*4);j.setAttribute(`position`,new v(M,3)),j.setAttribute(`aK`,new v(te,4));let N=ne(j,{uTime:{value:0},uBox:{value:A},uRise:{value:0},uI:{value:0},uAmb:{value:0},uLume:{value:0},uCenter:{value:new n}},G,K);e.add(N);let P=ge(),F=new ee(he(),P.mat);F.matrixAutoUpdate=!1,F.frustumCulled=!1,F.visible=!1,e.add(F);let oe=new m,I=new Float32Array(1800),L=new Float32Array(2400),R=new Float32Array(1800);for(let e=0;e<600;e++)L[e*4]=-1e4;let B=new v(I,3).setUsage(x),de=new v(L,4).setUsage(x),fe=new v(R,3).setUsage(x);oe.setAttribute(`position`,B),oe.setAttribute(`aB`,de),oe.setAttribute(`aV`,fe);let pe=ne(oe,{uTime:{value:0},uI:{value:1}},ve,K);e.add(pe),pe.renderOrder=7;let V={pos:k(),right:k(),up:k(),fwd:k(),tanH:.3,aspect:1.7},H=k(),U=k(),ye=k();function be(e){let t=e.matrixWorld.elements;V.right.set(t[0],t[1],t[2]).normalize(),V.up.set(t[4],t[5],t[6]).normalize(),V.fwd.set(-t[8],-t[9],-t[10]).normalize(),V.pos.set(t[12],t[13],t[14]),V.tanH=Math.tan((e.fov||30)*Math.PI/360)/(e.zoom||1),V.aspect=e.aspect||1.7}function xe(e,t){ye.subVectors(e,V.pos);let n=ye.dot(V.fwd);if(n<10)return!1;let r=ye.dot(V.right)/(n*V.tanH*V.aspect),i=ye.dot(V.up)/(n*V.tanH);return Math.abs(r)<t&&Math.abs(i)<t}let Se=e=>({o:e,a:k(),b:k(),bulge:k(),dir:k(),s:0,dur:1,state:0,wait:e.delay,side:e.side0,L:k(),LV:k(),Lp:k(),jump:!0,first:!0});function Ce(e){let t=e.o,n=t.near&&T()<t.near[2]?E(t.near[0],t.near[1]):E(t.dMin,t.dMax),r=n*V.tanH,i=r*V.aspect+t.margin;e.side=-e.side;let a=(E(-.45,.45)+t.yBias)*r,o=a+E(-.3,.3)*r;e.a.copy(V.pos).addScaledVector(V.fwd,n).addScaledVector(V.right,-e.side*i).addScaledVector(V.up,a),e.b.copy(V.pos).addScaledVector(V.fwd,n*E(.82,1.18)).addScaledVector(V.right,e.side*i).addScaledVector(V.up,o),e.bulge.copy(V.fwd).multiplyScalar(E(-.28,.22)*n).addScaledVector(V.up,E(-.12,.12)*r),e.dir.subVectors(e.b,e.a).normalize(),e.dur=e.a.distanceTo(e.b)/t.speed,e.s=e.first&&t.firstS||0,e.first=!1,e.state=1,e.jump=!0}function we(e,t,n){if(e.Lp.copy(e.L),e.state===1){e.s+=n/e.dur;let r=Math.min(e.s,1);e.L.lerpVectors(e.a,e.b,r).addScaledVector(e.bulge,Math.sin(Math.PI*r)),e.L.y+=Math.sin(t*.37+e.o.seed)*e.o.bob,e.s>=1&&(e.state=2,e.wait=E(e.o.wMin,e.o.wMax))}else e.L.addScaledVector(e.dir,e.o.speed*n),e.wait-=n;e.jump?(e.LV.copy(e.dir).multiplyScalar(e.o.speed),e.jump=!1):n>1e-5&&e.LV.subVectors(e.L,e.Lp).divideScalar(n)}function Te(e,t,n){let r={off:e,n:t,o:n,p:new Float32Array(t*3),v:new Float32Array(t*3),h:new Float32Array(t*3),fear:new Float32Array(t),roll:new Float32Array(t),ph:new Float32Array(t),sz:new Float32Array(t),sd:new Float32Array(t),rt:Se(n),c:k(),threat:k(),threatT:-99,placed:!1};for(let e=0;e<t;e++)r.sz[e]=E(.82,1.18),r.sd[e]=T(),r.ph[e]=E(0,C),r.h[e*3]=1;return r}let Ee=[Te(0,260,{v0:470,len:112,amp:.07,speed:520,dMin:650,dMax:2100,near:[450,650,.25],margin:850,yBias:0,bob:70,wMin:2,wMax:6,delay:0,side0:1,seed:1.3}),Te(260,200,{v0:500,len:102,amp:.07,speed:560,dMin:1500,dMax:3800,margin:900,yBias:.12,bob:90,wMin:3,wMax:8,delay:3.5,side0:-1,seed:4.1})],De=1/90,Oe=new Int32Array(4096),ke=new Int32Array(512),Ae=new Int32Array(512),je=new Int32Array(512),Me=new Int32Array(512),Ne=(e,t,n)=>(Math.imul(e,73856093)^Math.imul(t,19349663)^Math.imul(n,83492791))&4095,Pe=new Int32Array(5);function Fe(e){let t=e.rt,n=e.p,r=e.v,i=e.o;if(!e.placed){for(let a=0;a<e.n;a++){let o=T(),s=Math.cbrt(T()),c=T()*C,l=Math.acos(2*o-1);n[a*3]=t.a.x+Math.sin(l)*Math.cos(c)*420*s,n[a*3+1]=t.a.y+Math.cos(l)*150*s,n[a*3+2]=t.a.z+Math.sin(l)*Math.sin(c)*260*s,r[a*3]=t.dir.x*i.v0,r[a*3+1]=0,r[a*3+2]=t.dir.z*i.v0,e.h[a*3]=t.dir.x,e.h[a*3+1]=0,e.h[a*3+2]=t.dir.z}e.c.copy(t.a),e.placed=!0}else if(xe(e.c,1.25))t.a.copy(e.c),t.dir.subVectors(t.b,t.a).normalize(),t.dur=t.a.distanceTo(t.b)/i.speed,t.s=0;else{let r=t.a.x-e.c.x,i=t.a.y-e.c.y,a=t.a.z-e.c.z;for(let t=0;t<e.n;t++)n[t*3]+=r,n[t*3+1]+=i,n[t*3+2]+=a;e.c.copy(t.a)}t.L.copy(t.a),t.Lp.copy(t.a),t.jump=!0}function Ie(e,n,r,i,a){let{n:o,p:s,v:c,h:l,fear:u,roll:d,ph:f,sz:p,sd:m,o:h,rt:g}=e;Oe.fill(-1);let _=0,v=0,y=0;for(let e=0;e<o;e++){let t=e*3,n=Math.floor(s[t]*De),r=Math.floor(s[t+1]*De),i=Math.floor(s[t+2]*De);Ae[e]=n,je[e]=r,Me[e]=i;let a=Ne(n,r,i);ke[e]=Oe[a],Oe[a]=e,_+=s[t],v+=s[t+1],y+=s[t+2]}e.c.set(_/o,v/o,y/o),i&&(i.closestPointToPoint(e.c,H),H.distanceToSquared(e.c)<562500&&(e.threat.copy(H),e.threatT=n));let b=n-e.threatT<1.6,x=0;for(let t=0;t<5;t++){let n=t*3,r=q.p[n]-e.c.x,i=q.p[n+1]-e.c.y,a=q.p[n+2]-e.c.z;r*r+i*i+a*a<225e4&&(Pe[x++]=t)}let S=Math.exp(-r/.9),ee=.88**(r*60),w=g.LV.x,T=g.LV.y,E=g.LV.z,k=Math.hypot(w,T,E)||1,A=w/k,j=T/k,M=E/k,te=g.L.x,ne=g.L.y,N=g.L.z,re=V.pos.x,ie=V.pos.y,ae=V.pos.z,P=i?i.origin.x:0,F=i?i.origin.y:0,oe=i?i.origin.z:0,I=i?i.direction.x:0,L=i?i.direction.y:0,R=i?i.direction.z:0,se=t.M,z=t.swim,le=e.off;for(let t=0;t<o;t++){let o=t*3,g=s[o],_=s[o+1],v=s[o+2],y=c[o],k=c[o+1],ue=c[o+2],B=0,de=0,fe=0,pe=0,V=0,me=0,H=0,he=0,U=Ae[t],ge=je[t],_e=Me[t];for(let e=-1;e<=1;e++)for(let n=-1;n<=1;n++)for(let r=-1;r<=1;r++)for(let i=Oe[Ne(U+e,ge+n,_e+r)];i!==-1;i=ke[i]){if(i===t)continue;let e=i*3,n=s[e]-g,r=s[e+1]-_,a=s[e+2]-v,o=n*n+r*r+a*a;if(!(o>8100)&&(pe+=c[e],V+=c[e+1],me+=c[e+2],H++,u[i]>he&&(he=u[i]),o<4624)){let e=Math.sqrt(o)+.001,t=(1-e/68)/e;B-=n*t,de-=r*t,fe-=a*t}}let W=Math.max(u[t]*S,he*ee*.92),G=B*2600,K=de*2600,ve=fe*2600;H&&(G+=(pe/H-y)*1.6,K+=(V/H-k)*1.6,ve+=(me/H-ue)*1.6);let ye=te-g,be=ne-_,xe=N-v,Se=ye*A+be*j+xe*M,Ce=.9*(1-.85*W);G+=(ye-A*Se*.6)*Ce,K+=(be-j*Se*.6)*Ce*1.5,ve+=(xe-M*Se*.6)*Ce,G+=(w-y)*.7,K+=(T-k)*.7,ve+=(E-ue)*.7;let we=m[t]*40;G+=Math.sin(n*1.1+we)*90,K+=Math.sin(n*.9+we*1.3)*40,ve+=Math.cos(n*1.3+we*.7)*90;let Te=g*g+_*_+v*v;if(Te<78400){let e=Math.sqrt(Te)+.001,t=Math.min((280-e)/160,1),n=5200*t*t/e;G+=g*n,K+=_*n,ve+=v*n}let Ee=g-re,De=_-ie,Fe=v-ae;if(Te=Ee*Ee+De*De+Fe*Fe,Te<144400){let e=Math.sqrt(Te)+.001,t=Math.min((380-e)/200,1),n=6e3*t*t/e;G+=Ee*n,K+=De*n,ve+=Fe*n}if(i){let e=(g-P)*I+(_-F)*L+(v-oe)*R;if(e>50){let t=g-(P+I*e),n=_-(F+L*e),r=v-(oe+R*e),i=t*t+n*n+r*r,a=110+e*.09;if(i<a*a){let e=Math.sqrt(i)+.001,o=1-e/a,s=9e3*o/e;G+=t*s,K+=n*s*.6,ve+=r*s,.6+.4*o>W&&(W=.6+.4*o)}}}if(b&&W>.05){let t=g-e.threat.x,n=_-e.threat.y,r=v-e.threat.z,i=Math.hypot(t,n,r)+.001,a=2200*W/i;G+=t*a,K+=n*a*.5,ve+=r*a}for(let e=0;e<x;e++){let t=Pe[e]*3,n=g-q.p[t],r=_-q.p[t+1],i=v-q.p[t+2],a=n*n+r*r+i*i;if(a<230400){let e=Math.sqrt(a)+.001,t=1-e/480,o=7e3*t/e;G+=n*o,K+=r*o,ve+=i*o,.5+.5*t>W&&(W=.5+.5*t)}}u[t]=W;let Ie=y+G*r,Le=(k+K*r)*(1-Math.min(1,r*.9)),Re=ue+ve*r,J=Math.hypot(Ie,Le,Re),Y=h.v0*p[t]*(1.2+2.3*W),X=h.v0*.5;if(J<.001)Ie=A*X,Le=0,Re=M*X,J=X;else if(J>Y){let e=Y/J;Ie*=e,Le*=e,Re*=e,J=Y}else if(J<X){let e=X/J;Ie*=e,Le*=e,Re*=e,J=X}let Z=g+Ie*r,Q=_+Le*r,ze=v+Re*r;if(Te=Z*Z+Q*Q+ze*ze,Te<15625){let e=125/(Math.sqrt(Te)+.001);Z*=e,Q*=e,ze*=e}s[o]=Z,s[o+1]=Q,s[o+2]=ze,c[o]=Ie,c[o+1]=Le,c[o+2]=Re;let Be=l[o],Ve=l[o+2],He=Math.min(1,r*8),Ue=Be+(Ie/J-Be)*He,We=l[o+1]+(Le/J-l[o+1])*He,Ge=Ve+(Re/J-Ve)*He;We=D(We,-.55,.55);let Ke=Math.hypot(Ue,We,Ge)||1;Ue/=Ke,We/=Ke,Ge/=Ke,l[o]=Ue,l[o+1]=We,l[o+2]=Ge;let qe=r>1e-5?(Ve*Ue-Be*Ge)/r:0,Je=.24*Math.sin(n*(1.3+m[t]*1.7)+we)*(.6+W);d[t]+=(D(-qe*.3,-.9,.9)+Je-d[t])*Math.min(1,r*5);let $=h.len*p[t],Ye=W>.3?1:.55+.45*O(-.3,.3,Math.sin(n*.8+we));f[t]=(f[t]+C*D(J/(.75*$),2.5,13)*r*(.6+.4*Ye))%C;let Xe=le+t;z[Xe*2]=f[t],z[Xe*2+1]=(h.amp+.045*W)*(.5+.5*Ye),ce(se,Xe*16,Z,Q,ze,Ue,We,Ge,d[t],$*a)}}let q={p:new Float32Array(15),v:new Float32Array(15),h:new Float32Array(15),roll:new Float32Array(5),ph:new Float32Array(5),len:new Float32Array(5),off:new Float32Array(15),sd:new Float32Array(5),placed:!1,rt:Se({speed:900,dMin:2200,dMax:5200,margin:2200,yBias:-.1,bob:120,wMin:7,wMax:15,delay:4,side0:-1,seed:2.2,firstS:.05})};for(let e=0;e<5;e++)q.len[e]=E(400,700),q.sd[e]=T(),q.ph[e]=E(0,C),q.h[e*3]=1,q.off.set([-e*520+E(-150,150),E(-260,260),E(-650,650)],e*3),q.p.set([1e6,1e6,1e6],e*3);function Le(){let e=q.rt,t=e.dir.x,n=e.dir.z,r=Math.hypot(t,n)||1;for(let i=0;i<5;i++){let a=i*3,o=q.off[a],s=q.off[a+1],c=q.off[a+2];q.placed&&xe(H.set(q.p[a],q.p[a+1],q.p[a+2]),1.2)||(q.p[a]=e.a.x+(t*o-n*c)/r,q.p[a+1]=e.a.y+s,q.p[a+2]=e.a.z+(n*o+t*c)/r,q.v[a]=e.dir.x*e.o.speed,q.v[a+1]=0,q.v[a+2]=e.dir.z*e.o.speed,q.h[a]=t/r,q.h[a+1]=0,q.h[a+2]=n/r)}q.placed=!0,e.L.copy(e.a),e.Lp.copy(e.a)}function Re(e,t,n){let i=q.rt,a=Math.hypot(i.LV.x,i.LV.z)||1,o=i.LV.x/a,s=i.LV.z/a;for(let a=0;a<5;a++){let c=a*3,l=q.off[c],u=q.off[c+1],d=q.off[c+2],f=q.sd[a]*30,p=i.L.x+o*l-s*d+Math.sin(e*.23+f)*200,m=i.L.y+u+Math.sin(e*.31+f)*90,h=i.L.z+s*l+o*d+Math.cos(e*.19+f)*200,g=q.v[c],_=q.v[c+1],v=q.v[c+2];g+=((p-q.p[c])*1.3-(g-i.LV.x)*1.8)*t,_+=((m-q.p[c+1])*1.3-(_-i.LV.y)*1.8)*t,v+=((h-q.p[c+2])*1.3-(v-i.LV.z)*1.8)*t;let y=Math.hypot(g,_,v);y>2200&&(g*=2200/y,_*=2200/y,v*=2200/y,y=2200),q.v[c]=g,q.v[c+1]=_,q.v[c+2]=v,q.p[c]+=g*t,q.p[c+1]+=_*t,q.p[c+2]+=v*t;let b=y||1,x=q.h[c],S=q.h[c+2],ee=Math.min(1,t*2.5),w=x+(g/b-x)*ee,T=q.h[c+1]+(_/b-q.h[c+1])*ee,E=S+(v/b-S)*ee;T=D(T,-.35,.35);let O=Math.hypot(w,T,E)||1;w/=O,T/=O,E/=O,q.h[c]=w,q.h[c+1]=T,q.h[c+2]=E;let k=t>1e-5?(S*w-x*E)/t:0;q.roll[a]+=(D(-k*.5,-.6,.6)+.06*Math.sin(e*.7+f)-q.roll[a])*Math.min(1,t*3),q.ph[a]=(q.ph[a]+C*D(y/(.8*q.len[a]),1.2,3.5)*t)%C,r.swim[a*2]=q.ph[a],r.swim[a*2+1]=.055,ce(r.M,a*16,q.p[c],q.p[c+1],q.p[c+2],w,T,E,q.roll[a],q.len[a]*n)}}let J={rt:Se({speed:950,dMin:6500,dMax:11e3,margin:1600,yBias:.32,bob:160,wMin:6,wMax:14,delay:1.5,side0:1,seed:7.7,firstS:.12}),h:new n(1,0,0),roll:0,flap:0,placed:!1},Y={p:new Float32Array(330),v:new Float32Array(330),h:new Float32Array(330),ph:new Float32Array(110),len:new Float32Array(110),sd:new Float32Array(110),dart:new Float32Array(110),fl:new Float32Array(110),placed:!1};for(let e=0;e<110;e++)Y.len[e]=E(40,80),Y.sd[e]=T(),Y.ph[e]=E(0,C),Y.h[e*3]=1;let X=3e3,Z=X/2,Q={placed:!1,anchor:k(),face:k(),off:0,scale:340,pos:k(),lure:k(),I:0,notice:0,touchT:-99},ze=k(),Be=new u;function Ve(){let e=E(2100,2900),t=e*V.tanH,n=t*V.aspect,r=T()<.5?-1:1;Q.anchor.copy(V.pos).addScaledVector(V.fwd,e).addScaledVector(V.right,r*n*E(.22,.45)).addScaledVector(V.up,t*E(-.25,.12)),Q.face.copy(V.right).multiplyScalar(-r*.85).addScaledVector(V.fwd,-.5),Q.face.y=0,Q.face.lengthSq()<1e-6&&Q.face.set(1,0,0),Q.face.normalize(),Q.placed=!0,Q.off=0}let He=0,Ue=0,We=-99,Ge=!1,Ke=k(),qe=k(),Je=k(),$={ray:new o,s:0,on:!1},Ye=[];for(let e=0;e<4;e++)Ye.push({ray:new o,point:k(),power:0});let Xe=0;function Ze(e,t){let n=t.x-e.origin.x,r=t.y-e.origin.y,i=t.z-e.origin.z,a=e.direction,o=Math.max(0,n*a.x+r*a.y+i*a.z);return Ze.t=o,Math.hypot(n-a.x*o,r-a.y*o,i-a.z*o)}Ze.t=0;function Qe(e,t,n,r){for(let i=0;i<n;i++){let n=He,i=T()*2-1,a=T()*C,o=Math.sqrt(1-i*i),s=1.5+15*Math.cbrt(T())*T()**.35;H.set(o*Math.cos(a),i*.55,o*Math.sin(a)),I[n*3]=t.x+H.x*s,I[n*3+1]=t.y+H.y*s,I[n*3+2]=t.z+H.z*s;let c=E(4,16)*(.6+.4*r);R[n*3]=H.x*c,R[n*3+1]=H.y*c+E(-3,3),R[n*3+2]=H.z*c,L[n*4]=e+s/55+T()*.06,L[n*4+1]=E(.8,2),L[n*4+2]=E(.18,.65),L[n*4+3]=T(),He=(He+1)%600}B.needsUpdate=de.needsUpdate=fe.needsUpdate=!0,We=Math.max(We,e+.4)}let $e=null,et=0,tt=[Ee[0].rt,Ee[1].rt,q.rt,J.rt];function nt(n,o,u){let d=u.camera;if(!d)return;be(d),o=D(o||0,0,.1);let m=u.pointerRay||null,h=D(u.epi||0,0,1),g=D(u.meso||0,0,1),v=D(u.abyss||0,0,1),b=D(u.light??1,0,1),x=u.depth||0;$e===null&&($e=x);let ee=D((x-$e)*5,-40,40);$e=x,et+=ee;let w=h>.001;if(t.mesh.visible=r.mesh.visible=a.visible=w,w){let e=O(0,.85,h),s=Math.sqrt(O(0,.25,h));t.u.uVis.value=r.u.uVis.value=i.u.uVis.value=e,t.u.uGlint.value=1.4*b*e,r.u.uGlint.value=.9*b*e;for(let e=0;e<tt.length;e++){let t=tt[e];t.state!==1&&t.wait<=0&&(h>.3?(Ce(t),t===q.rt?Le():t===J.rt?(t.L.lerpVectors(t.a,t.b,t.s),t.Lp.copy(t.L),J.placed=!0):Fe(t===Ee[0].rt?Ee[0]:Ee[1])):t.wait=.5),t.state===0?t.wait-=o:we(t,n,o)}q.placed&&Re(n,o,s),r.mesh.visible=q.placed;for(let e=0;e<Ee.length;e++){let r=Ee[e];for(let e=0;e<Xe&&r.placed;e++){let t=Ye[e];if(!(t.point.distanceTo(r.c)>1400)){r.threat.copy(t.point),r.threatT=n;for(let e=0;e<r.n;e++){let n=e*3,i=Math.hypot(r.p[n]-t.point.x,r.p[n+1]-t.point.y,r.p[n+2]-t.point.z);i<520&&(r.fear[e]=Math.max(r.fear[e],t.power*(1-i/520)))}}}if(r.placed)Ie(r,n,o,m,s);else for(let e=0;e<r.n;e++)ce(t.M,(r.off+e)*16,0,-1e6,0,1,0,0,0,0)}if(t.mesh.instanceMatrix.needsUpdate=!0,t.attr.needsUpdate=!0,r.mesh.instanceMatrix.needsUpdate=!0,r.attr.needsUpdate=!0,a.visible=J.placed,J.placed){let e=J.rt,t=e.LV.length()||1,r=J.h,c=r.x,l=r.z,u=Math.min(1,o*1.2);r.x+=(e.LV.x/t-r.x)*u,r.y+=(e.LV.y/t*.5-r.y)*u,r.z+=(e.LV.z/t-r.z)*u,r.normalize();let d=o>1e-5?(l*r.x-c*r.z)/o:0;J.roll+=(D(-d*1.2,-.35,.35)-J.roll)*Math.min(1,o*1.5);let f=.35+.65*O(-.2,.6,Math.sin(n*.13+1));J.flap+=o*C/5.5*(.5+.5*f),i.u.uFlap.value=J.flap,i.u.uFlapA.value=.3*f,ce(a.matrix.elements,0,e.L.x,e.L.y-Math.cos(J.flap)*40*f,e.L.z,r.x,r.y,r.z,J.roll,1e3*s),a.matrixWorldNeedsUpdate=!0}}let k=g>.001;s.mesh.visible=N.visible=k;let A=k?g:0;if(k){let e=O(0,.85,g),t=Math.sqrt(O(0,.25,g));s.u.uVis.value=e,U.copy(V.pos).addScaledVector(V.fwd,1400);let r=Y.p,i=Y.v,a=Y.h;if(!Y.placed){for(let e=0;e<110;e++)r[e*3]=U.x+E(-1500,Z),r[e*3+1]=U.y+E(-1500,Z),r[e*3+2]=U.z+E(-1500,Z);Y.placed=!0}let l=m?m.origin.x:0,u=m?m.origin.y:0,d=m?m.origin.z:0,h=m?m.direction.x:0,_=m?m.direction.y:0,v=m?m.direction.z:0,y=re.lantern;for(let g=0;g<110;g++){let b=g*3,x=Y.sd[g]*C,S=r[b],w=r[b+1]+ee*.7,k=r[b+2];S=U.x+((S-U.x+Z)%X+X)%X-Z,w=U.y+((w-U.y+Z)%X+X)%X-Z,k=U.z+((k-U.z+Z)%X+X)%X-Z;let A=x+.7*Math.sin(n*.05*(1+Y.sd[g])+x*3)+.3*Math.sin(n*.13+x*5),j=.25*Math.sin(n*.07+x*2),M=Math.cos(j)*Math.cos(A),te=Math.sin(j),ne=Math.cos(j)*Math.sin(A);if(Y.dart[g]>0?Y.dart[g]-=o:T()<o/14&&(Y.dart[g]=E(.25,.45)),Y.fl[g]*=Math.exp(-o*1.8),$.on){H.set(S,w,k);let e=Ze($.ray,H),t=60+Ze.t*.1;Ze.t>40&&e<t*2&&(Y.fl[g]=Math.max(Y.fl[g],$.s*(1-O(t*.5,t*2,e))))}for(let e=0;e<Xe;e++){let t=Ye[e],n=S-t.point.x,r=w-t.point.y,a=k-t.point.z,o=Math.hypot(n,r,a);if(o<650){let e=t.power*(1-o/650);Y.fl[g]=Math.max(Y.fl[g],e),Y.dart[g]=Math.max(Y.dart[g],.5*e),i[b]+=n/(o+.001)*380*e,i[b+1]+=r/(o+.001)*200*e,i[b+2]+=a/(o+.001)*380*e}}if(m){let e=(S-l)*h+(w-u)*_+(k-d)*v;if(e>40){let t=S-(l+h*e),n=w-(u+_*e),r=k-(d+v*e),i=Math.hypot(t,n,r);if(i<80+e*.08){Y.dart[g]=Math.max(Y.dart[g],.45);let e=1/(i+.001);M=t*e,te=n*e*.5,ne=r*e}}}let N=Math.hypot(S,w,k);N<230&&N>1&&(M+=S/N*2,te+=w/N*2,ne+=k/N*2);let re=Math.hypot(M,te,ne)||1,ie=Y.dart[g]>0,ae=ie?420:35+30*Y.sd[g],P=Math.min(1,o*(ie?6:1.2));i[b]+=(M/re*ae-i[b])*P,i[b+1]+=(te/re*ae-i[b+1])*P,i[b+2]+=(ne/re*ae-i[b+2])*P,S+=i[b]*o,w+=i[b+1]*o,k+=i[b+2]*o,r[b]=S,r[b+1]=w,r[b+2]=k;let F=Math.hypot(i[b],i[b+1],i[b+2]);if(F>5){let e=Math.min(1,o*(ie?8:2)),t=a[b]+(i[b]/F-a[b])*e,n=a[b+1]+(i[b+1]/F-a[b+1])*e,r=a[b+2]+(i[b+2]/F-a[b+2])*e;n=D(n,-.5,.5);let s=Math.hypot(t,n,r)||1;a[b]=t/s,a[b+1]=n/s,a[b+2]=r/s}let oe=Math.max(Math.abs(S-U.x),Math.abs(w-U.y),Math.abs(k-U.z))/Z,I=Math.hypot(S-V.pos.x,w-V.pos.y,k-V.pos.z);N=Math.hypot(S,w,k);let L=(1-O(.72,.97,oe))*O(160,320,I)*O(130,200,N),R=ie?.09:.03;Y.ph[g]=(Y.ph[g]+C*(ie?9:2.2)*o)%C,s.swim[g*2]=Y.ph[g],s.swim[g*2+1]=R;let se=Y.len[g]*L*t;ce(s.M,g*16,S,w,k,a[b],a[b+1],a[b+2],0,se);let le=L*e*(1+2.6*Y.fl[g]);for(let e=0;e<14;e++){let t=c[e],n=t[0],r=.5-n,i=t[2]+Math.sin(n*y.K-Y.ph[g])*R*r*r,a=g*14+e,o=a*3;f[o]=S+(z[0]*n+z[3]*t[1]+z[6]*i)*se,f[o+1]=w+(z[1]*n+z[4]*t[1]+z[7]*i)*se,f[o+2]=k+(z[2]*n+z[5]*t[1]+z[8]*i)*se,p[a]=le}}s.mesh.instanceMatrix.needsUpdate=!0,s.attr.needsUpdate=!0;let S=N.material.uniforms;S.uTime.value=n,S.uRise.value=et,S.uI.value=e,S.uCenter.value.copy(V.pos).addScaledVector(V.fwd,900),S.uAmb.value=b**.35*.55+.03,S.uLume.value=O(90,260,x)}else if(Y.placed)for(let e=0;e<1540;e++)p[e]=0;let j=v>.001;if(F.visible=j,j){let t=O(0,.85,v);P.u.uVis.value=t,Q.placed||Ve(),xe(Q.pos,1.3)?Q.off=0:(Q.off+=o,Q.off>1.5&&Ve()),Q.anchor.distanceTo(V.pos)>6e3&&Ve(),Q.pos.copy(Q.anchor).add(H.set(Math.sin(n*.05)*90,Math.sin(n*.09+1)*50,Math.cos(n*.04)*70));let r=Math.sin(n*.07)*.18,i=Math.cos(r),a=Math.sin(r),s=Q.face.x*i-Q.face.z*a,c=Q.face.x*a+Q.face.z*i,u=.06*Math.sin(n*.11),m=Math.hypot(s,u,c);ce(F.matrix.elements,0,Q.pos.x,Q.pos.y,Q.pos.z,s/m,u/m,c/m,.05*Math.sin(n*.09),Q.scale*Math.sqrt(O(0,.25,v))),F.matrixWorldNeedsUpdate=!0,P.u.uTailT.value=n*1.4,P.u.uSway.value.set(Math.sin(n*.55)*.025,Math.sin(n*.8+1.3)*.03+Math.sin(n*1.9)*.006,Math.cos(n*.43)*.028);let h=n/9%1,g=h<.12?Math.abs(Math.sin(h/.12*Math.PI*3))**8:0,_=0;if($.on){let e=Ze($.ray,Q.lure),t=90+Ze.t*.12;_=$.s*(1-O(t,t*3.5,e))}Q.notice+=(_-Q.notice)*(1-Math.exp(-o*(_>Q.notice?2.5:.6)));for(let e=0;e<Xe;e++){let t=Ye[e];(Ze(t.ray,Q.lure)<260+Ze.t*.2||t.point.distanceTo(Q.lure)<700)&&(Q.touchT=n)}let y=n-Q.touchT,b=y<1.5?Math.abs(Math.sin(y/1.5*Math.PI*3))**6*(1-y/1.5*.5):0;Q.I=((.65+.35*Math.sin(n*(1.3+1.5*Q.notice)))*(.75+.25*Math.sin(n*.37+1))*.6*(1+.7*Q.notice)+g*.9+b*1.4)*t,P.u.uLureI.value=Q.I,P.u.uLureR.value=.2*Q.scale,ze.copy(me).add(P.u.uSway.value),Be.copy(F.matrix),Q.lure.copy(ze).applyMatrix4(Be),H.copy(Q.lure).applyMatrix4(e.matrixWorld).applyMatrix4(d.matrixWorldInverse),P.u.uLureView.value.copy(H);for(let e=1540;e<l;e++)f[e*3]=Q.lure.x,f[e*3+1]=Q.lure.y,f[e*3+2]=Q.lure.z,p[e]=Q.I}else p[1540]=p[1541]=0;if(S.visible=A>0||j,S.visible&&(S.material.uniforms.uTime.value=n,_.needsUpdate=!0,y.needsUpdate=!0),m&&v>.02){if(qe.copy(m.direction).normalize(),Ge){let e=Math.acos(D(qe.dot(Ke),-1,1));Ue+=e*1100*v;let t=Math.floor(Ue);if(Ue-=t,t=Math.min(t,45),t>0){let e=o>1e-4?1/o:0;for(let r=0;r<t;r++){let i=(r+T())/t,a=250+650*T()**.8;U.copy(Ke).lerp(qe,i).normalize(),Je.subVectors(qe,Ke).multiplyScalar(e*a*.18);let o=Je.length();o>260&&Je.multiplyScalar(260/o);let s=He,c=6+a*.02;I[s*3]=m.origin.x+U.x*a+E(-c,c),I[s*3+1]=m.origin.y+U.y*a+E(-c,c),I[s*3+2]=m.origin.z+U.z*a+E(-c,c),L[s*4]=n-T()*.03,L[s*4+1]=E(1.1,1.9),L[s*4+2]=E(.8,2.2),L[s*4+3]=T(),R[s*3]=Je.x,R[s*3+1]=Je.y,R[s*3+2]=Je.z,He=(He+1)%600}B.needsUpdate=de.needsUpdate=fe.needsUpdate=!0,We=n}}Ke.copy(qe),Ge=!0}else Ge=!1;let M=Math.max(v,g*.6);for(let e=0;e<Xe;e++)M>.02&&Qe(n,Ye[e].point,Math.round(46*Ye[e].power*(.5+.5*M)),M);Xe=0,pe.visible=n-We<2,pe.visible&&(pe.material.uniforms.uTime.value=n)}function rt(e,t=1){$.on=!!e&&t>.005,$.on&&($.ray.copy(e),$.s=Math.min(t,1))}function it(e,t,n=1){if(!e||!t||Xe>=Ye.length)return;let r=Ye[Xe++];r.ray.copy(e),r.point.copy(t),r.power=n}return{group:e,update:nt,setCursor:rt,touch:it}}export{ye as createCreatures};