/* 4-stroke simulator: drag the piston, drag the flywheel, step, run, or slow-mo. Angle A runs 0..720 (two crank turns). */
(function () {
  const { $, $$, esc, shuffle, pick, Progress } = U;
  const ST = DATA.STROKES;
  const CX = 200, CY = 440, R = 55, L = 165;

  function pinY(A) { const t = A * Math.PI / 180; return CY - (R * Math.cos(t) + Math.sqrt(L * L - R * R * Math.sin(t) ** 2)); }
  const mod = (a) => ((a % 720) + 720) % 720;
  const strokeOf = (A) => Math.floor(mod(A) / 180);
  function lift(A) {
    const m = mod(A);
    return { in: m < 180 ? Math.sin(Math.PI * m / 180) : 0, ex: m >= 540 ? Math.sin(Math.PI * (m - 540) / 180) : 0 };
  }
  function sparkState(A) { const m = mod(A); if (m >= 345 && m < 375) return "real"; if (m >= 705) return "wasted"; return ""; }

  function gas(A) {
    const m = mod(A);
    if (m < 180) return { fill: "var(--air)", op: 0.15 + 0.35 * m / 180, text: "fresh mix" };
    if (m < 360) return { fill: "var(--fuel)", op: 0.5 + 0.3 * (m - 180) / 180, text: "squeezed mix" };
    if (m < 540) return { fill: "var(--hot)", op: m < 400 ? 0.95 : 0.85 - 0.35 * (m - 400) / 140, text: "burning gas" };
    return { fill: "var(--exhaust)", op: 0.55 - 0.4 * (m - 540) / 180, text: "burned gas" };
  }

  // Returns the inside of the SVG for angle A. full=true adds flywheel, cam and labels.
  function frame(A, full) {
    const py = pinY(A), top = py - 30, t = A * Math.PI / 180;
    const cpx = CX + R * Math.sin(t), cpy = CY - R * Math.cos(t);
    const lf = lift(A), sp = sparkState(A), g = gas(A);
    const iv = 150 + lf.in * 22, ev = 150 + lf.ex * 22;
    let s = `<rect x="0" y="0" width="640" height="540" fill="none"/>`;
    // ports
    s += `<path d="M20 70 L120 70 L150 120 L150 150 L130 150 L110 100 L20 100 Z" fill="color-mix(in srgb, var(--air) 30%, var(--metal-3))" stroke="var(--ink)" stroke-width="2.5"/>`;
    s += `<path d="M380 70 L280 70 L250 120 L250 150 L270 150 L290 100 L380 100 Z" fill="color-mix(in srgb, var(--exhaust) 35%, var(--metal-3))" stroke="var(--ink)" stroke-width="2.5"/>`;
    // head + walls
    s += `<path class="s-wall" d="M110 100 L130 150 L140 150 L140 375 L118 375 L118 110 Z"/><path class="s-wall" d="M290 100 L270 150 L260 150 L260 375 L282 375 L282 110 Z"/>`;
    s += `<rect class="s-wall" x="150" y="96" width="100" height="24"/>`;
    // gas
    s += `<rect class="s-gas" x="140" y="150" width="120" height="${Math.max(0, top - 150)}" fill="${g.fill}" opacity="${g.op.toFixed(2)}"/>`;
    // valves
    const valve = (x, y, cls) => `<g class="${cls}"><rect x="${x - 4}" y="${y - 90}" width="8" height="90" fill="var(--metal)" stroke="var(--ink)" stroke-width="1.5"/><path d="M${x - 18} ${y} L${x + 18} ${y} L${x + 6} ${y - 10} L${x - 6} ${y - 10} Z" fill="var(--metal-2)" stroke="var(--ink)" stroke-width="2"/><path d="M${x - 12} ${y - 70} h24" stroke="var(--ink)" stroke-width="3"/><path d="M${x - 10} ${y - 66} l20 6 l-20 6 l20 6 l-20 6 l20 6" fill="none" stroke="var(--ink)" stroke-width="2"/></g>`;
    s += valve(165, iv, "v-in") + valve(235, ev, "v-ex");
    // spark plug
    s += `<rect x="192" y="40" width="16" height="56" rx="3" fill="#f4f1ea" stroke="var(--ink)" stroke-width="2"/><rect x="195" y="96" width="10" height="34" fill="var(--metal)" stroke="var(--ink)" stroke-width="1.5"/>`;
    if (sp === "real") s += `<path class="s-spark" d="M200 128 l-12 16 l9 -1 l-6 18 l18 -22 l-9 1 l8 -13 z"/>`;
    if (sp === "wasted") s += `<path class="s-spark" opacity=".35" d="M200 128 l-12 16 l9 -1 l-6 18 l18 -22 l-9 1 l8 -13 z"/>`;
    // piston + rings
    s += `<g class="s-handle" data-drag="piston"><rect x="142" y="${top}" width="116" height="70" rx="6" fill="var(--metal-3)" stroke="var(--ink)" stroke-width="2.5"/>`;
    s += [8, 16, 26].map((d) => `<line x1="142" y1="${top + d}" x2="258" y2="${top + d}" stroke="var(--ink)" stroke-width="2"/>`).join("");
    s += `<circle cx="${CX}" cy="${py}" r="8" fill="var(--metal)" stroke="var(--ink)" stroke-width="2"/></g>`;
    // crankcase, rod, crank
    s += `<path d="M118 375 L118 420 Q118 520 200 520 Q282 520 282 420 L282 375" fill="none" stroke="var(--ink)" stroke-width="3"/>`;
    s += `<line x1="${CX}" y1="${py}" x2="${cpx}" y2="${cpy}" stroke="var(--ink)" stroke-width="14" stroke-linecap="round"/><line x1="${CX}" y1="${py}" x2="${cpx}" y2="${cpy}" stroke="var(--metal-2)" stroke-width="8" stroke-linecap="round"/>`;
    s += `<circle cx="${CX}" cy="${CY}" r="${R + 14}" fill="none" stroke="var(--metal)" stroke-width="2" stroke-dasharray="4 5"/>`;
    s += `<path d="M${CX} ${CY} L${CX - 60 * Math.sin(t) - 30 * Math.cos(t)} ${CY + 60 * Math.cos(t) - 30 * Math.sin(t)} L${CX - 60 * Math.sin(t) + 30 * Math.cos(t)} ${CY + 60 * Math.cos(t) + 30 * Math.sin(t)} Z" fill="var(--metal)" stroke="var(--ink)" stroke-width="2"/>`;
    s += `<line x1="${CX}" y1="${CY}" x2="${cpx}" y2="${cpy}" stroke="var(--ink)" stroke-width="10"/><circle cx="${cpx}" cy="${cpy}" r="9" fill="var(--metal-3)" stroke="var(--ink)" stroke-width="2"/><circle cx="${CX}" cy="${CY}" r="10" fill="var(--ink)"/>`;
    if (!full) return s;
    // cam (half speed) with tappets
    const cam = (x, label, peakCrank, lf) => {
      const ca = (A - peakCrank) / 2;
      return `<g><circle cx="${x}" cy="470" r="20" fill="var(--metal-2)" stroke="var(--ink)" stroke-width="2"/>
        <g transform="rotate(${ca} ${x} 470)"><path d="M${x - 14} 462 Q${x} 432 ${x + 14} 462 Z" fill="var(--metal)" stroke="var(--ink)" stroke-width="2"/></g>
        <rect x="${x - 9}" y="${426 - lf * 14}" width="18" height="16" fill="var(--metal-3)" stroke="var(--ink)" stroke-width="2"/>
        <line x1="${x}" y1="${426 - lf * 14}" x2="${x}" y2="${300 - lf * 14}" stroke="var(--ink)" stroke-width="4"/>
        <text class="e-text" x="${x}" y="510" text-anchor="middle" style="font-size:13px">${label}</text></g>`;
    };
    s += cam(325, "Intake lobe", 90, lf.in) + cam(380, "Exhaust lobe", 630, lf.ex);
    s += `<text class="e-text" x="352" y="290" text-anchor="middle" style="font-size:13px">push rods</text>`;
    s += `<text class="e-text" x="352" y="530" text-anchor="middle" style="font-size:12px">Cam turns at half speed</text>`;
    // flywheel
    const fa = mod(A) % 360;
    s += `<g class="s-handle" data-drag="flywheel"><circle cx="520" cy="250" r="95" fill="var(--metal-2)" stroke="var(--ink)" stroke-width="3"/>`;
    for (let i = 0; i < 16; i++) { const a = (i * 22.5 + fa) * Math.PI / 180; s += `<line x1="${520 + 60 * Math.sin(a)}" y1="${250 - 60 * Math.cos(a)}" x2="${520 + 88 * Math.sin(a)}" y2="${250 - 88 * Math.cos(a)}" stroke="var(--ink)" stroke-width="2"/>`; }
    const ma = fa * Math.PI / 180;
    s += `<g transform="rotate(${fa} 520 250)"><rect x="505" y="152" width="30" height="14" rx="2" fill="var(--oil)" stroke="var(--ink)" stroke-width="2"/></g>`;
    s += `<circle cx="520" cy="250" r="22" fill="var(--metal)" stroke="var(--ink)" stroke-width="2"/><circle cx="${520 + 40 * Math.sin(ma)}" cy="${250 - 40 * Math.cos(ma)}" r="9" fill="var(--hot)" stroke="var(--ink)" stroke-width="2"/></g>`;
    s += `<path d="M485 120 h70 v26 h-14 v-12 h-42 v12 h-14 z" fill="var(--ink)"/><text class="e-text" x="520" y="112" text-anchor="middle" style="font-size:13px">Magnetron coil</text>`;
    s += `<text class="e-label" x="520" y="370" text-anchor="middle" style="font-size:15px">↻ Drag the flywheel</text>`;
    s += `<text class="e-label" x="200" y="${top + 50}" text-anchor="middle" style="font-size:14px">↕ drag</text>`;
    s += `<text class="e-text" x="70" y="62" text-anchor="middle" style="font-size:13px">INTAKE</text><text class="e-text" x="330" y="62" text-anchor="middle" style="font-size:13px">EXHAUST</text>`;
    if (sp === "wasted") s += `<text class="e-label" x="200" y="24" text-anchor="middle" style="font-size:14px">wasted spark (does nothing)</text>`;
    return s;
  }
  window.STROKE_FRAME = frame;

  const svg = $("#sim");
  if (!svg) return;
  const START = 40;   // a little way into intake, so the intake valve is visibly open
  let A = START, total = START, running = false, slow = false, anim = null, last = 0;
  const done = new Set(Progress.list("strokes"));

  function setA(newTotal) {
    const prev = total;
    total = newTotal;
    if (total > prev) {
      for (let b = Math.floor(prev / 180) + 1; b * 180 <= total; b++) {
        const k = ((b - 1) % 4 + 4) % 4;
        if (!done.has(ST[k].id)) { done.add(ST[k].id); Progress.mark("strokes", ST[k].id); }
      }
    }
    A = mod(total);
    render();
  }
  function render() {
    svg.innerHTML = frame(A, true);
    const k = strokeOf(A), s = ST[k], lf = lift(A), sp = sparkState(A);
    const pistonDir = k % 2 === 0 ? "Down ↓" : "Up ↑";
    $("#s-name").innerHTML = `<small>${s.aid}!</small>${s.name}`;
    $("#r-piston").textContent = pistonDir;
    // readouts follow the stroke itself, so they always match the table
    $("#r-in").textContent = s.intake;
    $("#r-ex").textContent = s.exhaust;
    $("#r-spark").textContent = sp === "real" ? (k === 1 ? "Firing now (end)" : "YES! Just fired") : k === 2 ? "Yes (fired at the start)" : sp === "wasted" ? "No (wasted spark)" : "No";
    $("#r-in").parentNode.classList.toggle("on", s.intake === "Open");
    $("#r-ex").parentNode.classList.toggle("on", s.exhaust === "Open");
    $("#r-spark").parentNode.classList.toggle("fire", sp === "real");
    $("#s-mix").textContent = s.mix;
    $("#r-angle").textContent = Math.round(A) + "°";
    $$("#s-steps button").forEach((b, i) => { b.classList.toggle("cur", i === k); b.querySelector(".ok").textContent = done.has(ST[i].id) ? " ✓" : ""; });
  }

  function animateTo(target) {
    stopRun();
    const from = total, dist = target - from, dur = Math.abs(dist) / (slow ? 45 : 240) * 1000;
    const t0 = performance.now();
    cancelAnimationFrame(anim);
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      setA(from + dist * p);
      if (p < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  function runLoop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    setA(total + dt * (slow ? 40 : 200));
    anim = requestAnimationFrame(runLoop);
  }
  function stopRun() { running = false; $("#run").innerHTML = "&#9654; Run it"; $("#run").setAttribute("aria-pressed", "false"); }

  $("#next").onclick = () => animateTo((Math.floor(total / 180 + 1e-6) + 1) * 180);
  $("#run").onclick = () => {
    if (running) return stopRun();
    cancelAnimationFrame(anim);
    running = true; last = performance.now();
    $("#run").innerHTML = "&#10074;&#10074; Pause"; $("#run").setAttribute("aria-pressed", "true");
    anim = requestAnimationFrame(runLoop);
  };
  $("#slow").onclick = (e) => { slow = !slow; e.currentTarget.setAttribute("aria-pressed", slow); };
  $("#reset").onclick = () => { stopRun(); cancelAnimationFrame(anim); total = START; A = START; render(); };
  $("#s-steps").onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const k = +b.dataset.k;
    const base = Math.floor(total / 720) * 720 + k * 180;
    animateTo(base + 90 <= total ? base + 720 + 5 : base + 5);
  };

  // dragging
  let drag = null;
  function svgPt(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
  svg.addEventListener("pointerdown", (e) => {
    const h = e.target.closest("[data-drag]"); if (!h) return;
    stopRun(); cancelAnimationFrame(anim);
    svg.setPointerCapture(e.pointerId);
    const p = svgPt(e);
    drag = { kind: h.dataset.drag, ang: Math.atan2(p.x - 520, -(p.y - 250)) * 180 / Math.PI, k: Math.floor(total / 180) };
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const p = svgPt(e);
    if (drag.kind === "flywheel") {
      const a = Math.atan2(p.x - 520, -(p.y - 250)) * 180 / Math.PI;
      let d = a - drag.ang; if (d > 180) d -= 360; if (d < -180) d += 360;
      drag.ang = a;
      setA(Math.max(0, total + d));
    } else {
      // piston: map pointer height to crank angle inside the current stroke
      const pin = Math.max(CY - L - R, Math.min(CY - L + R, p.y + 20));
      const dd = CY - pin;
      const c = Math.max(-1, Math.min(1, (dd * dd - L * L + R * R) / (2 * dd * R)));
      const th = Math.acos(c) * 180 / Math.PI;           // 0 at TDC, 180 at BDC
      let k = Math.floor(total / 180 + 1e-6);
      const down = mod(k * 180) / 180 % 2 === 0;
      let frac = (down ? th : 180 - th) / 180;
      if (frac > 0.97) { setA(Math.max(total, (k + 1) * 180)); return; }
      setA(Math.max(k * 180, k * 180 + frac * 180));
    }
  });
  const end = () => { drag = null; };
  svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);

  render();
})();
