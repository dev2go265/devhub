/* ==========================================================================
   ESSENCE — batch calculator
   fragrance_ml = size × pct / 100 · carrier_ml = size − fragrance_ml
   Per-ingredient amounts split the concentrate 30 / 50 / 20 across the
   scent builder's selections.
   ========================================================================== */
(function () {
  'use strict';
  const E = (window.ESSENCE = window.ESSENCE || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const DROPS_PER_ML = 20;
  const SPLIT = { top: 0.3, heart: 0.5, base: 0.2 };
  const LAYER_NAMES = { top: 'Top', heart: 'Heart', base: 'Base' };
  const KEY = 'essence:calc';

  const fmt = (n) => n.toFixed(2);

  function category(p) {
    if (p < 2) return { name: 'Body splash', row: null };
    if (p <= 4) return { name: 'Cologne', row: 3 };
    if (p < 5) return { name: 'Between cologne & EDT', row: null };
    if (p < 15) return { name: 'Eau de toilette', row: 2 };
    if (p === 15) return { name: 'EDT / EDP border', row: 1 };
    if (p <= 20) return { name: 'Eau de parfum', row: 1 };
    return { name: 'Parfum', row: 0 };
  }

  /* Segmented-control pill, shared by carrier + strength */
  function movePill(seg) {
    const pill = $('.seg-pill', seg);
    const on = $('[aria-checked="true"]', seg);
    seg.classList.toggle('is-custom', !on);
    if (!on) return;
    pill.style.width = on.offsetWidth + 'px';
    pill.style.transform = `translateX(${on.offsetLeft}px)`;
  }

  function init() {
    const root = $('[data-calc]');
    if (!root) return;

    const sizeIn = $('[data-calc-size]', root);
    const pctIn = $('[data-calc-pct]', root);
    const pctOut = $('[data-calc-pct-out]', root);
    const segCarrier = $('[data-seg="carrier"]', root);
    const segStrength = $('[data-seg="strength"]', root);
    const presets = $$('[data-preset]', root);
    const carriers = $$('[data-carrier]', root);
    const out = {
      con: $('[data-out-con]', root), conDrops: $('[data-out-con-drops]', root),
      car: $('[data-out-car]', root), carLabel: $('[data-out-car-label]', root), carSub: $('[data-out-car-sub]', root),
      barCon: $('[data-bar-con]', root), type: $('[data-calc-type]', root), ready: $('[data-calc-ready]', root),
      empty: $('[data-calc-empty]', root), table: $('[data-calc-table]', root)
    };
    const tableRows = $$('.strength-table tbody tr');

    const saved = E.util.store.get(KEY, null) || {};
    const state = {
      size: Number(saved.size) > 0 ? Number(saved.size) : 30,
      pct: Number(saved.pct) > 0 ? Number(saved.pct) : 17,
      carrier: saved.carrier === 'oil' ? 'oil' : 'alcohol',
      formula: E.builders ? E.builders.getFormula() : { top: [], heart: [], base: [] }
    };

    function save() { E.util.store.set(KEY, { size: state.size, pct: state.pct, carrier: state.carrier }); }

    function compute() {
      const size = state.size;
      const pct = state.pct;
      const fragrance = size * pct / 100;
      const carrier = size - fragrance;
      return { size, pct, fragrance, carrier };
    }

    function renderFormula(fragrance) {
      const f = state.formula;
      const present = ['top', 'heart', 'base'].filter((l) => f[l] && f[l].length);
      const count = present.reduce((n, l) => n + f[l].length, 0);
      if (!count) { out.empty.hidden = false; out.table.hidden = true; return; }
      out.empty.hidden = true; out.table.hidden = false;

      // Renormalise if a layer is empty so the concentrate still adds up
      const wSum = present.reduce((s, l) => s + SPLIT[l], 0);
      let rows = '';
      present.forEach((l) => {
        const share = SPLIT[l] / wSum;
        const layerMl = fragrance * share;
        const each = layerMl / f[l].length;
        rows += `<tr><td colspan="3" class="cf-layer">${LAYER_NAMES[l]} · ${Math.round(share * 100)}% of concentrate · ${fmt(layerMl)} ml</td></tr>`;
        f[l].forEach((name) => {
          const drops = each * DROPS_PER_ML;
          rows += `<tr><td>${esc(name)}</td><td class="num">${fmt(each)}</td><td class="num">${drops < 1 ? '&lt;1' : Math.round(drops)}</td></tr>`;
        });
      });
      const missing = ['top', 'heart', 'base'].filter((l) => !present.includes(l));
      out.table.innerHTML = `
        <div class="cf-head"><p class="mono-label">Your formula</p><p>${count} ingredient${count === 1 ? '' : 's'} · 30 / 50 / 20</p></div>
        <table class="cf-table">
          <thead><tr><th scope="col">Ingredient</th><th scope="col" class="num">ml</th><th scope="col" class="num">≈ drops</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="cf-note">${missing.length ? `No ${missing.map((m) => LAYER_NAMES[m].toLowerCase()).join(' or ')} notes selected, so the other layers share the concentrate proportionally. ` : ''}Each layer's share is split evenly between its ingredients. Drops assume ~20 per ml — tiny amounts are easier to hit if you scale the batch up.</p>
        <a class="link-btn" href="#design">Edit blend ↑</a>`;
    }

    function render() {
      const r = compute();
      out.con.textContent = fmt(r.fragrance) + ' ml';
      out.conDrops.textContent = '≈ ' + Math.round(r.fragrance * DROPS_PER_ML) + ' drops';
      out.car.textContent = fmt(r.carrier) + ' ml';
      out.barCon.style.width = r.pct + '%';

      pctOut.textContent = (Number.isInteger(r.pct) ? r.pct : r.pct.toFixed(1)) + '%';
      pctIn.value = String(r.pct);
      pctIn.style.setProperty('--p', ((r.pct - 1) / 29) * 100 + '%');

      const cat = category(r.pct);
      out.type.textContent = cat.name;
      tableRows.forEach((tr, i) => tr.classList.toggle('is-current', i === cat.row));

      presets.forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.preset) === r.pct)));
      carriers.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.carrier === state.carrier)));
      movePill(segStrength);
      movePill(segCarrier);

      $$('[data-size]', root).forEach((b) => b.classList.toggle('is-active', Number(b.dataset.size) === r.size));

      if (state.carrier === 'alcohol') {
        out.carLabel.textContent = 'Alcohol';
        out.carSub.textContent = "high-proof · 190 or perfumer's";
        const now = new Date();
        const d4 = new Date(now.getTime() + 28 * 864e5);
        const d6 = new Date(now.getTime() + 42 * 864e5);
        const f = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        out.ready.innerHTML = `Mix it today and it's ready to judge around <strong>${f(d6)}</strong> — six weeks of aging. Earliest sniff: ${f(d4)}.`;
      } else {
        out.carLabel.textContent = 'Carrier oil';
        out.carSub.textContent = 'jojoba or fractionated coconut';
        out.ready.textContent = "Oil blends are ready to wear straight away — they'll soften a little over the first week.";
      }

      renderFormula(r.fragrance);
    }

    function setSize(v) {
      const n = Math.round(Number(v) * 10) / 10;
      if (!isFinite(n) || n <= 0) return false;
      state.size = Math.min(1000, Math.max(1, n));
      save();
      render();
      return true;
    }
    function setPct(v) {
      const n = Math.round(Number(v) * 2) / 2;
      state.pct = Math.min(30, Math.max(1, n));
      save();
      render();
    }

    sizeIn.value = String(state.size);
    sizeIn.addEventListener('input', () => { if (sizeIn.value !== '') setSize(sizeIn.value); });
    sizeIn.addEventListener('blur', () => { if (!setSize(sizeIn.value)) sizeIn.value = String(state.size); else sizeIn.value = String(state.size); });
    $$('[data-size-step]', root).forEach((b) => b.addEventListener('click', () => {
      const next = Math.max(1, state.size + Number(b.dataset.sizeStep));
      sizeIn.value = String(next);
      setSize(next);
    }));
    $$('[data-size]', root).forEach((b) => b.addEventListener('click', () => { sizeIn.value = b.dataset.size; setSize(b.dataset.size); }));

    presets.forEach((b) => b.addEventListener('click', () => setPct(b.dataset.preset)));
    pctIn.addEventListener('input', () => setPct(pctIn.value));
    carriers.forEach((b) => b.addEventListener('click', () => { state.carrier = b.dataset.carrier; save(); render(); }));

    // Radiogroup arrow keys
    [segCarrier, segStrength].forEach((seg) => {
      const btns = $$('[role="radio"]', seg);
      btns.forEach((b, i) => {
        b.tabIndex = 0;
        b.addEventListener('keydown', (e) => {
          const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          const n = btns[(i + d + btns.length) % btns.length];
          n.focus(); n.click();
        });
      });
    });

    if (E.builders) {
      E.builders.onChange((formula, meta) => {
        state.formula = formula;
        render();
        if (meta && meta.sent) {
          root.classList.remove('is-flash'); void root.offsetWidth; root.classList.add('is-flash');
        }
      });
    }

    window.addEventListener('resize', () => { movePill(segStrength); movePill(segCarrier); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { movePill(segStrength); movePill(segCarrier); });
    render();
  }

  E.calculator = { init, movePill };
})();
