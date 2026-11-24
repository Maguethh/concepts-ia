import{A as e,C as t,D as n,I as r,L as i,P as a,d as o,f as s,h as c,i as l,k as u,o as d,x as f,y as p}from"./vDA4NHid.js";var m=32,h=`
void main(){ gl_Position = vec4(position.xy, 0., 1.); }`,g=`
uniform sampler2D uState;
uniform float uRes, uSize, uK1, uK2, uK3, uDamp;
uniform int uDropCount;
uniform vec4 uDrops[${m}];   // x, z (world mm), radius (mm), strength (mm, negative pushes the water down)
vec2 S(ivec2 c){ c = clamp(c, ivec2(0), ivec2(int(uRes) - 1)); return texelFetch(uState, c, 0).rg; }
void main(){
  ivec2 c = ivec2(gl_FragCoord.xy);
  vec2 s0 = S(c);
  vec2 e = S(c + ivec2(1, 0)), w = S(c - ivec2(1, 0)), n = S(c + ivec2(0, 1)), so = S(c - ivec2(0, 1));
  float ne = S(c + ivec2(1, 1)).r, nw = S(c + ivec2(-1, 1)).r, se = S(c + ivec2(1, -1)).r, sw = S(c + ivec2(-1, -1)).r;
  float ee = S(c + ivec2(2, 0)).r, ww = S(c - ivec2(2, 0)).r, nn = S(c + ivec2(0, 2)).r, ss = S(c - ivec2(0, 2)).r;
  float h = s0.r, hp = s0.g;
  float sum4 = e.r + w.r + n.r + so.r;
  float lap = sum4 - 4. * h;
  float bih = 20. * h - 8. * sum4 + 2. * (ne + nw + se + sw) + (ee + ww + nn + ss);
  float v = h - hp;
  float lapv = (e.r - e.g) + (w.r - w.g) + (n.r - n.g) + (so.r - so.g) - 4. * v;
  // sponge: the last band of the patch swallows the rings instead of bouncing them back
  vec2 uv = (gl_FragCoord.xy) / uRes;
  float m = max(abs(uv.x - .5), abs(uv.y - .5));
  float sp = smoothstep(.38, .5, m);
  float hn = h + v * uDamp * (1. - .12 * sp) + uK1 * lap - uK2 * bih + uK3 * lapv;
  hn *= 1. - .04 * sp;
  // drops: a pure displacement (added to both states, so no kick in velocity), a cosine bump
  float hpOut = h;
  vec2 xz = (uv - .5) * uSize;
  for (int i = 0; i < ${m}; i++){
    if (i >= uDropCount) break;
    vec4 d = uDrops[i];
    float r = length(xz - d.xy);
    if (r < d.z){ float b = d.w * (.5 + .5 * cos(3.14159265 * r / d.z)); hn += b; hpOut += b; }
  }
  hn = clamp(hn, -40., 40.);
  // slopes from the current field (one step behind the new height: invisible at 120 Hz)
  float dx = uSize / uRes;
  vec2 slope = vec2(e.r - w.r, n.r - so.r) / (2. * dx);
  gl_FragColor = vec4(hn, hpOut, slope);
}`,_=`void main(){ gl_FragColor = vec4(0.); }`,v=`
uniform sampler2D uRippleTex; uniform float uRippleSize; uniform float uRippleAmp;
float rplEdge(vec2 xz){ vec2 q = abs(xz / uRippleSize); return 1. - smoothstep(.36, .47, max(q.x, q.y)); }
float rippleHeight(vec2 worldXZ){
  float e = rplEdge(worldXZ); if (e <= 0.) return 0.;
  return textureLod(uRippleTex, worldXZ / uRippleSize + .5, 0.).r * uRippleAmp * e;
}
vec2 rippleSlope(vec2 worldXZ){
  float e = rplEdge(worldXZ); if (e <= 0.) return vec2(0.);
  return textureLod(uRippleTex, worldXZ / uRippleSize + .5, 0.).ba * uRippleAmp * e;
}`;function y(a,{size:y=1800,res:b=256,speed:x=300,decay:S=1.15,capillary:C=.02}={}){let w=a.extensions,T={type:w.has(`EXT_color_buffer_float`)&&w.has(`OES_texture_float_linear`)?s:c,format:n,minFilter:p,magFilter:p,wrapS:d,wrapT:d,depthBuffer:!1,stencilBuffer:!1,generateMipmaps:!1},E=new i(b,b,T),D=new i(b,b,T);E.texture.name=D.texture.name=`ripples`;let O=y/b,k=Math.min(1/120,.4*O/x),A=(x*k/O)**2,j=Array.from({length:m},()=>new r),M=new e({vertexShader:h,fragmentShader:g,depthTest:!1,depthWrite:!1,blending:0,fog:!1,uniforms:{uState:{value:E.texture},uRes:{value:b},uSize:{value:y},uK1:{value:A},uK2:{value:C},uK3:{value:.02},uDamp:{value:Math.exp(-2*k/S)},uDropCount:{value:0},uDrops:{value:j}}}),N=new e({vertexShader:h,fragmentShader:_,depthTest:!1,depthWrite:!1,blending:0}),P=new l;P.setAttribute(`position`,new o([-1,-1,0,3,-1,0,-1,3,0],3));let F=new f(P,M);F.frustumCulled=!1;let I=new u;I.add(F);let L=new t(-1,1,1,-1,0,1),R={uRippleTex:{value:E.texture},uRippleSize:{value:y},uRippleAmp:{value:1}},z=0,B=0,V=1e9,H=!1;function U(e){F.material=e,a.setRenderTarget(D),a.render(I,L);let t=E;E=D,D=t,M.uniforms.uState.value=E.texture}function W(e){if(e=Math.max(0,Math.min(e||0,.1)),z===0&&V>7){if(!H){let e=a.getRenderTarget(),t=a.autoClear;a.autoClear=!1,U(N),U(N),a.autoClear=t,a.setRenderTarget(e),H=!0}R.uRippleTex.value=E.texture;return}V+=e,B+=e;let t=Math.floor(B/k);if(t<1&&z>0&&(t=1),B-=t*k,B<0&&(B=0),t>8&&(t=8,B=0),t===0)return;let n=a.getRenderTarget(),r=a.autoClear;a.autoClear=!1;for(let e=0;e<t;e++)M.uniforms.uDropCount.value=e===0?z:0,U(M);z=0,a.autoClear=r,a.setRenderTarget(n),R.uRippleTex.value=E.texture}function G(e,t,n=25,r=-.4){if(z>=m)return!1;let i=y*.5;return Math.abs(e)>i+n||Math.abs(t)>i+n?!1:(j[z++].set(e,t,Math.max(n,O*1.5),r),M.uniforms.uDropCount.value=z,V=0,H=!1,!0)}function K(){E.dispose(),D.dispose(),M.dispose(),N.dispose(),P.dispose()}return{update:W,addDrop:G,uniforms:R,GLSL:v,dispose:K,size:y,res:b,get texture(){return E.texture},get awake(){return!(z===0&&V>7)}}}var b=new a;function x(e,t,n=1/0){let r=e.direction.y;if(Math.abs(r)<1e-6)return null;let i=(t-e.origin.y)/r;return i<0||i>n?null:b.set(e.origin.x+e.direction.x*i,e.origin.z+e.direction.z*i)}export{v as GLSL,y as createRipples,x as pointerToWater};