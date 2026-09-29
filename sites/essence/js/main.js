/* ==========================================================================
   ESSENCE — main
   Boots smooth scroll, reveals, atmosphere washes, parallax, the intro,
   and every module. Degrades gracefully if a CDN script fails to load.
   ========================================================================== */
(function () {
  'use strict';
  const E = (window.ESSENCE = window.ESSENCE || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;

  /* ---------- Utilities ---------- */
  E.util = {
    store: {
      get(key, fallback) {
        try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
      },
      set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
      }
    }
  };

  const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isReduced = () => html.classList.contains('reduced');
  mqReduced.addEventListener && mqReduced.addEventListener('change', (e) => html.classList.toggle('reduced', e.matches));

  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const hasGSAP = !!(gsap && ST);
  if (hasGSAP) gsap.registerPlugin(ST);
  else html.classList.add('no-gsap');

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !isReduced()) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });
    E.lenis = lenis;
    if (hasGSAP) {
      lenis.on('scroll', ST.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  E.scrollTo = (target) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.5 });
    else el.scrollIntoView({ behavior: isReduced() ? 'auto' : 'smooth', block: 'start' });
  };

  let refreshT;
  E.refresh = () => {
    if (!hasGSAP) return;
    clearTimeout(refreshT);
    refreshT = setTimeout(() => ST.refresh(), 120);
  };

  /* ---------- Split headlines into words ---------- */
  function splitWords(el) {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const wi = document.createElement('span');
            wi.className = 'wi';
            wi.textContent = p;
            wi.style.setProperty('--i', i++);
            w.appendChild(wi);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
    $$('.w', el).forEach((w) => w.setAttribute('aria-hidden', 'true'));
  }
  $$('[data-split]').forEach(splitWords);

  /* ---------- Reveal stagger: siblings enter in sequence ---------- */
  const groups = new Map();
  $$('[data-reveal]').forEach((el) => {
    const p = el.parentElement;
    if (!groups.has(p)) groups.set(p, []);
    groups.get(p).push(el);
  });
  groups.forEach((els) => els.forEach((el, i) => el.style.setProperty('--d', Math.min(i, 6) * 0.08 + 's')));

  function reveal(el) { el.classList.add('is-in'); }
  const revealables = $$('[data-reveal], [data-split]:not([data-intro])');

  if (hasGSAP) {
    revealables.forEach((el) => {
      ST.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => reveal(el) });
    });
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach(reveal);
  }

  /* ---------- Atmospheric washes (crossfade per chapter) ---------- */
  const WASH = {
    cream: ['rgba(246,217,224,0.55)', 'rgba(220,211,242,0.45)', '#FAF5EE'],
    blush: ['#F6D9E0', 'rgba(246,217,224,0.85)', 'rgba(220,211,242,0.5)'],
    lavender: ['rgba(220,211,242,0.95)', '#DCD3F2', 'rgba(246,217,224,0.6)']
  };
  function setWash(name) {
    const w = WASH[name];
    if (!w) return;
    html.style.setProperty('--wash-a', w[0]);
    html.style.setProperty('--wash-b', w[1]);
    html.style.setProperty('--wash-c', w[2]);
  }
  const washed = $$('[data-wash]');
  if (hasGSAP) {
    washed.forEach((el) => ST.create({
      trigger: el, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) setWash(el.dataset.wash); }
    }));
  } else if ('IntersectionObserver' in window) {
    const wio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setWash(en.target.dataset.wash); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    washed.forEach((el) => wio.observe(el));
  }

  /* ---------- Modules ---------- */
  const safe = (fn, label) => { try { fn(); } catch (err) { console.warn('[essence] ' + label + ' failed', err); } };
  safe(() => E.nav && E.nav.init(), 'nav');
  safe(() => E.builders && E.builders.init(), 'builders');
  safe(() => E.calculator && E.calculator.init(), 'calculator');
  safe(() => E.cursor && E.cursor.init(), 'cursor');

  let hero3d = null;
  safe(() => { hero3d = E.hero ? E.hero.init({ reduced: isReduced() }) : null; }, 'hero');

  const printBtn = $('[data-print]');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

  /* ---------- Scroll choreography ---------- */
  if (hasGSAP) {
    // Hero: camera dollies back, bottle sinks, copy drifts away
    ST.create({
      trigger: '.hero', start: 'top top', end: 'bottom top',
      onUpdate: (self) => { if (hero3d) hero3d.setProgress(self.progress); }
    });

    if (!isReduced()) {
      gsap.to('.hero-inner, .hero-specimen', {
        y: 140, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
      gsap.to('.hero-fallback', {
        yPercent: 18, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });

      // Ghost numerals drift at ~0.3× scroll speed
      $$('[data-ghost]').forEach((g) => {
        gsap.fromTo(g, { y: 0 }, {
          y: () => (window.innerHeight + g.offsetHeight) * 0.7 * 0.5,
          ease: 'none',
          scrollTrigger: { trigger: g.parentElement, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
        });
      });

      // First-batch progress line draws as you read
      const prog = $('[data-timeline-progress]');
      if (prog) {
        gsap.to(prog, {
          scaleY: 1, ease: 'none',
          scrollTrigger: { trigger: '[data-timeline]', start: 'top 65%', end: 'bottom 65%', scrub: 0.6 }
        });
      }

      // Launch plan: horizontal scroll on desktop
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px) and (min-height: 620px)', () => {
        const section = $('#launch');
        const track = $('.launch-inner', section);
        section.classList.add('is-hscroll');
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const tween = gsap.to(track, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: {
            trigger: section, pin: true, start: 'top top',
            end: () => '+=' + dist(), scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1
          }
        });
        ST.refresh();
        return () => { tween.kill(); section.classList.remove('is-hscroll'); gsap.set(track, { clearProps: 'transform' }); };
      });
    } else {
      const prog = $('[data-timeline-progress]');
      if (prog) prog.style.transform = 'scaleY(1)';
    }
  } else if (hero3d) {
    const hero = $('.hero');
    window.addEventListener('scroll', () => {
      const p = Math.min(1, Math.max(0, window.scrollY / hero.offsetHeight));
      hero3d.setProgress(p);
    }, { passive: true });
  }

  /* ---------- Intro (≈900ms) ---------- */
  const introDelays = [
    ['.hero-chapter', 0],
    ['.hero-sub', 0.42],
    ['.hero-ctas .btn:nth-child(1)', 0.52],
    ['.hero-ctas .btn:nth-child(2)', 0.6],
    ['.hero-specimen', 0.68],
    ['.scroll-hint', 0.8]
  ];
  introDelays.forEach(([sel, d]) => { const el = $(sel); if (el) el.style.setProperty('--d', d + 's'); });
  const heroTitle = $('.hero-title');
  if (heroTitle) heroTitle.style.setProperty('--d', '0.08s');

  let loaded = false;
  function go() {
    if (loaded) return;
    loaded = true;
    requestAnimationFrame(() => {
      html.classList.add('is-loaded');
      if (heroTitle) heroTitle.classList.add('is-in');
      setTimeout(() => html.classList.add('intro-done'), 1800);
      E.refresh();
    });
  }
  // Wait briefly for fonts so the headline doesn't reflow mid-rise — never longer than 600ms
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 600))]).then(go);
  } else go();
  window.addEventListener('load', () => E.refresh());
})();
