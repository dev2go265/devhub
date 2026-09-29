/* ==========================================================================
   ESSENCE — interactive builders
   Notes pyramid · fragrance families · method tabs · accordions ·
   "what should you make first?" quiz · scent builder · launch plan
   ========================================================================== */
(function () {
  'use strict';
  const E = (window.ESSENCE = window.ESSENCE || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ======================= A. Notes pyramid ======================= */
  const NOTES = {
    top: {
      kicker: 'Layer 1 of 3 · the opening', title: 'Top notes', lasts: '~30 min', share: '~30%',
      body: "The opening line. Small, zippy molecules that evaporate fast — they're the first thing you smell after a spritz, and the reason perfumes smell so good in the shop. Bright, sharp, gone quickly.",
      items: ['Bergamot', 'Lemon zest', 'Grapefruit', 'Sweet orange', 'Peppermint', 'Lavender', 'Pink pepper', 'Eucalyptus']
    },
    heart: {
      kicker: 'Layer 2 of 3 · the story', title: 'Heart notes', lasts: '2–4 hrs', share: '~50%',
      body: 'The main character. Once the opening fades, the heart takes over and decides what the perfume actually is. Usually floral or spicy — rounder and softer than the top, and the biggest part of your formula.',
      items: ['Rose', 'Jasmine', 'Neroli', 'Geranium', 'Cinnamon', 'Cardamom', 'Rosemary', 'Clove']
    },
    base: {
      kicker: 'Layer 3 of 3 · the echo', title: 'Base notes', lasts: '8–12+ hrs', share: '~20%',
      body: "The foundation. Big, heavy molecules that evaporate slowly — you barely notice them at first, but they're what's still on your jumper tomorrow. They also hold everything above them in place for longer.",
      items: ['Vanilla', 'Sandalwood', 'Cedarwood', 'Amber', 'Musk', 'Patchouli', 'Tonka bean', 'Benzoin']
    }
  };

  function initPyramid() {
    const wrap = $('[data-pyramid]');
    const inner = $('[data-note-inner]');
    if (!wrap || !inner) return;
    const layers = $$('.pyr-layer', wrap);
    let active = 'top';
    let swapT;
    wrap.classList.add('has-active');

    function render(key) {
      const d = NOTES[key];
      inner.innerHTML = `
        <p class="mono-label note-card-kicker">${d.kicker}</p>
        <h3 class="note-card-title">${d.title}</h3>
        <p class="note-card-lasts"><span>Lasts</span> ${d.lasts}</p>
        <p class="note-card-body">${d.body}</p>
        <ul class="chips chips-static">${d.items.map((i) => `<li>${i}</li>`).join('')}</ul>
        <p class="note-card-share">In your formula: <strong>${d.share}</strong></p>`;
    }

    function select(key, focus) {
      layers.forEach((l) => {
        const on = l.dataset.layer === key;
        l.classList.toggle('is-active', on);
        l.setAttribute('aria-pressed', String(on));
        l.setAttribute('tabindex', on ? '0' : '-1');
        if (on && focus) l.focus();
      });
      if (key === active) return;
      active = key;
      // 300ms slide/fade: out left, swap, in from right
      clearTimeout(swapT);
      inner.classList.add('is-out');
      swapT = setTimeout(() => {
        render(key);
        inner.classList.remove('is-out');
        inner.classList.add('is-pre');
        void inner.offsetWidth;
        inner.classList.remove('is-pre');
      }, 150);
    }

    layers.forEach((l, i) => {
      l.addEventListener('click', () => select(l.dataset.layer));
      l.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover)').matches) select(l.dataset.layer); });
      l.addEventListener('keydown', (e) => {
        let next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = layers[Math.min(layers.length - 1, i + 1)];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = layers[Math.max(0, i - 1)];
        if (next) { e.preventDefault(); layers.forEach((x) => x.setAttribute('tabindex', '-1')); next.setAttribute('tabindex', '0'); next.focus(); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(l.dataset.layer, true); }
      });
    });
  }

  /* ======================= Fragrance families ======================= */
  const FAMILIES = {
    floral: { desc: 'Flowers, front and centre — from dewy and green to heady and powdery. The biggest family in perfumery, and the easiest to start with.', accords: [['Rose', 'geranium'], ['Jasmine', 'neroli'], ['Lavender', 'honeyed vanilla']] },
    citrus: { desc: 'Sparkling, clean and instantly cheerful — and the quickest to disappear. This is classic eau de cologne territory.', accords: [['Bergamot', 'neroli'], ['Lemon', 'basil'], ['Grapefruit', 'mint']] },
    woody: { desc: 'Dry, warm and grounded. Think pencil shavings, a forest floor, a cabin in winter. Woods are natural base notes.', accords: [['Cedar', 'vetiver'], ['Sandalwood', 'cardamom'], ['Patchouli', 'orange']] },
    amber: { desc: "Warm, resinous, a little sweet: vanilla, spice and resins, made for evenings. Perfumers used to call this family 'oriental'; most now say 'amber'.", accords: [['Vanilla', 'cinnamon'], ['Benzoin', 'tonka'], ['Clove', 'orange']] },
    fresh: { desc: 'Crisp air, crushed leaves, clean laundry. Green, herbal and aromatic — the scent of a garden after rain.', accords: [['Mint', 'lime'], ['Rosemary', 'lemon'], ['Lavender', 'bergamot']] }
  };

  function initFamilies() {
    const group = $('[data-families]');
    const detail = $('[data-family-detail]');
    if (!group || !detail) return;
    let t;
    group.addEventListener('click', (e) => {
      const b = e.target.closest('[data-family]');
      if (!b || b.getAttribute('aria-pressed') === 'true') return;
      $$('[data-family]', group).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const f = FAMILIES[b.dataset.family];
      clearTimeout(t);
      detail.classList.add('is-out');
      t = setTimeout(() => {
        detail.innerHTML = `<p class="family-desc">${f.desc}</p><ul class="family-accords">${f.accords.map((a) => `<li>${a[0]} <i>+</i> ${a[1]}</li>`).join('')}</ul>`;
        detail.classList.remove('is-out');
      }, 180);
    });
  }

  /* ======================= D. Tabs ======================= */
  function initTabs() {
    const root = $('[data-tabs]');
    if (!root) return;
    const list = $('[role="tablist"]', root);
    const tabs = $$('[role="tab"]', root);
    const pill = $('.tab-pill', root);
    let current = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];

    function movePill(tab) {
      pill.style.width = tab.offsetWidth + 'px';
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
    }

    function activate(tab, opts = {}) {
      if (tab === current) { movePill(tab); return; }
      const oldPanel = document.getElementById(current.getAttribute('aria-controls'));
      const newPanel = document.getElementById(tab.getAttribute('aria-controls'));
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      current = tab;
      movePill(tab);
      if (opts.focus) tab.focus();
      if (opts.hash !== false) {
        try { history.replaceState(null, '', '#' + newPanel.id); } catch (e) { /* file:// */ }
      }
      const swap = () => {
        oldPanel.hidden = true; oldPanel.classList.remove('is-leaving', 'is-active');
        newPanel.hidden = false; newPanel.classList.add('is-active', 'is-entering');
        setTimeout(() => newPanel.classList.remove('is-entering'), 650);
        if (E.refresh) E.refresh();
      };
      if (document.documentElement.classList.contains('reduced')) { swap(); return; }
      oldPanel.classList.add('is-leaving');
      setTimeout(swap, 220);
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); activate(n, { focus: true }); }
      });
    });

    // Deep links: #method-vodka / #method-oil / #method-water
    function fromHash(scroll) {
      const id = location.hash.slice(1);
      const tab = tabs.find((t) => t.getAttribute('aria-controls') === id);
      if (!tab) return false;
      activate(tab, { hash: false });
      if (scroll && E.scrollTo) E.scrollTo('#methods');
      return true;
    }
    E.openMethod = (key) => {
      const tab = tabs.find((t) => t.getAttribute('aria-controls') === 'method-' + key);
      if (tab) activate(tab);
      if (E.scrollTo) E.scrollTo('#methods');
    };
    window.addEventListener('hashchange', () => fromHash(true));
    requestAnimationFrame(() => { movePill(current); fromHash(true); });
    window.addEventListener('resize', () => movePill(current));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => movePill(current));
    list.addEventListener('scroll', () => movePill(current), { passive: true });
  }

  /* ======================= E. Accordions ======================= */
  function initAccordions() {
    $$('[data-accordion]').forEach((group) => {
      const btns = $$('.acc-btn', group);
      btns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const open = btn.getAttribute('aria-expanded') === 'true';
          btns.forEach((b) => {
            const panel = document.getElementById(b.getAttribute('aria-controls'));
            const on = b === btn ? !open : false; // one open per group
            b.setAttribute('aria-expanded', String(on));
            panel.classList.toggle('is-open', on);
          });
          setTimeout(() => E.refresh && E.refresh(), 800);
        });
      });
    });
  }

  /* ======================= G. Quiz ======================= */
  const QUIZ = [
    { q: "What's in your kitchen right now?", o: [
      ['Citrus, herbs and whole spices', { vodka: 2, oil: 1 }],
      ['A garden full of flowers', { water: 2, vodka: 1 }],
      ['Oil and a vanilla bean', { oil: 3 }],
      ['Honestly? Not much yet', { oil: 1, vodka: 1 }]
    ] },
    { q: 'Spray or roll-on?', o: [
      ['Spray — I want it to fill the room a little', { vodka: 3 }],
      ['Roll-on — close and personal', { oil: 3 }],
      ['A light mist for skin and pillows', { water: 3 }]
    ] },
    { q: 'How patient are you?', o: [
      ['I want something today', { water: 2, oil: 1 }],
      ['I can wait a month or so', { oil: 2, vodka: 1 }],
      ["Two months is fine if it's worth it", { vodka: 3 }]
    ] },
    { q: 'Selling it, or just for you?', o: [
      ['Just for me (and maybe gifts)', {}],
      ['I might sell it one day', { oil: 2, vodka: 1, water: -4 }]
    ] }
  ];
  const RESULTS = {
    vodka: { name: 'Vodka infusion', line: "You want a real spray perfume and you've got the patience for it. It's the closest thing to store-bought — and the only method that genuinely improves with age.", sell: 'Selling note: alcohol perfume counts as hazmat in the post. Read Chapter 09 before you plan an online shop.' },
    oil: { name: 'Oil infusion', line: "Low effort, forgiving, and long-wearing on skin. It's also the easiest kind to post if you ever sell. Want it today rather than in a month? Use the warm-oil method from Chapter 02.", sell: 'Selling note: oil perfumes skip most shipping headaches — a smart first product.' },
    water: { name: 'Simmered floral water', line: "It's ready this afternoon and smells like a garden. Just know it's a fridge-kept mist that lasts about two weeks — a lovely treat, not a keeper.", sell: '' }
  };

  function initQuiz() {
    const root = $('[data-quiz]');
    if (!root) return;
    const stage = $('[data-quiz-stage]', root);
    const bar = $('[data-quiz-bar]', root);
    const count = $('[data-quiz-count]', root);
    const back = $('[data-quiz-back]', root);
    const restart = $('[data-quiz-restart]', root);
    let step = 0;
    let answers = [];

    function show() {
      back.disabled = step === 0;
      restart.hidden = step < QUIZ.length;
      if (step >= QUIZ.length) return result();
      const item = QUIZ[step];
      count.textContent = `${step + 1} / ${QUIZ.length}`;
      bar.style.width = ((step + 1) / QUIZ.length) * 100 + '%';
      stage.innerHTML = `<div class="quiz-anim"><p class="quiz-q" id="quiz-q">${item.q}</p>
        <div class="quiz-opts" role="group" aria-labelledby="quiz-q">${item.o.map((o, i) => `<button type="button" class="quiz-opt" data-opt="${i}">${o[0]}</button>`).join('')}</div></div>`;
    }

    function result() {
      const score = { vodka: 0, oil: 0, water: 0 };
      answers.forEach((a, i) => {
        const w = QUIZ[i].o[a][1];
        Object.keys(w).forEach((k) => { score[k] += w[k]; });
      });
      // Ties resolve toward the most forgiving method
      const order = ['oil', 'vodka', 'water'];
      const best = order.reduce((b, k) => (score[k] > score[b] ? k : b), 'oil');
      const r = RESULTS[best];
      const selling = answers[3] === 1;
      count.textContent = 'Result';
      bar.style.width = '100%';
      stage.innerHTML = `<div class="quiz-anim quiz-result">
        <p class="mono-label">Start with</p>
        <h3>${r.name}</h3>
        <p>${r.line}</p>
        ${selling && r.sell ? `<p class="quiz-note"><strong>${r.sell}</strong></p>` : ''}
        <button type="button" class="btn btn-plum" data-go="${best}">Take me to it <span class="btn-arrow" aria-hidden="true">→</span></button>
      </div>`;
      const go = $('[data-go]', stage);
      go.addEventListener('click', () => E.openMethod && E.openMethod(best));
      if (E.bindMagnetic) E.bindMagnetic(go);
    }

    stage.addEventListener('click', (e) => {
      const b = e.target.closest('[data-opt]');
      if (!b) return;
      answers[step] = Number(b.dataset.opt);
      step++;
      show();
      const first = $('.quiz-opt, [data-go]', stage);
      if (first && e.detail === 0) first.focus(); // keyboard users keep their place
    });
    back.addEventListener('click', () => { if (step > 0) { step--; answers.length = step; show(); } });
    restart.addEventListener('click', () => { step = 0; answers = []; show(); });
    show();
  }

  /* ======================= B. Scent builder ======================= */
  const INGREDIENTS = {
    top: ['Bergamot', 'Lemon zest', 'Grapefruit', 'Sweet orange', 'Lime', 'Peppermint', 'Lavender', 'Pink pepper', 'Basil'],
    heart: ['Rose', 'Jasmine', 'Neroli', 'Geranium', 'Cinnamon', 'Rosemary', 'Cardamom', 'Clove', 'Ylang-ylang', 'Nutmeg'],
    base: ['Vanilla', 'Sandalwood', 'Cedarwood', 'Amber', 'Musk', 'Patchouli', 'Tonka', 'Vetiver', 'Benzoin', 'Coffee']
  };
  const TEMPLATES = {
    citrus: { top: ['Bergamot', 'Lemon zest', 'Grapefruit'], heart: ['Neroli', 'Rosemary', 'Geranium'], base: ['Cedarwood', 'Musk'] },
    vanilla: { top: ['Sweet orange', 'Pink pepper'], heart: ['Cinnamon', 'Cardamom', 'Jasmine'], base: ['Vanilla', 'Tonka', 'Benzoin', 'Amber'] },
    woody: { top: ['Bergamot', 'Pink pepper'], heart: ['Rosemary', 'Geranium', 'Clove'], base: ['Cedarwood', 'Sandalwood', 'Vetiver', 'Patchouli'] }
  };
  const MAX = 4;
  const LAYERS = ['top', 'heart', 'base'];
  const KEY = 'essence:builder';

  const state = { top: [], heart: [], base: [] };
  const listeners = [];

  function getFormula() {
    return { top: state.top.slice(), heart: state.heart.slice(), base: state.base.slice() };
  }

  function initBuilder() {
    const root = $('[data-builder]');
    if (!root) return;
    const status = $('[data-builder-status]', root);
    const formula = $('[data-builder-formula]', root);
    const send = $('[data-send-calc]', root);

    const saved = E.util.store.get(KEY, null);
    if (saved) LAYERS.forEach((l) => { state[l] = (saved[l] || []).filter((x) => INGREDIENTS[l].includes(x)).slice(0, MAX); });

    LAYERS.forEach((layer) => {
      const box = $(`[data-chips="${layer}"]`, root);
      box.innerHTML = INGREDIENTS[layer].map((n) => `<button type="button" class="ing-chip" data-ing="${esc(n)}" aria-pressed="false">${esc(n)}</button>`).join('');
      box.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ing]');
        if (!b) return;
        toggle(layer, b.dataset.ing);
      });
    });

    function toggle(layer, name) {
      const list = state[layer];
      const i = list.indexOf(name);
      if (i >= 0) list.splice(i, 1);
      else if (list.length >= MAX) {
        const col = $(`[data-col="${layer}"]`, root);
        col.classList.remove('is-shake'); void col.offsetWidth; col.classList.add('is-shake');
        status.textContent = `Four is the limit per layer — more than that and the notes start to blur into each other. Remove one to swap it out.`;
        status.className = 'builder-status is-warn';
        return;
      } else list.push(name);
      commit();
    }

    function commit() {
      E.util.store.set(KEY, state);
      render();
      listeners.forEach((fn) => fn(getFormula()));
    }

    function render() {
      const n = { top: state.top.length, heart: state.heart.length, base: state.base.length };
      const total = n.top + n.heart + n.base;

      LAYERS.forEach((layer) => {
        $$(`[data-chips="${layer}"] .ing-chip`, root).forEach((b) => {
          const on = state[layer].includes(b.dataset.ing);
          b.setAttribute('aria-pressed', String(on));
          b.classList.toggle('is-maxed', !on && state[layer].length >= MAX);
        });
        $(`[data-col-count="${layer}"]`, root).textContent = `${n[layer]}/${MAX}`;
        const pct = total ? Math.round((n[layer] / total) * 100) : 0;
        $(`[data-ratio-val="${layer}"]`, root).textContent = pct + '%';
        // Pyramid fill: each layer fills proportionally to its selections (of 4)
        const rect = $(`[data-bfill="${layer}"]`, root);
        const bounds = { top: [6, 74], heart: [80, 134], base: [140, 204] }[layer];
        const h = (bounds[1] - bounds[0]) * (n[layer] / MAX);
        rect.setAttribute('y', String(bounds[1] - h));
        rect.setAttribute('height', String(h));
      });

      // Validation
      let msg, cls = 'builder-status';
      if (!total) {
        msg = 'Pick a few ingredients, or start from a template.';
      } else if (!n.base) {
        msg = "No base notes yet — and a perfume with no base won't last. Add at least one from the third column.";
        cls += ' is-warn';
      } else if (!n.heart) {
        msg = 'No heart notes. The heart is half your formula — without it, the top fades straight into the base with nothing in between.';
        cls += ' is-warn';
      } else if (!n.top) {
        msg = 'No top notes. It will work, but it will open flat — add something bright to lift the first impression.';
        cls += ' is-warn';
      } else if (n.top / total > 0.5) {
        msg = `Top-heavy — ${Math.round((n.top / total) * 100)}% of your ingredients are top notes, so it'll vanish fast. Swap one for a heart or base note.`;
        cls += ' is-warn';
      } else {
        msg = 'Balanced. Every layer is covered and nothing is top-heavy. Send it to the calculator to get real amounts.';
        cls += ' is-good';
      }
      status.textContent = msg;
      status.className = cls;
      formula.textContent = total ? LAYERS.filter((l) => n[l]).map((l) => `${l.toUpperCase()}: ${state[l].join(', ')}`).join(' · ') : '';
      send.disabled = !total;
    }

    $$('[data-template]', root).forEach((b) => b.addEventListener('click', () => {
      const t = TEMPLATES[b.dataset.template];
      LAYERS.forEach((l) => { state[l] = t[l].slice(); });
      commit();
    }));
    $('[data-builder-clear]', root).addEventListener('click', () => { LAYERS.forEach((l) => { state[l] = []; }); commit(); });
    send.addEventListener('click', () => {
      listeners.forEach((fn) => fn(getFormula(), { sent: true }));
      if (E.scrollTo) E.scrollTo('#calculator');
    });

    render();
  }

  /* ======================= F. Launch plan ======================= */
  function initLaunch() {
    const KEY_L = 'essence:launch';
    const boxes = $$('[data-task]');
    const fg = $('[data-ring-fg]');
    const pctEl = $('[data-ring-pct]');
    const countEl = $('[data-ring-count]');
    const ring = $('[data-ring]');
    if (!boxes.length || !fg) return;
    const C = 2 * Math.PI * 52;
    fg.style.strokeDasharray = String(C);
    const saved = E.util.store.get(KEY_L, {}) || {};
    boxes.forEach((b) => { b.checked = !!saved[b.dataset.task]; });

    function update() {
      const done = boxes.filter((b) => b.checked).length;
      const pct = Math.round((done / boxes.length) * 100);
      fg.style.strokeDashoffset = String(C * (1 - done / boxes.length));
      pctEl.textContent = pct + '%';
      countEl.textContent = `${done} of ${boxes.length} done`;
      ring.setAttribute('aria-label', `Launch plan ${pct}% complete, ${done} of ${boxes.length} tasks done`);
      $$('.week').forEach((w) => {
        const inputs = $$('[data-task]', w);
        w.classList.toggle('is-complete', inputs.length > 0 && inputs.every((i) => i.checked));
      });
    }
    boxes.forEach((b) => b.addEventListener('change', () => {
      const s = {};
      boxes.forEach((x) => { if (x.checked) s[x.dataset.task] = true; });
      E.util.store.set(KEY_L, s);
      update();
    }));
    const reset = $('[data-launch-reset]');
    if (reset) reset.addEventListener('click', () => { boxes.forEach((b) => { b.checked = false; }); E.util.store.set(KEY_L, {}); update(); });
    update();
  }

  E.builders = {
    init() {
      initPyramid();
      initFamilies();
      initTabs();
      initAccordions();
      initQuiz();
      initBuilder();
      initLaunch();
    },
    getFormula,
    onChange(fn) { listeners.push(fn); }
  };
})();
