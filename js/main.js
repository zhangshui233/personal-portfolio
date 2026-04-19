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
    fresnel: `precision mediump float;
uniform float t;uniform vec2 r;
void main(){
  vec2 uv=(gl_FragCoord.xy-r*.5)/min(r.x,r.y);
  float d=length(uv)-.32;
  float rim=smoothstep(.025,.0,abs(d));
  float glow=exp(-abs(d)*7.)*.5;
  float pulse=sin(t*1.8)*.5+.5;
  vec3 c=vec3(0.,.83,1.)*(rim+glow*(.4+.6*pulse));
  c+=vec3(.48,.37,.65)*glow*(1.-pulse)*1.5;
  float ring=exp(-pow((length(uv)-.32)*20.,2.))*.8*pulse;
  c+=vec3(0.,.83,1.)*ring;
  gl_FragColor=vec4(c,1.);
}`,
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
  gl_FragColor=vec4(c,1.);
}`,
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
  gl_FragColor=vec4(c,1.);
}`
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
