/* ==========================================================================
   ESSENCE — navigation
   Glass pill that shrinks on scroll · active-section pill · dark-section
   inversion · full-screen mobile menu · smooth anchor scrolling
   ========================================================================== */
(function () {
  'use strict';
  const E = (window.ESSENCE = window.ESSENCE || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Only chapters with their own desktop link light up the pill; the rest
  // clear it, so the highlight never points at the previous chapter
  const LINK_FOR = {
    notes: 'notes', 'first-batch': 'first-batch', methods: 'methods',
    calculator: 'calculator', longevity: 'longevity', selling: 'selling'
  };

  function init() {
    const nav = $('[data-nav]');
    if (!nav) return;
    const links = $$('.nav-links [data-nav-link]', nav);
    const pill = $('.nav-pill', nav);
    const burger = $('.nav-burger', nav);
    const menu = $('#menu');
    const sections = $$('main > section[id]');
    const dark = $$('.selling');
    let activeId = null;
    let ticking = false;

    function movePill(link) {
      if (!link) { pill.style.opacity = '0'; return; }
      pill.style.opacity = '1';
      pill.style.width = link.offsetWidth + 'px';
      pill.style.transform = `translateX(${link.offsetLeft}px)`;
    }

    function onScroll() {
      ticking = false;
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 40);

      const probe = 40;
      const overDark = dark.some((s) => { const r = s.getBoundingClientRect(); return r.top < probe && r.bottom > probe; });
      nav.classList.toggle('on-dark', overDark);

      const mid = window.innerHeight * 0.45;
      let current = null;
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) { current = s.id; break; }
      }
      const linkId = current ? LINK_FOR[current] || null : null;
      if (linkId !== activeId) {
        activeId = linkId;
        let activeLink = null;
        links.forEach((a) => {
          const on = a.getAttribute('href') === '#' + linkId;
          a.classList.toggle('is-active', on);
          if (on) { a.setAttribute('aria-current', 'true'); activeLink = a; } else a.removeAttribute('aria-current');
        });
        movePill(activeLink);
      }
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    window.addEventListener('resize', () => { activeId = '__'; onScroll(); });
    onScroll();

    /* ---------- Mobile menu ---------- */
    $$('.menu-list a', menu).forEach((a, i) => a.style.setProperty('--i', i));
    let lastFocus = null;

    function openMenu() {
      lastFocus = document.activeElement;
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('menu-open');
      if (E.lenis) E.lenis.stop();
      setTimeout(() => { const f = $('a', menu); if (f) f.focus(); }, 200);
    }
    function closeMenu(restoreFocus = true) {
      menu.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('menu-open');
      if (E.lenis) E.lenis.start();
      setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 900);
      if (restoreFocus && lastFocus) lastFocus.focus();
    }
    E.closeMenu = closeMenu;

    burger.addEventListener('click', () => (burger.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu()));
    document.addEventListener('keydown', (e) => {
      if (burger.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key === 'Tab') {
        // Trap focus between the burger and the menu links
        const items = [burger].concat($$('a', menu));
        const i = items.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });

    /* ---------- Smooth anchors ---------- */
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute('href');
      if (hash.length < 2) return;
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      e.preventDefault();
      const inMenu = menu.contains(a);
      if (inMenu) closeMenu(false);
      if (E.scrollTo) E.scrollTo(target);
      else target.scrollIntoView({ behavior: 'smooth' });
      try { history.pushState(null, '', hash === '#top' ? location.pathname : hash); } catch (err) { /* file:// */ }
      // Move focus for keyboard + screen-reader users without a second jump
      const focusable = target.matches('section, footer') ? target : null;
      if (focusable) {
        if (!focusable.hasAttribute('tabindex')) focusable.setAttribute('tabindex', '-1');
        setTimeout(() => focusable.focus({ preventScroll: true }), inMenu ? 500 : 50);
      }
    });
  }

  E.nav = { init };
})();
