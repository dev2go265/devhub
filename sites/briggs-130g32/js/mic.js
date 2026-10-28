/* Micrometer page: simulator (drag the thimble), worked examples, vernier examples, practice list. */
(function () {
  const { $, $$, esc, pick, Progress, toast } = U;
  const { micCloseup, micFull, micVernier } = SVGS;

  const parseReading = (s) => {
    s = String(s).trim().replace(/[^\d.]/g, "");
    if (!s) return NaN;
    let v = parseFloat(s);
    if (!s.includes(".") && v >= 1) v = v / 1000;
    return v;
  };
  const f3 = (v) => v.toFixed(3);
  function breakdown(v, base) {
    const N = Math.round(v * 1000);
    const big = Math.floor(N / 100), small = Math.floor((N % 100) / 25), th = N % 25;
    const parts = [];
    if (base) parts.push(`Frame size (1-2 in mic): <b class="mono">${base.toFixed(3)}</b>`);
    parts.push(`Biggest number showing on the sleeve: <b>${big}</b> = <b class="mono">${(big / 10).toFixed(3)}</b>`);
    parts.push(`Small lines past it: <b>${small}</b> &times; 0.025 = <b class="mono">${(small * 0.025).toFixed(3)}</b>`);
    parts.push(`Thimble line on the datum line: <b>${th}</b> = <b class="mono">${(th / 1000).toFixed(3)}</b>`);
    parts.push(`Add them: <b class="mono">${(N / 1000 + (base || 0)).toFixed(3)} in</b>`);
    return parts;
  }

  // ---------- simulator ----------
  const PARTS = [
    { name: "Piston pin", size: 0.708 }, { name: "Intake valve stem", size: 0.213 }, { name: "Exhaust valve stem", size: 0.211 },
    { name: "Cam journal", size: 0.549 }, { name: "MAG journal", size: 0.983 }, { name: "PTO journal", size: 0.984 },
    { name: "Feeler blade stack", size: 0.125 }, { name: "Drill blank", size: 0.375 }
  ];
  let reading = 0.25, mode = "read", target = 0, part = null, passed = Progress.count("mic");
  const full = $("#mic-full"), close = $("#mic-close");

  function draw() {
    full.innerHTML = micFull(reading, mode === "measure" ? part : null);
    close.innerHTML = micCloseup(reading, { highlight: $("#hl").checked });
    $("#passed").textContent = passed + " correct";
  }
  function setReading(v) {
    let min = 0;
    if (mode === "measure" && part) min = part.size;
    const hit = v < min;
    reading = Math.max(min, Math.min(1, v));
    if (hit && mode === "measure") $("#ratchet").textContent = "click click click: the ratchet slips. The spindle is on the part.";
    else if (mode === "measure") $("#ratchet").textContent = "";
    draw();
  }
  function newTask() {
    $("#answer").value = ""; $("#sim-msg").hidden = true;
    if (mode === "read") {
      target = Math.round(Math.random() * 950 + 20) / 1000;
      reading = target;
      $("#task").innerHTML = `<b>Read it:</b> What does this micrometer say? Type it in inches.`;
      $("#answer-row").hidden = false;
    } else if (mode === "set") {
      target = Math.round(Math.random() * 950 + 20) / 1000;
      reading = 0.5;
      $("#task").innerHTML = `<b>Set it:</b> Turn the thimble until the mic reads <b class="mono">${f3(target)}</b>, then press Check.`;
      $("#answer-row").hidden = true;
    } else {
      part = pick(PARTS);
      reading = Math.min(1, part.size + 0.15);
      target = part.size;
      $("#task").innerHTML = `<b>Measure it:</b> Close the mic on the <b>${esc(part.name)}</b> until the ratchet clicks. Then read it.`;
      $("#answer-row").hidden = false;
    }
    $("#ratchet").textContent = "";
    draw();
  }
  function check() {
    let ok, given;
    if (mode === "set") { given = reading; ok = Math.abs(reading - target) < 0.0005; }
    else {
      given = parseReading($("#answer").value);
      if (isNaN(given)) { feedback("warn", "Type a number", "Example: 0.708"); return; }
      if (mode === "measure" && reading - part.size > 0.0006) { feedback("warn", "Not touching yet", "Keep closing the thimble until the spindle stops on the part and the ratchet clicks."); return; }
      ok = Math.abs(given - target) < 0.0005;
    }
    if (ok) {
      passed++;
      Progress.mark("mic", "sim-" + Date.now());
      feedback("good", "Correct: " + f3(target) + " in", breakdown(target).join("<br>"));
    } else {
      const N = Math.round(target * 1000), G = Math.round(given * 1000);
      let hint = "";
      const d = Math.abs(N - G);
      if (d === 25 || d === 50 || d === 75) hint = "You are off by small sleeve lines. Count each little line as 0.025.";
      else if (d % 100 === 0) hint = "You read the wrong big number on the sleeve. Use the last number you can see left of the thimble.";
      else if (d < 25) hint = "The sleeve part is right. Recheck which thimble line lines up with the datum line.";
      feedback("bad", mode === "set" ? `You set ${f3(given)}` : `Not quite: you said ${isNaN(given) ? "?" : f3(given)}`, (hint ? `<b>${hint}</b><br>` : "") + "Correct reading: <b class='mono'>" + f3(target) + "</b><br>" + breakdown(target).join("<br>"));
    }
    draw();
  }
  function feedback(kind, title, html) { const m = $("#sim-msg"); m.hidden = false; m.className = "callout " + kind; m.innerHTML = `<b class="tag">${title}</b><span>${html}</span>`; }

  if (full) {
    $$("#modes button").forEach((b) => b.onclick = () => { mode = b.dataset.mode; $$("#modes button").forEach((x) => x.setAttribute("aria-pressed", x === b)); newTask(); });
    $("#check").onclick = check;
    $("#answer").addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
    $("#new").onclick = newTask;
    $("#hl").onchange = draw;
    $$("[data-step]").forEach((b) => b.onclick = () => setReading(reading + parseFloat(b.dataset.step)));
    // drag on the full mic: horizontal
    let d = null;
    const pt = (svg, e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
    full.addEventListener("pointerdown", (e) => { const svg = full.querySelector("svg"); d = { svg, x: pt(svg, e).x, r: reading }; full.setPointerCapture(e.pointerId); });
    full.addEventListener("pointermove", (e) => { if (!d) return; setReading(d.r + (pt(d.svg, e).x - d.x) / 200); });
    // drag on the close-up thimble: vertical, fine
    close.addEventListener("pointerdown", (e) => { const svg = close.querySelector("svg"); d = { svg, y: pt(svg, e).y, r: reading, fine: true }; close.setPointerCapture(e.pointerId); });
    close.addEventListener("pointermove", (e) => { if (!d || !d.fine) return; const dy = pt(d.svg, e).y - d.y; setReading(d.r + dy / 16.6 / 1000); });
    const up = () => { if (d && mode === "set") reading = Math.round(reading * 1000) / 1000; d = null; draw(); };
    full.addEventListener("pointerup", up); close.addEventListener("pointerup", up);
    full.addEventListener("pointercancel", up); close.addEventListener("pointercancel", up);
    newTask();
  }

  // ---------- worked examples ----------
  const EX = [[0.178, "Piston ring stack"], [0.250, "Quarter inch"], [0.708, "Piston pin (standard 0.708)"], [0.214, "Intake valve stem (standard 0.214)"], [0.550, "Cam journal (standard 0.550)"], [0.984, "MAG journal (standard 0.984)"], [1.181, "Crank pin journal on a 1-2 in mic"]];
  const ex = $("#examples");
  if (ex) ex.innerHTML = EX.map(([v, label]) => {
    const base = v >= 1 ? 1 : 0;
    return `<div class="card"><h3>${esc(label)}</h3>${micCloseup(v - base, { highlight: true, note: base ? "On a 1-2 in micrometer, the scale starts at 1.000" : undefined })}<ol class="small" style="margin:0;padding-left:1.3em">${breakdown(v - base, base).map((x) => `<li>${x}</li>`).join("")}</ol></div>`;
  }).join("");

  // ---------- vernier examples ----------
  const vx = $("#vernier-ex");
  if (vx) vx.innerHTML = [[0.2143, "Intake valve stem"], [0.7083, "Piston pin"]].map(([v, label]) => {
    const thou = Math.floor(v * 1000) / 1000, tenth = Math.round(v * 10000) % 10;
    return `<div class="card"><h3>${label}: ${v.toFixed(4)} in</h3>${micCloseup(thou, { highlight: true, note: "Step 1: read the normal way" })}${micVernier(v)}
      <ol class="small" style="margin:0;padding-left:1.3em"><li>Normal reading (sleeve + thimble): <b class="mono">${thou.toFixed(3)}</b></li><li>Find the vernier line that lines up exactly with a thimble line: <b>${tenth}</b></li><li>That number is ten-thousandths: <b class="mono">0.000${tenth}</b></li><li>Add: <b class="mono">${v.toFixed(4)} in</b></li></ol></div>`;
  }).join("");

  // ---------- practice list ----------
  const PR = [0.708, 0.984, 0.550, 0.214, 0.215, 0.217, 0.709, 0.982, 0.548, 0.208, 0.210, 0.551, 0.553, 0.711, 0.707, 0.220, 0.125, 0.363, 0.047, 0.899, 1.181, 1.183];
  const pl = $("#practice");
  if (pl) {
    pl.innerHTML = PR.map((v, i) => {
      const base = v >= 1 ? 1 : 0;
      return `<div class="card practice-item" data-v="${v}"><h3>Reading ${i + 1}${base ? " (1-2 in mic)" : ""}</h3>${micCloseup(v - base, { note: base ? "1-2 in micrometer: add 1.000 to what you read" : "Read the sleeve, then the thimble, then add." })}
        <label for="pr-${i}">Your reading (in)</label><div class="row"><input id="pr-${i}" type="text" inputmode="decimal" placeholder="0.000"><button class="btn" type="button" data-act="check">Check</button><button class="btn ghost" type="button" data-act="show">Show answer</button></div>
        <div class="callout" hidden></div></div>`;
    }).join("");
    pl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]"); if (!b) return;
      const card = b.closest(".practice-item"), v = +card.dataset.v, out = card.querySelector(".callout");
      const base = v >= 1 ? 1 : 0;
      out.hidden = false;
      if (b.dataset.act === "show") { out.className = "callout"; out.innerHTML = `<b class="answer">${f3(v)} in</b><span class="small">${breakdown(v - base, base).join("<br>")}</span>`; return; }
      const g = parseReading(card.querySelector("input").value);
      if (isNaN(g)) { out.className = "callout warn"; out.innerHTML = "Type your reading first, like 0.708"; return; }
      if (Math.abs(g - v) < 0.0005) {
        out.className = "callout good"; out.innerHTML = `<b class="tag">Correct: ${f3(v)} in</b>`;
        if (!card.dataset.passed) { card.dataset.passed = 1; Progress.mark("mic", "pr-" + v); }
      } else { out.className = "callout bad"; out.innerHTML = `<b class="tag">Not quite</b><span>Correct: <b class="mono">${f3(v)}</b>.<br>${breakdown(v - base, base).join("<br>")}</span>`; }
    });
  }

  // ---------- labeled parts drawing ----------
  const lp = $("#mic-parts");
  if (lp) lp.innerHTML = micFull(0.4);
})();
