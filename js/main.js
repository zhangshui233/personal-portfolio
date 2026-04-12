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

/* ── Project Slider Drag ──────────────────────────────────── */
function initSliders() {
  document.querySelectorAll('.project-slider').forEach(slider => {
    let isDown = false;
    let startX, scrollLeft;

    slider.addEventListener('mousedown', e => {
      isDown = true;
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => { isDown = false; });
    slider.addEventListener('mouseup',    () => { isDown = false; });
    slider.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      slider.scrollLeft = scrollLeft - (x - startX);
    });
  });
}

/* ── Project Filter ───────────────────────────────────────── */
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
  initSliders();
  initProjectFilter();
  initSkillBars();

  // Only init Three.js scene if the hero canvas exists on this page
  if (document.getElementById('hero-canvas')) {
    initHeroScene();
  }
});
