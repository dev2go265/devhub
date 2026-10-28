/* Renders one engine-system page. The page sets <body data-system="fuel"> etc. */
(function () {
  const { $, $$, esc, Progress } = U;
  const D = DATA;
  const id = document.body.dataset.system;
  const sys = D.SYSTEMS.find((s) => s.id === id);
  const idx = D.SYSTEMS.indexOf(sys);
  const main = $("main");

  main.innerHTML = `
  <header class="page-head">
    <p class="eyebrow">Systems &middot; ${idx + 1} of ${D.SYSTEMS.length}</p>
    <h1>${esc(sys.name)}</h1>
    <p class="lead">${esc(sys.plain)}. Press Play, or step through it yourself.</p>
  </header>
  <section class="station">
    <div class="row">
      <button class="btn big" type="button" id="play">&#9654; Play the flow</button>
      <button class="btn ghost" type="button" id="prev">&#8592; Back</button>
      <button class="btn ghost" type="button" id="next">Next step &#8594;</button>
      <span class="chip" id="stepn"></span>
    </div>
    <ol class="flow" id="flow"></ol>
    <div class="callout" id="detail" aria-live="polite"></div>
  </section>
  <section class="station" id="widget-sec" hidden></section>
  <section class="station">
    <header><h2>Break it: if this system fails, you will see...</h2><p>Tap a problem to see the symptom and the likely cause.</p></header>
    <div class="grid" id="fails"></div>
  </section>
  <nav class="row" aria-label="Other systems">
    ${idx > 0 ? `<a class="btn ghost" href="system-${D.SYSTEMS[idx - 1].id}.html">&#8592; ${esc(D.SYSTEMS[idx - 1].name)}</a>` : `<a class="btn ghost" href="systems.html">All systems</a>`}
    ${idx < D.SYSTEMS.length - 1 ? `<a class="btn" href="system-${D.SYSTEMS[idx + 1].id}.html">${esc(D.SYSTEMS[idx + 1].name)} &#8594;</a>` : `<a class="btn" href="stroke.html">Next: 4-Stroke Cycle &#8594;</a>`}
  </nav>`;

  const style = document.createElement("style");
  style.textContent = `.flow{list-style:none;margin:0;padding:0;display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(min(200px,100%),1fr));counter-reset:f}
  .flow li{counter-increment:f;position:relative}
  .flow button{width:100%;min-height:84px;text-align:left;border-radius:12px;border:3px solid var(--line);background:var(--bg);color:var(--ink);font:700 1.1rem var(--font-body);padding:12px 14px 12px 54px;cursor:pointer;position:relative}
  .flow button::before{content:counter(f);position:absolute;left:12px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:var(--surface-2);display:grid;place-items:center;font-family:var(--font-display);font-size:1.2rem}
  .flow button.seen{border-color:var(--good)}
  .flow button.seen::before{background:var(--good-bg);color:var(--good)}
  .flow button.cur{border-color:var(--hot);background:var(--warn-bg);box-shadow:0 0 0 3px var(--hot)}
  .flow button.cur::before{background:var(--hot);color:#fff}
  .fail-btn{min-height:var(--tap);text-align:left;border-radius:10px;border:2px solid var(--bad);background:var(--bg);color:var(--ink);font:700 1.05rem var(--font-body);padding:12px 14px;cursor:pointer;width:100%}
  .fail-btn[aria-expanded="true"]{background:var(--bad-bg)}`;
  document.head.appendChild(style);

  let cur = -1, timer = null;
  const seen = new Set();
  $("#flow").innerHTML = sys.steps.map(([t], i) => `<li><button type="button" data-i="${i}">${esc(t)}</button></li>`).join("");
  function go(i) {
    cur = Math.max(0, Math.min(sys.steps.length - 1, i));
    seen.add(cur);
    $$("#flow button").forEach((b, j) => { b.classList.toggle("cur", j === cur); b.classList.toggle("seen", seen.has(j)); });
    const [t, d] = sys.steps[cur];
    $("#detail").className = "callout warn";
    $("#detail").innerHTML = `<b class="tag">Step ${cur + 1}: ${esc(t)}</b><span>${esc(d)}</span>`;
    $("#stepn").textContent = `Step ${cur + 1} of ${sys.steps.length}`;
    if (seen.size === sys.steps.length) Progress.mark("systems", sys.id);
  }
  function stop() { clearInterval(timer); timer = null; $("#play").innerHTML = "&#9654; Play the flow"; }
  $("#play").onclick = () => {
    if (timer) return stop();
    if (cur >= sys.steps.length - 1) cur = -1;
    go(cur + 1);
    $("#play").innerHTML = "&#10074;&#10074; Pause";
    timer = setInterval(() => { if (cur >= sys.steps.length - 1) return stop(); go(cur + 1); }, 2200);
  };
  $("#next").onclick = () => { stop(); go(cur + 1); };
  $("#prev").onclick = () => { stop(); go(cur - 1); };
  $("#flow").onclick = (e) => { const b = e.target.closest("button"); if (b) { stop(); go(+b.dataset.i); } };
  $("#detail").innerHTML = `<b>Press Play or tap step 1.</b><span>Finish every step to check off this system.</span>`;
  $("#stepn").textContent = `${sys.steps.length} steps`;

  $("#fails").innerHTML = sys.fails.map((f, i) => {
    const m = f.match(/^(.*?)\s*\((.*)\)\s*$/);
    const sym = m ? m[1] : f, cause = m ? m[2] : "";
    return `<div class="card"><button class="fail-btn" type="button" aria-expanded="false" data-i="${i}">&#9888; ${esc(sym)}</button><div hidden class="small"><b>You will see:</b> ${esc(sym)}.${cause ? `<br><b>Likely cause:</b> ${esc(cause)}.` : ""}</div></div>`;
  }).join("");
  $("#fails").onclick = (e) => {
    const b = e.target.closest(".fail-btn"); if (!b) return;
    const open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", open); b.nextElementSibling.hidden = !open;
  };

  // ---------- special widgets ----------
  const W = $("#widget-sec");
  const widgets = { governor: governorSim, ignition: ignitionSim, starting: startSim, cooling: coolingSim, lubrication: lubeSim };
  if (widgets[id]) { W.hidden = false; widgets[id](W); }

  function governorSim(W) {
    W.innerHTML = `<header><h2>Governor simulator</h2><p>Slide the load from light to heavy. Watch the flyweights, the throttle, and the RPM.</p></header>
      <div class="split">
        <div class="diagram-wrap"><svg class="diagram" viewBox="0 0 640 300" id="gov-svg" role="img" aria-label="Governor simulator drawing"></svg></div>
        <div class="panel">
          <label for="load">Load: <span id="load-v">Light</span></label>
          <input type="range" id="load" min="0" max="100" value="10">
          <div class="stroke-readout">
            <div class="readout"><span>RPM (demo)</span><b class="mono" id="rpm">0</b></div>
            <div class="readout"><span>Throttle</span><b class="mono" id="thr">0%</b></div>
          </div>
          <label class="check"><input type="checkbox" id="gov-on" checked> Governor connected</label>
          <div class="callout" id="gov-msg" aria-live="polite"></div>
          <p class="small">Demo numbers only. The real top speed is set by the equipment maker: see the equipment manual.</p>
        </div>
      </div>`;
    const SET = 3000;
    let rpm = 3000, th = 0.53, integ = 0.03, last = performance.now(), msgT = 0;
    const svg = $("#gov-svg");
    function draw() {
      const ang = (-120 + Math.min(rpm, 4500) / 4500 * 240) * Math.PI / 180;
      const fly = Math.max(0, Math.min(55, (rpm / 4000) * 55));
      const plate = (1 - th) * 80;
      let ticks = "";
      for (let v = 0; v <= 4500; v += 500) { const a = (-120 + v / 4500 * 240) * Math.PI / 180; ticks += `<line class="m-tick" x1="${110 + 76 * Math.sin(a)}" y1="${150 - 76 * Math.cos(a)}" x2="${110 + 90 * Math.sin(a)}" y2="${150 - 90 * Math.cos(a)}"/>` + (v % 1000 === 0 ? `<text class="e-text" x="${110 + 60 * Math.sin(a)}" y="${155 - 60 * Math.cos(a)}" text-anchor="middle" style="font-size:12px">${v / 1000}k</text>` : ""); }
      const sa = (-120 + SET / 4500 * 240) * Math.PI / 180;
      svg.innerHTML = `<circle class="e-light" cx="110" cy="150" r="96"/>${ticks}
        <line x1="${110 + 70 * Math.sin(sa)}" y1="${150 - 70 * Math.cos(sa)}" x2="${110 + 96 * Math.sin(sa)}" y2="${150 - 96 * Math.cos(sa)}" stroke="var(--good)" stroke-width="6"/>
        <line x1="110" y1="150" x2="${110 + 80 * Math.sin(ang)}" y2="${150 - 80 * Math.cos(ang)}" stroke="${rpm > 3600 ? "var(--bad)" : "var(--hot)"}" stroke-width="5" stroke-linecap="round"/><circle cx="110" cy="150" r="8" fill="var(--ink)"/>
        <text class="e-text" x="110" y="270" text-anchor="middle">RPM gauge</text>
        <circle class="e-light" cx="330" cy="160" r="54"/><circle class="e-metal-dk" cx="330" cy="160" r="10"/>
        <g transform="rotate(${-fly} 310 160)"><rect class="e-yellow" x="300" y="110" width="14" height="50" rx="4"/></g>
        <g transform="rotate(${fly} 350 160)"><rect class="e-yellow" x="346" y="110" width="14" height="50" rx="4"/></g>
        <text class="e-text" x="330" y="245" text-anchor="middle">Governor gear + flyweights</text>
        <path class="e-line" d="M330 105 V60 H440"/><path class="e-thin" d="M440 60 l8 -8 l8 16 l8 -16 l8 16 l8 -16 l8 8 H520"/>
        <text class="e-text" x="470" y="40" text-anchor="middle">Spring</text>
        <rect class="e-light" x="490" y="100" width="120" height="100" rx="6"/><rect x="500" y="110" width="100" height="80" fill="var(--surface)" stroke="none"/>
        <line x1="550" y1="150" x2="${550 + 40 * Math.sin(plate * Math.PI / 180)}" y2="${150 - 40 * Math.cos(plate * Math.PI / 180)}" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>
        <line x1="550" y1="150" x2="${550 - 40 * Math.sin(plate * Math.PI / 180)}" y2="${150 + 40 * Math.cos(plate * Math.PI / 180)}" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/>
        <path class="e-line" d="M520 60 V100"/>
        <text class="e-text" x="550" y="225" text-anchor="middle">Throttle plate</text>`;
    }
    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const l = $("#load").value / 100;
      if ($("#gov-on").checked) {
        const err = (SET - rpm) / SET;
        integ = Math.max(-0.5, Math.min(0.6, integ + err * dt * 1.2));
        const cmd = Math.max(0.05, Math.min(1, 0.5 + 3 * err + integ));
        th += Math.max(-1.5 * dt, Math.min(1.5 * dt, cmd - th));
      }
      rpm += (6000 * th - rpm - 2700 * l) * 2 * dt;
      rpm = Math.max(0, rpm);
      $("#rpm").textContent = Math.round(rpm);
      $("#thr").textContent = Math.round(th * 100) + "%";
      $("#load-v").textContent = l < 0.25 ? "Light" : l < 0.6 ? "Medium" : l < 0.9 ? "Heavy" : "Very heavy";
      if (now - msgT > 400) {
        msgT = now;
        const m = $("#gov-msg");
        if (!$("#gov-on").checked && rpm > 3600) { m.className = "callout bad"; m.innerHTML = `<b class="tag">Overspeed!</b><span>With no governor, the engine races when the load drops. This can blow it apart. Never run with the governor disconnected.</span>`; }
        else if (!$("#gov-on").checked) { m.className = "callout warn"; m.innerHTML = `<b class="tag">No governor</b><span>The throttle is stuck where it was. Change the load and the RPM wanders away from the set speed.</span>`; }
        else if (rpm < SET - 120) { m.className = "callout warn"; m.innerHTML = `<b class="tag">Load hit: RPM dropped</b><span>Flyweights pull in, the spring wins, and the throttle opens wider to bring the speed back.</span>`; }
        else if (rpm > SET + 120) { m.className = "callout warn"; m.innerHTML = `<b class="tag">Load dropped: RPM rose</b><span>Flyweights swing out, push past the spring, and close the throttle.</span>`; }
        else { m.className = "callout good"; m.innerHTML = `<b class="tag">Holding set speed</b><span>Flyweight push and spring pull are balanced. Throttle at ${Math.round(th * 100)}%.</span>`; }
      }
      draw();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function ignitionSim(W) {
    W.innerHTML = `<header><h2>Spin the flywheel</h2><p>Press and hold the button (or tap Run). Each time the magnet passes the coil, the plug sparks.</p></header>
      <div class="split"><div class="diagram-wrap"><svg class="diagram" viewBox="0 0 520 300" id="ign-svg" role="img" aria-label="Flywheel, magnet, coil and spark plug"></svg></div>
      <div class="panel"><button class="btn big" type="button" id="ign-pull">Pull the rope</button><button class="btn ghost" type="button" id="ign-run" aria-pressed="false">Run engine</button>
      <label class="check"><input type="checkbox" id="ign-kill"> Kill switch ON (grounded)</label>
      <div class="callout" id="ign-msg">Sparks: <b id="ign-n">0</b></div>
      <p class="small">Magnetron fires once every turn of the flywheel. In a 4-stroke engine, every other spark happens at the end of the exhaust stroke and does nothing. That is the "wasted spark".</p></div></div>`;
    let a = 0, v = 0, run = false, sparks = 0, last = performance.now(), flash = 0;
    const svg = $("#ign-svg");
    function draw() {
      const r = a * Math.PI / 180;
      svg.innerHTML = `<circle class="e-metal" cx="160" cy="160" r="110"/><circle class="e-metal-dk" cx="160" cy="160" r="22"/>
        <g transform="rotate(${a} 160 160)"><rect class="e-yellow" x="140" y="52" width="40" height="18" rx="3"/><text class="e-text" x="160" y="90" text-anchor="middle" style="font-size:12px">MAGNETS</text></g>
        <path class="e-metal-dk" d="M110 10 h100 v32 h-20 v-14 h-60 v14 h-20 z"/><text class="e-text" x="160" y="8" text-anchor="middle" style="font-size:13px">COIL</text>
        <path class="e-line" style="stroke-width:5" d="M210 22 C 300 10, 360 40, 400 90"/>
        <rect class="e-light" x="390" y="90" width="26" height="60" rx="4"/><rect class="e-metal-dk" x="395" y="150" width="16" height="22"/>
        ${flash > 0 ? `<path class="s-spark" d="M403 172 l-14 22 l12 -2 l-8 24 l22 -30 l-12 2 l10 -16 z"/>` : ""}
        <text class="e-text" x="403" y="240" text-anchor="middle">Spark plug</text>`;
    }
    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (run) v = 1080; else v *= Math.pow(0.35, dt);
      const before = a;
      a = (a + v * dt) % 360;
      const crossed = v > 30 && (before > a || (before < 360 && a >= 0 && before > 300 && a < 60)) ;
      if (crossed && !$("#ign-kill").checked) { sparks++; flash = 0.12; $("#ign-n").textContent = sparks; }
      flash = Math.max(0, flash - dt);
      if ($("#ign-kill").checked && v > 30) $("#ign-msg").innerHTML = `<b>No spark.</b> The kill switch grounds the coil, so the current goes to ground instead of the plug.`;
      else $("#ign-msg").innerHTML = `Sparks: <b>${sparks}</b>`;
      draw(); requestAnimationFrame(tick);
    }
    $("#ign-pull").onclick = () => { v = 900; };
    $("#ign-run").onclick = (e) => { run = !run; e.currentTarget.setAttribute("aria-pressed", run); };
    requestAnimationFrame(tick);
  }

  function startSim(W) {
    W.innerHTML = `<header><h2>Pull test: auto compression release</h2><p>Pull the rope with the release working and broken. Watch how hard the pull is.</p></header>
      <div class="panel"><label class="check"><input type="checkbox" id="acr" checked> Compression release working</label>
      <button class="btn big" type="button" id="pull">Pull the rope</button>
      <div><b>Pull effort</b><div class="progress" style="height:34px"><i id="effort" style="transition:width .08s"></i></div></div>
      <div class="callout" id="pull-msg" aria-live="polite">Press Pull.</div></div>`;
    $("#pull").onclick = () => {
      const ok = $("#acr").checked;
      let t = 0;
      const bar = $("#effort");
      bar.style.background = ok ? "var(--good)" : "var(--bad)";
      const iv = setInterval(() => {
        t += 0.05;
        const comp = Math.max(0, Math.sin(t * Math.PI * 2.2));
        const e = ok ? 20 + comp * 15 : 20 + Math.pow(comp, 3) * 80;
        bar.style.width = e + "%";
        if (t > 1.5) { clearInterval(iv); bar.style.width = "0%"; }
      }, 40);
      $("#pull-msg").className = "callout " + (ok ? "good" : "bad");
      $("#pull-msg").innerHTML = ok ? "<b>Smooth pull.</b> The release holds the exhaust valve open a crack during cranking, so you are not fighting full compression. Once the engine runs fast, it moves out of the way."
        : "<b>Hard, jerky pull.</b> Full compression pushes back each time. It can yank the rope out of your hand (kickback). Check the compression release on the camshaft and the valve clearance.";
    };
  }

  function coolingSim(W) {
    W.innerHTML = `<header><h2>Clog the fins</h2><p>Slide to pack grass and dirt into the cooling fins. Watch the engine temperature.</p></header>
      <div class="panel"><label for="clog">Fins blocked: <span id="clog-v">0%</span></label><input type="range" id="clog" min="0" max="100" value="0">
      <label class="check"><input type="checkbox" id="housing" checked> Blower housing installed</label>
      <div><b>Engine temperature</b><div class="progress" style="height:34px"><i id="temp"></i></div></div>
      <div class="callout" id="cool-msg" aria-live="polite"></div></div>`;
    function upd() {
      const c = +$("#clog").value, h = $("#housing").checked;
      $("#clog-v").textContent = c + "%";
      const t = Math.min(100, 40 + c * 0.55 + (h ? 0 : 35));
      const bar = $("#temp"); bar.style.width = t + "%"; bar.style.background = t < 65 ? "var(--good)" : t < 85 ? "var(--oil)" : "var(--bad)";
      const m = $("#cool-msg");
      if (t < 65) { m.className = "callout good"; m.innerHTML = "<b>Normal.</b> Air from the flywheel fan flows over clean fins and carries heat away."; }
      else if (t < 85) { m.className = "callout warn"; m.innerHTML = "<b>Running hot.</b> Less air reaches the metal. Power drops and oil thins out."; }
      else { m.className = "callout bad"; m.innerHTML = "<b>Overheating!</b> Expect lost power, dying when hot, a scored piston, or a burned exhaust valve." + (h ? "" : " Never run without the blower housing: the fan's air goes nowhere useful."); }
    }
    $("#clog").oninput = upd; $("#housing").onchange = upd; upd();
  }

  function lubeSim(W) {
    W.innerHTML = `<header><h2>Set the oil level</h2><p>Slide the oil level and see what the splash dipper can do.</p></header>
      <div class="split"><div class="diagram-wrap"><svg class="diagram" viewBox="0 0 400 260" id="lube-svg" role="img" aria-label="Crankcase with oil and dipper"></svg></div>
      <div class="panel"><label for="oil">Oil level: <span id="oil-v"></span></label><input type="range" id="oil" min="0" max="130" value="100">
      <div class="callout" id="lube-msg" aria-live="polite"></div></div></div>`;
    let a = 0;
    function tick() {
      const lvl = +$("#oil").value;
      a = (a + 9) % 360;
      const y = 210 - lvl * 0.9;
      const dx = 200 + 50 * Math.sin(a * Math.PI / 180), dy = 120 + 50 * Math.cos(a * Math.PI / 180);
      const dipY = dy + 40;
      const wet = dipY > y;
      let drops = "";
      if (wet && Math.cos(a * Math.PI / 180) > 0.5) for (let i = 0; i < 8; i++) drops += `<circle cx="${dx + (i - 4) * 18}" cy="${y - 20 - (i % 3) * 20}" r="5" fill="var(--oil)"/>`;
      $("#lube-svg").innerHTML = `<rect class="e-light" x="40" y="20" width="320" height="220" rx="20"/>
        <rect x="44" y="${y}" width="312" height="${236 - y}" fill="var(--oil)" opacity=".8"/>
        <circle class="e-metal-dk" cx="200" cy="120" r="14"/><line x1="200" y1="120" x2="${dx}" y2="${dy}" stroke="var(--ink)" stroke-width="10"/>
        <rect class="e-metal" x="${dx - 22}" y="${dy - 8}" width="44" height="22" rx="6"/><rect class="e-yellow" x="${dx - 4}" y="${dy + 12}" width="8" height="28"/>${drops}
        <text class="e-text" x="200" y="16" text-anchor="middle">Crankcase (side view)</text>`;
      const m = $("#lube-msg");
      $("#oil-v").textContent = lvl < 40 ? "Very low" : lvl < 85 ? "Low" : lvl <= 110 ? "Full (good)" : "Overfilled";
      if (lvl < 40) { m.className = "callout bad"; m.innerHTML = "<b>Dipper misses the oil!</b> No splash means no oil on the rod and crank. The engine will knock and seize."; }
      else if (lvl < 85) { m.className = "callout warn"; m.innerHTML = "<b>Low oil.</b> The dipper barely reaches. Add oil to the FULL mark."; }
      else if (lvl <= 110) { m.className = "callout good"; m.innerHTML = "<b>Just right.</b> The dipper splashes oil all over the inside every turn."; }
      else { m.className = "callout bad"; m.innerHTML = "<b>Overfilled!</b> The crank whips the oil into foam, pressure pushes oil out the breather, and the engine smokes blue."; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
