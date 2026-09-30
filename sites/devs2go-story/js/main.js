/* ==========================================================================
   The Devs2Go Story: motion system
   Lenis smooth scroll + GSAP ScrollTrigger · scroll → story position for the
   3D world · chapter moods · reveals · parallax · cursor glow · magnetic buttons.
   Every library is optional: without GSAP/Lenis the page falls back to native
   scrolling and IntersectionObserver reveals.
   ========================================================================== */
(function () {
  'use strict';

  const D = (window.D2G = window.D2G || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const hasGSAP = !!(gsap && ST);
  D.reduced = reduced;

  /* ---------- Split headings into words ---------- */
  function splitWords(el) {
    // Label first, reading <br> as a space so screen readers get real words
    const clone = el.cloneNode(true);
    clone.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
    el.setAttribute('aria-label', clone.textContent.replace(/\s+/g, ' ').trim());
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.setAttribute('aria-hidden', 'true');
            const wi = document.createElement('span');
            wi.className = 'wi';
            wi.style.setProperty('--i', i++);
            wi.textContent = part;
            w.appendChild(wi);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
  }
  $$('[data-split]').forEach(splitWords);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (hasGSAP) gsap.registerPlugin(ST);
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
    D.lenis = lenis;
    if (hasGSAP) {
      lenis.on('scroll', ST.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    scrollToTarget(id === 'top' ? 0 : target);
    if (id !== 'top') {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      setTimeout(() => target.focus({ preventScroll: true }), 60);
    }
  });

  /* ---------- Scroll → story position ---------- */
  // Each [data-scene] block (hero 0, chapters 1–4, footer 5) owns a stretch of
  // scroll. D.travel moves linearly (camera), D.story eases between chapters (mood).
  const scenes = $$('[data-scene]');
  const topbar = $('.topbar');
  const rail = $('.rail');
  const railFill = $('.rail-fill');
  const railStops = $$('.rail-stops li');
  const navLinks = $$('[data-chapter-link]');
  let anchors = [];
  let mood = -1;

  function measure() {
    const line = innerHeight * 0.55;
    anchors = scenes.map((s) => s.getBoundingClientRect().top + scrollY - line);
    anchors[0] = 0;
  }

  function update() {
    const y = lenis ? lenis.scroll : scrollY;
    let i = 0;
    while (i < anchors.length - 1 && y >= anchors[i + 1]) i++;
    const next = anchors[i + 1];
    const t = next !== undefined ? clamp((y - anchors[i]) / (next - anchors[i]), 0, 1) : 0;
    D.travel = i + t;
    D.story = i + smooth(0.45, 1, t);

    const m = clamp(Math.round(D.story), 0, 5);
    if (m !== mood) {
      mood = m;
      document.body.dataset.mood = m;
      navLinks.forEach((a) => {
        const on = Number(a.dataset.chapterLink) === m;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
      railStops.forEach((li, k) => {
        li.classList.toggle('is-active', k + 1 === m);
        li.classList.toggle('is-past', k + 1 < m);
      });
    }
    railFill.style.transform = `scaleY(${clamp((D.travel - 1) / 3.5, 0, 1)})`;
    rail.classList.toggle('is-visible', D.travel > 0.6 && D.travel < 4.9);
    topbar.classList.toggle('is-scrolled', y > 30);
  }

  measure();
  update();
  if (hasGSAP) {
    ST.create({ start: 0, end: 'max', onUpdate: update });
    ST.addEventListener('refresh', () => { measure(); update(); });
  } else {
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', () => { measure(); update(); });
  }
  if (lenis) lenis.on('scroll', update);

  /* ---------- Reveals ---------- */
  const reveals = $$('[data-reveal]');
  const splits = $$('[data-split]:not([data-intro])');
  if (reduced) {
    reveals.forEach((el) => el.classList.add('is-in'));
    $$('[data-split]').forEach((el) => el.classList.add('is-in'));
  } else if (hasGSAP) {
    document.documentElement.classList.add('gsap-on');
    reveals.forEach((el) => {
      gsap.fromTo(el, { autoAlpha: 0, y: 48 }, {
        autoAlpha: 1, y: 0, duration: 1.3, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 96%', once: true }
      });
    });
    splits.forEach((el) => ST.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => el.classList.add('is-in') }));
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -10% 0px' });
    reveals.concat(splits).forEach((el) => io.observe(el));
  } else {
    reveals.concat(splits).forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Parallax ---------- */
  // data-speed moves an element against the scroll (uses `translate`, so it
  // stacks with the reveal's transform instead of fighting it).
  if (hasGSAP && !reduced) {
    $$('[data-speed]').forEach((el) => {
      const speed = parseFloat(el.dataset.speed) || 0;
      gsap.fromTo(el, { '--py': () => speed * innerHeight * 0.5 + 'px' }, {
        '--py': () => -speed * innerHeight * 0.5 + 'px', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
      });
      el.style.translate = '0 var(--py, 0px)';
    });
    // Hero drifts up and dims as the story begins
    gsap.to('.hero-inner', {
      yPercent: -14, opacity: 0.15, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    // Chapter markers slide along their rule as the chapter passes
    $$('.marker-line').forEach((el) => {
      gsap.fromTo(el, { scaleX: 0.2, transformOrigin: 'left center' }, {
        scaleX: 1.6, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 20%', scrub: true }
      });
    });
  }

  /* ---------- Pointer: world mouse, cursor glow, magnetic buttons ---------- */
  addEventListener('pointermove', (e) => {
    D.mouse.x = (e.clientX / innerWidth) * 2 - 1;
    D.mouse.y = -((e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });

  if (fine && !reduced) {
    const cursor = $('.cursor');
    const glow = $('.cursor-glow');
    const ring = $('.cursor-ring');
    document.documentElement.classList.add('has-cursor');
    let tx = innerWidth / 2, ty = innerHeight / 2, gx = tx, gy = ty, rx = tx, ry = ty;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const loop = () => {
      gx += (tx - gx) * 0.08; gy += (ty - gy) * 0.08;
      rx += (tx - rx) * 0.3; ry += (ty - ry) * 0.3;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    const HOVER = 'a, button, [role="slider"], .dc-scroll';
    document.addEventListener('pointerover', (e) => cursor.classList.toggle('is-hover', !!e.target.closest(HOVER)));
    addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    document.addEventListener('pointerleave', () => { cursor.style.opacity = '0'; });
    document.addEventListener('pointerenter', () => { cursor.style.opacity = '1'; });

    $$('[data-magnetic]').forEach((el) => {
      const strength = 0.32;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        if (hasGSAP) gsap.to(el, { x, y, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
        else el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => {
        if (hasGSAP) gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)', overwrite: 'auto' });
        else el.style.transform = '';
      });
    });
  }

  /* ---------- Intro ---------- */
  const intro = () => requestAnimationFrame(() => document.documentElement.classList.add('is-loaded'));
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(intro);
  } else intro();

  // Fonts change layout, so re-measure once they are in
  addEventListener('load', () => { if (hasGSAP) ST.refresh(); else { measure(); update(); } });
})();
