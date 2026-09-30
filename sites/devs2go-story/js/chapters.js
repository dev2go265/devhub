/* ==========================================================================
   The Devs2Go Story: the four hands-on chapter moments
   1 Discord chat that flops · 2 pivot dial · 3 stack explorer · 4 future board
   They write into window.D2G, which the 3D world (world.js) reads each frame.
   ========================================================================== */
(function () {
  'use strict';

  const D = (window.D2G = window.D2G || {});
  Object.assign(D, { story: 0, travel: 0, pivot: 0, flop: 0, pulse: 0, future: 0, mouse: { x: 0, y: 0 } }, D);

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- 1 · The Discord server ---------- */
  function initDiscord() {
    const root = $('[data-discord]');
    if (!root) return;
    const scroller = $('.dc-scroll', root);
    const online = $('[data-online]', root);
    const hint = $('[data-dc-hint]', root);
    const markers = $$('[data-members]', root);

    function update() {
      const max = scroller.scrollHeight - scroller.clientHeight;
      const progress = max > 0 ? scroller.scrollTop / max : 1;
      if (scroller.scrollTop > 16) hint.classList.add('is-hidden');

      // Online count follows the last join/leave line that has scrolled into view
      const seen = scroller.getBoundingClientRect().top + scroller.clientHeight * 0.85;
      let members = 3;
      markers.forEach((m) => { if (m.getBoundingClientRect().top < seen) members = Number(m.dataset.members); });
      online.textContent = members + ' online';
      online.classList.toggle('is-low', members === 2);
      online.classList.toggle('is-dead', members <= 1);

      const flopped = progress > 0.92;
      root.classList.toggle('is-flopped', flopped);
      D.flop = flopped ? 1 : 0;
    }
    scroller.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- 2 · The pivot dial ---------- */
  function initPivot() {
    const root = $('[data-pivot]');
    if (!root) return;
    const dial = $('[data-dial]', root);
    const readout = $('[data-pivot-readout]', root);
    const ticks = $('.dial-ticks', dial);
    const NS = 'http://www.w3.org/2000/svg';
    const TICKS = 28;
    const tickEls = [];

    for (let i = 0; i <= TICKS; i++) {
      const a = (-135 + (270 * i) / TICKS) * (Math.PI / 180);
      const long = i % 7 === 0;
      const r1 = long ? 88 : 91, r2 = 97;
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', 100 + Math.sin(a) * r1);
      line.setAttribute('y1', 100 - Math.cos(a) * r1);
      line.setAttribute('x2', 100 + Math.sin(a) * r2);
      line.setAttribute('y2', 100 - Math.cos(a) * r2);
      ticks.appendChild(line);
      tickEls.push(line);
    }

    let value = 0;
    let completed = false;
    let anim = null;

    function set(v) {
      value = clamp(v, 0, 1);
      root.style.setProperty('--p', value.toFixed(4));
      root.dataset.state = value < 0.5 ? 'discord' : 'website';
      dial.setAttribute('aria-valuenow', Math.round(value * 100));
      dial.setAttribute('aria-valuetext', value < 0.5 ? 'Discord server' : 'The website, devs2go.com');
      tickEls.forEach((t, i) => t.classList.toggle('is-on', i / TICKS <= value + 0.001));
      readout.textContent = value < 0.02 ? 'Turn the dial' : value < 0.5 ? 'Discord server' : 'devs2go.com';
      D.pivot = value;
      if (value > 0.97 && !completed) { completed = true; D.pulse = 1; }
      if (value < 0.5) completed = false;
    }

    function animateTo(target) {
      cancelAnimationFrame(anim);
      const from = value, start = performance.now(), dur = 900;
      const step = (now) => {
        const k = clamp((now - start) / dur, 0, 1);
        const e = 1 - Math.pow(1 - k, 4);
        set(from + (target - from) * e);
        if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }

    // Angle from the dial centre: 0° at top, clockwise positive, usable range ±135°
    function valueFromPointer(e) {
      const r = dial.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
      if (Math.abs(deg) > 135) return value > 0.5 ? 1 : 0; // the dead zone at the bottom
      return (deg + 135) / 270;
    }

    let dragging = false, moved = 0, startX = 0, startY = 0;
    dial.addEventListener('pointerdown', (e) => {
      dragging = true; moved = 0; startX = e.clientX; startY = e.clientY;
      dial.setPointerCapture(e.pointerId);
      cancelAnimationFrame(anim);
    });
    dial.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      moved = Math.max(moved, Math.hypot(e.clientX - startX, e.clientY - startY));
      if (moved > 4) set(valueFromPointer(e));
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (moved <= 4) animateTo(value < 0.5 ? 1 : 0); // a tap flips it
    };
    dial.addEventListener('pointerup', end);
    dial.addEventListener('pointercancel', end);

    dial.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowUp') { e.preventDefault(); set(value + 0.1); }
      else if (k === 'ArrowLeft' || k === 'ArrowDown') { e.preventDefault(); set(value - 0.1); }
      else if (k === 'Home') { e.preventDefault(); animateTo(0); }
      else if (k === 'End') { e.preventDefault(); animateTo(1); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); animateTo(value < 0.5 ? 1 : 0); }
    });

    set(0);
  }

  /* ---------- 3 · The stack explorer ---------- */
  const STACK = [
    { role: 'Framework', name: 'Next.js & React', desc: 'The foundation of every site. Fast pages, server rendering, and reusable components.', cmd: 'npm i next react' },
    { role: 'Language', name: 'TypeScript', desc: 'JavaScript with types, so mistakes get caught while I build, not after your site is live.', cmd: 'npm i -D typescript' },
    { role: 'Styling', name: 'Tailwind CSS', desc: 'Utility-first styling, so every design is built from scratch and holds up on every screen size.', cmd: 'npm i -D tailwindcss' },
    { role: 'Database', name: 'PostgreSQL & Prisma', desc: 'A real database for accounts, orders and content, with Prisma keeping every query type-safe.', cmd: 'npx prisma migrate dev' },
    { role: 'Payments', name: 'Stripe', desc: 'Secure checkout, subscriptions and invoices, handled by the payments platform the internet runs on.', cmd: 'npm i stripe' },
    { role: 'Hosting', name: 'Vercel', desc: 'Global hosting that goes live the moment the code is pushed. Fast everywhere, nothing to babysit.', cmd: 'git push origin main' }
  ];

  function initStack() {
    const root = $('[data-stack]');
    if (!root) return;
    const tiles = $$('.tile', root);
    const inner = $('[data-stack-inner]', root);
    const role = $('[data-stack-role]', root);
    const name = $('[data-stack-name]', root);
    const desc = $('[data-stack-desc]', root);
    const cmd = $('[data-stack-cmd]', root);
    let current = 0, swapT = null, typeT = null;

    function type(text) {
      clearInterval(typeT);
      let i = 0;
      cmd.textContent = '';
      typeT = setInterval(() => {
        cmd.textContent = text.slice(0, ++i);
        if (i >= text.length) clearInterval(typeT);
      }, 28);
    }

    function select(i) {
      if (i === current) return;
      current = i;
      tiles.forEach((t, j) => t.setAttribute('aria-pressed', String(j === i)));
      inner.classList.add('is-out');
      clearTimeout(swapT);
      swapT = setTimeout(() => {
        const s = STACK[i];
        role.textContent = s.role;
        name.textContent = s.name;
        desc.textContent = s.desc;
        inner.classList.remove('is-out');
        type(s.cmd);
      }, 200);
      D.pulse = 1;
    }

    tiles.forEach((tile, i) => {
      tile.addEventListener('click', () => select(i));
      tile.addEventListener('focus', () => select(i));
      if (fine) tile.addEventListener('pointerenter', () => select(i));
      tile.addEventListener('pointermove', (e) => {
        const r = tile.getBoundingClientRect();
        tile.style.setProperty('--mx', e.clientX - r.left + 'px');
        tile.style.setProperty('--my', e.clientY - r.top + 'px');
      });
    });
  }

  /* ---------- 4 · The future board ---------- */
  function initFuture() {
    const root = $('[data-future]');
    if (!root) return;
    const svg = $('[data-constellation]', root);
    const NS = 'http://www.w3.org/2000/svg';
    const C = [300, 225];

    // Nodes grouped by the goal they belong to
    const nodes = {
      hire: [[440, 150], [490, 240], [445, 330], [545, 175]],
      grow: [[300, 55], [150, 95], [520, 70], [575, 330], [330, 405], [55, 245]],
      shot: [[165, 300], [110, 195], [215, 375], [60, 350]]
    };
    const edges = [
      ['hire', C, nodes.hire[0]], ['hire', C, nodes.hire[1]], ['hire', C, nodes.hire[2]],
      ['hire', nodes.hire[0], nodes.hire[3]], ['hire', nodes.hire[0], nodes.hire[1]], ['hire', nodes.hire[1], nodes.hire[2]],
      ['shot', C, nodes.shot[0]], ['shot', C, nodes.shot[1]], ['shot', nodes.shot[0], nodes.shot[2]],
      ['shot', nodes.shot[0], nodes.shot[3]], ['shot', nodes.shot[1], nodes.shot[0]],
      ['grow', nodes.grow[0], nodes.grow[2]], ['grow', nodes.grow[0], nodes.grow[1]], ['grow', nodes.grow[1], nodes.grow[5]],
      ['grow', nodes.grow[2], nodes.hire[3]], ['grow', nodes.hire[3], nodes.grow[3]], ['grow', nodes.grow[3], nodes.grow[4]],
      ['grow', nodes.grow[4], nodes.shot[2]], ['grow', nodes.grow[5], nodes.shot[3]], ['grow', C, nodes.grow[0]]
    ];

    const make = (tag, attrs) => {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      return el;
    };

    // Faint background stars (fixed pattern, no randomness between loads)
    for (let i = 0; i < 46; i++) {
      const x = (i * 137.5) % 600, y = (i * 91.3 + 40) % 440;
      svg.appendChild(make('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (i % 3) * 0.4 + 0.5, fill: 'rgba(255,230,200,.25)' }));
    }

    const edgeEls = edges.map(([g, a, b]) => {
      const el = make('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'edge' });
      el.dataset.group = g;
      svg.appendChild(el);
      return el;
    });
    const nodeEls = [];
    for (const g in nodes) {
      nodes[g].forEach(([x, y], i) => {
        const el = make('circle', { cx: x, cy: y, r: g === 'grow' ? 6 : 7, class: 'node' });
        el.dataset.group = g;
        el.style.transitionDelay = i * 70 + 'ms';
        svg.appendChild(el);
        nodeEls.push(el);
      });
    }
    svg.appendChild(make('circle', { cx: C[0], cy: C[1], r: 16, class: 'halo' }));
    svg.appendChild(make('circle', { cx: C[0], cy: C[1], r: 13, class: 'node-core' }));
    const label = make('text', { x: C[0], y: C[1] + 40, 'text-anchor': 'middle', class: 'core-label' });
    label.textContent = 'Just me';
    svg.appendChild(label);

    const goals = $$('.goal', root);
    const pinned = new Set();
    const everLit = new Set();
    let preview = null;

    function render() {
      const active = new Set(pinned);
      if (preview) active.add(preview);
      edgeEls.forEach((e) => e.classList.toggle('is-lit', active.has(e.dataset.group)));
      nodeEls.forEach((n) => n.classList.toggle('is-lit', active.has(n.dataset.group)));
      goals.forEach((g) => {
        g.setAttribute('aria-pressed', String(pinned.has(g.dataset.goal)));
        g.classList.toggle('was-lit', everLit.has(g.dataset.goal));
      });
      active.forEach((a) => everLit.add(a));
      const complete = everLit.size === 3;
      root.classList.toggle('is-complete', complete);
      D.future = active.size / 3 + (complete ? 0.35 : 0);
    }

    goals.forEach((g) => {
      const key = g.dataset.goal;
      g.addEventListener('pointerenter', () => { if (fine) { preview = key; render(); } });
      g.addEventListener('pointerleave', () => { if (preview === key) { preview = null; render(); } });
      g.addEventListener('focus', () => { preview = key; render(); });
      g.addEventListener('blur', () => { if (preview === key) { preview = null; render(); } });
      g.addEventListener('click', () => {
        if (pinned.has(key)) pinned.delete(key); else pinned.add(key);
        D.pulse = 0.6;
        render();
      });
    });
    render();
  }

  const start = () => { initDiscord(); initPivot(); initStack(); initFuture(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
