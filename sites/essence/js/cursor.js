/* ==========================================================================
   ESSENCE — custom cursor + magnetic buttons (fine pointers only)
   ========================================================================== */
(function () {
  'use strict';
  const E = (window.ESSENCE = window.ESSENCE || {});

  const INTERACTIVE = 'a, button, [role="button"], [role="tab"], [role="radio"], label, input, summary, .pyr-layer';
  const DARK = '.selling, .never, .caveats, .readout-con, .expect-1, .expect-2';
  const RADIUS = 40; // magnetic reach beyond the element's edge

  const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = () => document.documentElement.classList.contains('reduced');

  function initCursor() {
    const root = document.querySelector('.cursor');
    if (!root || !fine()) return;
    document.documentElement.classList.add('has-cursor');
    const dot = root.querySelector('.cursor-dot');
    const ring = root.querySelector('.cursor-ring');
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0;

    function frame() {
      const k = reduced() ? 1 : 0.18;
      rx += (x - rx) * k;
      ry += (y - ry) * k;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.1 ? requestAnimationFrame(frame) : 0;
    }

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      root.classList.remove('is-hidden');
      if (!raf) raf = requestAnimationFrame(frame);
      const t = e.target instanceof Element ? e.target : null;
      root.classList.toggle('is-hover', !!(t && t.closest(INTERACTIVE)));
      root.classList.toggle('on-dark', !!(t && t.closest(DARK)));
    }, { passive: true });
    window.addEventListener('pointerdown', () => root.classList.add('is-down'));
    window.addEventListener('pointerup', () => root.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => root.classList.add('is-hidden'));
  }

  /* Magnetic: pull toward the pointer inside a 40px halo, spring back on leave */
  const magnets = new Set();
  let px = 0, py = 0, ticking = false;

  function bindMagnetic(el) {
    if (!el || magnets.has(el) || !fine()) return;
    magnets.add(el);
    el._mag = { active: false };
  }

  function move(el, dx, dy, spring) {
    const g = window.gsap;
    if (g) {
      g.to(el, spring
        ? { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.35)' }
        : { x: dx, y: dy, duration: 0.6, ease: 'power3.out' });
    } else {
      el.style.transition = spring ? 'transform .9s cubic-bezier(.34,1.56,.64,1)' : 'transform .5s cubic-bezier(.16,1,.3,1)';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  }

  function check() {
    ticking = false;
    if (reduced()) return;
    magnets.forEach((el) => {
      if (!el.isConnected) { magnets.delete(el); return; }
      const r = el.getBoundingClientRect();
      const inside = px > r.left - RADIUS && px < r.right + RADIUS && py > r.top - RADIUS && py < r.bottom + RADIUS;
      if (inside && !el.disabled) {
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        el._mag.active = true;
        move(el, (px - cx) * 0.28, (py - cy) * 0.38, false);
      } else if (el._mag.active) {
        el._mag.active = false;
        move(el, 0, 0, true);
      }
    });
  }

  function initMagnetic() {
    if (!fine()) return;
    document.querySelectorAll('[data-magnetic]').forEach(bindMagnetic);
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX; py = e.clientY;
      if (!ticking) { ticking = true; requestAnimationFrame(check); }
    }, { passive: true });
  }

  E.bindMagnetic = bindMagnetic;
  E.cursor = { init() { initCursor(); initMagnetic(); } };
})();
