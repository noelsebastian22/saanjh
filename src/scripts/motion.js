/** Motion runtime. No dependencies. */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initReveals() {
  const els = document.querySelectorAll('.reveal, .reveal-line');
  if (reduced) return els.forEach((el) => el.classList.add('in'));

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
  );
  els.forEach((el) => io.observe(el));
}

function initTilt() {
  if (reduced || window.matchMedia('(pointer: coarse)').matches) return;

  document.querySelectorAll('[data-tilt]').forEach((el) => {
    const max = parseFloat(el.dataset.tilt) || 6;
    el.addEventListener('pointermove', (ev) => {
      const r = el.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width - 0.5;
      const y = (ev.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', (x * max).toFixed(2) + 'deg');
      el.style.setProperty('--rx', (-y * max).toFixed(2) + 'deg');
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

function initParallax() {
  const els = [...document.querySelectorAll('[data-parallax]')];
  if (reduced || !els.length) return;

  let ticking = false;
  const update = () => {
    const vh = window.innerHeight;
    for (const el of els) {
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const progress = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.setProperty('--py', (-progress * speed * 100).toFixed(1) + 'px');
    }
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}

function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      io.unobserve(el);

      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.dec || '0', 10);
      const suffix = el.dataset.suffix || '';

      if (reduced) { el.textContent = target.toFixed(dec) + suffix; continue; }

      const dur = 1400;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * eased).toFixed(dec) + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, { threshold: 0.4 });

  els.forEach((el) => io.observe(el));
}

function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

const boot = () => { initReveals(); initTilt(); initParallax(); initCounters(); initHeader(); };

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
