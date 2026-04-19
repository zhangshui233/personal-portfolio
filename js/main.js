/**
 * main.js — TA Portfolio
 * Handles: Three.js hero scene init, nav toggle, project filter
 */

/* ── Three.js Hero Scene ──────────────────────────────────── */

/**
 * initHeroScene()
 * Call this to bootstrap the Three.js particle field on the hero canvas.
 * Extend this function to add custom shaders, geometries, or post-processing.
 */
function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setClearColor(0x000000, 0);

  // Scene & Camera
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 5;

  // ── Particle Field ──────────────────────────────────────
  const PARTICLE_COUNT = 2000;
  const positions = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20; // x
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x00d4ff,
    size: 0.04,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // ── Grid Plane ──────────────────────────────────────────
  const gridHelper = new THREE.GridHelper(30, 30, 0x1e2a3a, 0x1e2a3a);
  gridHelper.position.y = -3;
  scene.add(gridHelper);

  // ── Animation Loop ──────────────────────────────────────
  let frameId;
  const clock = new THREE.Clock();

  function animate() {
    frameId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Slow rotation of particle cloud
    particles.rotation.y = elapsed * 0.04;
    particles.rotation.x = elapsed * 0.02;

    renderer.render(scene, camera);
  }

  animate();

  // ── Resize Handler ────────────────���─────────────────────
  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  window.addEventListener('resize', onResize);

  // Return cleanup function for SPA use
  return function destroy() {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    geometry.dispose();
    material.dispose();
  };
}

/* ── Nav Mobile Toggle ────────────────────────────────────── */
function initNav() {
  const toggle = document.querySelector('.nav__toggle');
  const links  = document.querySelector('.nav__links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close on link click (mobile)
  links.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => links.classList.remove('is-open'));
  });
}

/* ── Card Stage (one card at a time, prev/next + swipe) ───── */
function initCardStages() {
  document.querySelectorAll('.card-stage').forEach(stage => {
    const track   = stage.querySelector('.card-stage__track');
    const cards   = stage.querySelectorAll('.project-card');
    const btnPrev = stage.querySelector('.card-stage__btn--prev');
    const btnNext = stage.querySelector('.card-stage__btn--next');
    const dotsEl  = stage.querySelector('.card-stage__dots');
    const total   = cards.length;
    let current   = 0;

    if (total <= 1) {
      btnPrev.style.display = 'none';
      btnNext.style.display = 'none';
    }

    // Build dots
    const dots = Array.from({ length: total }, (_, i) => {
      const d = document.createElement('span');
      d.className = 'card-stage__dot' + (i === 0 ? ' card-stage__dot--active' : '');
      d.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(d);
      return d;
    });

    function goTo(idx) {
      current = Math.max(0, Math.min(idx, total - 1));
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('card-stage__dot--active', i === current));
      btnPrev.disabled = current === 0;
      btnNext.disabled = current === total - 1;
    }

    btnPrev.addEventListener('click', () => goTo(current - 1));
    btnNext.addEventListener('click', () => goTo(current + 1));

    // Touch swipe
    let touchStartX = 0;
    stage.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
    }, { passive: true });

    goTo(0); // init state
  });
}

/* ── WebGL Shader Previews ────────────────────────────────── */
function initShaderPreviews() {
  const VS = `attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}`;

  const SHADERS = {

    // ── 3D: Fresnel Sphere (raymarching) ─────────────────────
    fresnel3d: `precision mediump float;
uniform float t;uniform vec2 r;
float map(vec3 p){return length(p)-.38;}
vec3 norm(vec3 p){float e=.002;return normalize(vec3(
  map(p+vec3(e,0,0))-map(p-vec3(e,0,0)),
  map(p+vec3(0,e,0))-map(p-vec3(0,e,0)),
  map(p+vec3(0,0,e))-map(p-vec3(0,0,e))));}
void main(){
  vec2 uv=(gl_FragCoord.xy-r*.5)/min(r.x,r.y);
  vec3 ro=vec3(0,0,1.8),rd=normalize(vec3(uv,-1.4));
  float d=0.;vec3 p=ro;bool hit=false;
  for(int i=0;i<48;i++){p=ro+rd*d;float h=map(p);if(h<.002){hit=true;break;}d+=h;if(d>5.)break;}
  vec3 col=vec3(.03,.06,.12)+vec3(0.,.83,1.)*exp(-length(uv)*5.)*.04;
  if(hit){
    vec3 n=norm(p);
    vec3 l=normalize(vec3(cos(t*.5),sin(t*.35),.7));
    float diff=max(dot(n,l),0.);
    float spec=pow(max(dot(reflect(-l,n),-rd),0.),48.);
    float fres=pow(1.-abs(dot(n,-rd)),2.5);
    col =vec3(.02,.05,.1)+vec3(0.,.83,1.)*(diff*.55+spec*.9);
    col+=vec3(0.,.83,1.)*fres*2.2;
    col+=vec3(.48,.37,.65)*fres*.9;
  }
  gl_FragColor=vec4(col,1.);}`,

    // ── 3D: Rotating Torus (raymarching + Phong) ─────────────
    torus: `precision mediump float;
uniform float t;uniform vec2 r;
mat2 rot(float a){return mat2(cos(a),sin(a),-sin(a),cos(a));}
float map(vec3 p){
  p.xz=rot(t*.35)*p.xz;p.xy=rot(t*.2)*p.xy;
  vec2 q=vec2(length(p.xz)-.44,p.y);
  return length(q)-.15;}
vec3 norm(vec3 p){float e=.002;return normalize(vec3(
  map(p+vec3(e,0,0))-map(p-vec3(e,0,0)),
  map(p+vec3(0,e,0))-map(p-vec3(0,e,0)),
  map(p+vec3(0,0,e))-map(p-vec3(0,0,e))));}
void main(){
  vec2 uv=(gl_FragCoord.xy-r*.5)/min(r.x,r.y);
  vec3 ro=vec3(0,0,2.),rd=normalize(vec3(uv,-1.5));
  float d=0.;vec3 p=ro;bool hit=false;
  for(int i=0;i<64;i++){p=ro+rd*d;float h=map(p);if(h<.002){hit=true;break;}d+=h;if(d>7.)break;}
  vec3 col=vec3(.03,.06,.12)+vec3(.48,.37,.65)*exp(-length(uv)*5.)*.05;
  if(hit){
    vec3 n=norm(p);
    vec3 l=normalize(vec3(1.,1.2,.5));
    float diff=max(dot(n,l),0.);
    float spec=pow(max(dot(reflect(-l,n),-rd),0.),64.);
    float fres=pow(1.-abs(dot(n,-rd)),3.);
    col =vec3(.02,.05,.1)+vec3(0.,.83,1.)*(diff*.6+spec);
    col+=vec3(0.,.83,1.)*fres*1.8;
    col+=vec3(.48,.37,.65)*fres*.7;
  }
  gl_FragColor=vec4(col,1.);}`,

    // ── 3D: Metaball smooth-blend (SDF smin) ─────────────────
    metaball: `precision mediump float;
uniform float t;uniform vec2 r;
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float map(vec3 p){
  vec3 a=vec3(cos(t*.65)*.28,sin(t*.5)*.18,0.);
  vec3 b=vec3(-cos(t*.65)*.28,-sin(t*.5)*.18,0.);
  return smin(length(p-a)-.22,length(p-b)-.22,.2);}
vec3 norm(vec3 p){float e=.002;return normalize(vec3(
  map(p+vec3(e,0,0))-map(p-vec3(e,0,0)),
  map(p+vec3(0,e,0))-map(p-vec3(0,e,0)),
  map(p+vec3(0,0,e))-map(p-vec3(0,0,e))));}
void main(){
  vec2 uv=(gl_FragCoord.xy-r*.5)/min(r.x,r.y);
  vec3 ro=vec3(0,0,1.8),rd=normalize(vec3(uv,-1.4));
  float d=0.;vec3 p=ro;bool hit=false;
  for(int i=0;i<56;i++){p=ro+rd*d;float h=map(p);if(h<.002){hit=true;break;}d+=h;if(d>6.)break;}
  vec3 col=vec3(.03,.06,.12)+vec3(.48,.37,.65)*exp(-length(uv)*5.)*.04;
  if(hit){
    vec3 n=norm(p);
    vec3 l=normalize(vec3(.8,1.,.5));
    float diff=max(dot(n,l),0.);
    float spec=pow(max(dot(reflect(-l,n),-rd),0.),32.);
    float fres=pow(1.-abs(dot(n,-rd)),3.);
    col =vec3(.02,.04,.1)+vec3(0.,.83,1.)*(diff*.5+spec*.7);
    col+=vec3(0.,.83,1.)*fres*2.;
    col+=vec3(.48,.37,.65)*fres;
  }
  gl_FragColor=vec4(col,1.);}`,

    // ── 3D: Hologram scanline sphere ──────────────────────────
    hologram: `precision mediump float;
uniform float t;uniform vec2 r;
float map(vec3 p){return length(p)-.36;}
vec3 norm(vec3 p){float e=.002;return normalize(vec3(
  map(p+vec3(e,0,0))-map(p-vec3(e,0,0)),
  map(p+vec3(0,e,0))-map(p-vec3(0,e,0)),
  map(p+vec3(0,0,e))-map(p-vec3(0,0,e))));}
void main(){
  vec2 uv=(gl_FragCoord.xy-r*.5)/min(r.x,r.y);
  vec3 ro=vec3(0,0,1.8),rd=normalize(vec3(uv,-1.4));
  float d=0.;vec3 p=ro;bool hit=false;
  for(int i=0;i<48;i++){p=ro+rd*d;float h=map(p);if(h<.002){hit=true;break;}d+=h;if(d>5.)break;}
  vec3 col=vec3(.02,.05,.1);
  if(hit){
    vec3 n=norm(p);
    float fres=pow(1.-abs(dot(n,-rd)),1.6);
    float scan=abs(sin((p.y*22.+t*2.5)*3.14159))*.5+.5;
    scan*=smoothstep(.2,.8,fres);
    float glitch=step(.97,fract(sin(floor(p.y*28.+floor(t*6.)))*43.))*0.35;
    col=vec3(0.,.83,1.)*(scan*.65+fres*.9+glitch);
    col+=vec3(.48,.37,.65)*(1.-fres)*.25;
    vec2 sg=abs(fract(p.xz*7.)-.5);
    col+=vec3(0.,.83,1.)*smoothstep(.46,.5,max(sg.x,sg.y))*.18*fres;
  }
  col+=vec3(0.,.83,1.)*exp(-length(uv)*5.)*.05;
  gl_FragColor=vec4(col,1.);}`,

    // ── 2D: FBM noise dissolve ────────────────────────────────
    dissolve: `precision mediump float;
uniform float t;uniform vec2 r;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p*=2.1;a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r;
  float nm=fbm(uv*3.+t*.25);
  float th=fract(t*.18);
  float edge=smoothstep(0.,.06,nm-th);
  vec3 c=mix(vec3(0.,.04,.1),vec3(0.,.83,1.)*1.2,edge);
  float rim=smoothstep(.06,.0,abs(nm-th));
  c+=vec3(0.,.83,1.)*rim*4.;
  c+=vec3(.48,.37,.65)*rim*2.;
  gl_FragColor=vec4(c,1.);}`,

    // ── 2D: Procedural scan-line grid ─────────────────────────
    grid: `precision mediump float;
uniform float t;uniform vec2 r;
void main(){
  vec2 uv=gl_FragCoord.xy/r;
  vec2 g=fract(uv*18.);
  float line=smoothstep(.93,1.,max(g.x,g.y))*.7;
  float depth=uv.y*.6+.15;
  float s1=exp(-pow(abs(uv.y-fract(t*.38))*20.,2.))*1.8;
  float s2=exp(-pow(abs(uv.y-fract(t*.38+.5))*20.,2.))*.7;
  vec3 c=vec3(.04,.08,.13);
  c+=vec3(0.,.83,1.)*line*depth;
  c+=vec3(0.,.83,1.)*(s1+s2);
  float cg=exp(-length((uv-vec2(.5,.25))*vec2(1.,1.8))*3.5);
  c+=vec3(.48,.37,.65)*cg*.7;
  gl_FragColor=vec4(c,1.);}`

  };

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  document.querySelectorAll('canvas[data-shader]').forEach(canvas => {
    const fs = SHADERS[canvas.dataset.shader];
    if (!fs) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uT = gl.getUniformLocation(prog, 't');
    const uR = gl.getUniformLocation(prog, 'r');

    function resize() {
      const w = canvas.parentElement.clientWidth || 320;
      const h = canvas.parentElement.clientHeight || 260;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    resize();
    window.addEventListener('resize', resize);

    const start = performance.now();
    (function frame() {
      gl.uniform1f(uT, (performance.now() - start) / 1000);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(frame);
    })();
  });
}


function initProjectFilter() {
  const buttons   = document.querySelectorAll('.filter-btn');
  const projects  = document.querySelectorAll('#projects-container .card');
  if (!buttons.length || !projects.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      buttons.forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');

      const filter = btn.dataset.filter;

      projects.forEach(card => {
        const categories = card.dataset.category || '';
        const visible = filter === 'all' || categories.includes(filter);
        card.style.display = visible ? '' : 'none';
      });
    });
  });
}

/* ── Skill Bar Intersection Observer ─────────────────────── */
function initSkillBars() {
  const fills = document.querySelectorAll('.skill-item__fill');
  if (!fills.length) return;

  // Reset animation so it replays when scrolled into view
  fills.forEach(el => {
    el.style.animationPlayState = 'paused';
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  fills.forEach(el => observer.observe(el));
}

/* ── Bootstrap ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initCardStages();
  initProjectFilter();
  initSkillBars();
  initShaderPreviews();

  // Only init Three.js scene if the hero canvas exists on this page
  if (document.getElementById('hero-canvas')) {
    initHeroScene();
  }
});
