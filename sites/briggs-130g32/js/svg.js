/* Simple labeled SVG drawings shared by several pages: the whole engine, the exploded view, and micrometer scales. */
(function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- whole engine: two real-looking views ----------
  // View 1 "front" = PTO end (cylinder leans right, air cleaner + carb left, muffler right, tank on top).
  // View 2 "starter" = flywheel/recoil end (mirror image: muffler left, air cleaner right).
  // Each drawn piece is <g data-part="..."> so pages can highlight, hide or ghost it.
  const CYL_F = 'translate(250 250) rotate(25)';
  const CYL_S = 'translate(262 250) rotate(-25)';
  const fins = (n) => Array.from({ length: n }, (_, i) => `<rect class="e-metal" x="-72" y="${-22 - i * 13}" width="144" height="6" rx="3"/>`).join("");
  const VIEWS = {
    front: {
      title: "PTO end (front)",
      parts: {
        blower: `<rect class="e-shroud" x="55" y="100" width="352" height="340" rx="50"/>`,
        block: `<rect class="e-metal" x="105" y="232" width="250" height="208" rx="26"/><rect class="e-metal-dk" x="78" y="430" width="304" height="22" rx="4"/><circle class="e-hole" cx="98" cy="441" r="5"/><circle class="e-hole" cx="362" cy="441" r="5"/>`,
        cylinder: `<g transform="${CYL_F}"><rect class="e-metal" x="-48" y="-150" width="96" height="152"/>${fins(9)}</g>`,
        head: `<g transform="${CYL_F}"><rect class="e-metal" x="-66" y="-188" width="132" height="42" rx="6"/><path class="e-thin" d="M-60 -176 h120 M-60 -164 h120"/></g>`,
        rcover: `<g transform="${CYL_F}"><rect class="e-metal-dk" x="-56" y="-216" width="112" height="30" rx="12"/><circle class="e-hole" cx="0" cy="-201" r="5"/></g>`,
        plug: `<g transform="${CYL_F}"><rect class="e-metal-dk" x="66" y="-178" width="10" height="16"/><rect class="e-ceramic" x="76" y="-176" width="22" height="12" rx="3"/></g>`,
        plugwire: `<g transform="${CYL_F}"><rect class="e-boot" x="96" y="-180" width="18" height="20" rx="6"/></g><path class="e-wire" d="M418 128 C 440 100, 430 60, 395 40"/>`,
        exhaustpipe: `<path class="e-pipe" d="M368 142 L402 182"/>`,
        muffler: `<rect class="e-metal-dk" x="395" y="160" width="112" height="104" rx="24"/>`,
        heatshield: `<rect class="e-light" x="388" y="148" width="126" height="66" rx="18"/><path class="e-thin" d="M410 160 v42 M430 160 v42 M450 160 v42 M470 160 v42 M490 160 v42"/>`,
        tank: `<rect class="e-tank" x="25" y="25" width="268" height="84" rx="24"/><path class="e-thin" d="M45 90 h228"/>`,
        cap: `<rect class="e-metal-dk" x="75" y="8" width="60" height="22" rx="6"/><path class="e-thin" d="M87 12 v14 M99 12 v14 M111 12 v14 M123 12 v14"/>`,
        shutoff: `<rect class="e-metal-dk" x="200" y="104" width="22" height="14" rx="3"/><path class="e-line" style="stroke-width:4;stroke-linecap:round" d="M222 111 h14"/>`,
        fuelline: `<path class="e-fuel" d="M211 118 Q 214 136 196 138"/>`,
        intake: `<path class="e-metal" d="M194 132 L262 98 L268 112 L196 152 Z"/>`,
        carb: `<rect class="e-metal-dk" x="140" y="118" width="56" height="60" rx="6"/><rect class="e-metal" x="148" y="178" width="40" height="22" rx="9"/>`,
        aircleaner: `<rect class="e-filter" x="8" y="110" width="134" height="118" rx="20"/><path class="e-thin" d="M24 128 h102 M24 210 h102"/><circle class="e-metal-dk" cx="75" cy="169" r="9"/>`,
        govarm: `<path class="e-line" style="stroke-width:6;stroke-linecap:round" d="M112 300 L150 206"/>`,
        linkage: `<path class="e-thin" style="stroke-width:2.5" d="M150 206 L170 192"/>`,
        controls: `<rect class="e-metal-dk" x="38" y="244" width="58" height="30" rx="5"/><path class="e-line" style="stroke-width:5;stroke-linecap:round" d="M90 250 L112 232"/>`,
        cover: `<rect class="e-light" x="125" y="250" width="210" height="178" rx="34"/>` + [[145, 270], [315, 270], [145, 410], [315, 410], [230, 262], [230, 418]].map(([x, y]) => `<circle class="e-hole" cx="${x}" cy="${y}" r="5"/>`).join("") + `<circle class="e-metal" cx="230" cy="340" r="36"/>`,
        crank: `<circle class="e-light" cx="230" cy="340" r="19"/><rect x="226" y="320" width="8" height="8" fill="var(--ink)"/>`,
        oilfill: `<path class="e-metal" d="M140 398 L118 384 L124 374 L146 388 Z"/><rect class="e-yellow" x="96" y="364" width="30" height="20" rx="6" transform="rotate(32 111 374)"/>`,
        drain: `<rect class="e-metal-dk" x="284" y="424" width="22" height="14" rx="3"/>`,
        rockersopen: `<g transform="${CYL_F}"><path class="e-yellow" d="M-44 -206 l34 -8 l3 8 l-34 8 z M10 -214 l34 8 l-3 8 l-34 -8 z"/><circle class="e-metal-dk" cx="-27" cy="-206" r="5"/><circle class="e-metal-dk" cx="27" cy="-206" r="5"/><path class="e-line" style="stroke-width:3" d="M-52 -196 l10 4 l-10 4 l10 4 M42 -196 l10 4 l-10 4 l10 4"/></g>`,
        crankopen: `<rect x="125" y="250" width="210" height="178" rx="34" fill="color-mix(in srgb, var(--ink) 55%, var(--metal))" stroke="var(--ink)" stroke-width="2.5"/><path class="e-metal" d="M230 340 m-58 0 a58 58 0 0 1 116 0 l-30 52 h-56 z"/><circle class="e-light" cx="230" cy="300" r="14"/><circle class="e-light" cx="178" cy="292" r="26"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(0.0 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(22.5 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(45.0 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(67.5 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(90.0 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(112.5 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(135.0 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(157.5 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(180.0 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(202.5 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(225.0 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(247.5 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(270.0 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(292.5 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(315.0 178 292)"/><rect class="e-light" x="175" y="261" width="6" height="7" transform="rotate(337.5 178 292)"/><circle class="e-metal-dk" cx="178" cy="292" r="8"/><circle class="e-light" cx="286" cy="292" r="16"/><rect class="e-light" x="283" y="271" width="6" height="7" transform="rotate(0.0 286 292)"/><rect class="e-light" x="283" y="271" width="6" height="7" transform="rotate(30.0 286 292)"/><rect class="e-light" x="283" y="271" width="6" height="7" transform="rotate(60.0 286 292)"/><rect class="e-light" x="283" y="271" width="6" height="7" transform="rotate(90.0 286 292)"/><rect class="e-light" x="283" y="271" width="6" height="7" transform="rotate(120.0 286 292)"/><rect class="e-light" x="283" y="271" width="6" height="7" transform="rotate(150.0 286 292)"/><rect class="e-light" x="283" y="271" width="6" height="7" transform="rotate(180.0 286 292)"/><rect class="e-light" x="283" y="271" width="6" height="7" transform="rotate(210.0 286 292)"/><rect class="e-light" x="283" y="271" width="6" height="7" transform="rotate(240.0 286 292)"/><rect class="e-light" x="283" y="271" width="6" height="7" transform="rotate(270.0 286 292)"/><rect class="e-light" x="283" y="271" width="6" height="7" transform="rotate(300.0 286 292)"/><rect class="e-light" x="283" y="271" width="6" height="7" transform="rotate(330.0 286 292)"/><circle class="e-metal-dk" cx="286" cy="292" r="5"/>`
      },
      order: ["blower", "block", "cylinder", "head", "rcover", "plug", "plugwire", "exhaustpipe", "muffler", "heatshield", "tank", "cap", "shutoff", "fuelline", "intake", "carb", "aircleaner", "govarm", "linkage", "controls", "cover", "crank", "oilfill", "drain", "rockersopen", "crankopen"]
    },
    starter: {
      title: "Starter end (flywheel side)",
      parts: {
        block: `<rect class="e-metal" x="170" y="430" width="220" height="44" rx="10"/><rect class="e-metal-dk" x="140" y="470" width="280" height="22" rx="4"/>`,
        head: `<g transform="${CYL_S}"><rect class="e-metal" x="-66" y="-188" width="132" height="42" rx="6"/></g>`,
        rcover: `<g transform="${CYL_S}"><rect class="e-metal-dk" x="-56" y="-216" width="112" height="30" rx="12"/></g>`,
        muffler: `<rect class="e-metal-dk" x="16" y="150" width="108" height="104" rx="24"/>`,
        heatshield: `<rect class="e-light" x="10" y="140" width="120" height="62" rx="18"/><path class="e-thin" d="M32 152 v40 M52 152 v40 M72 152 v40 M92 152 v40 M112 152 v40"/>`,
        aircleaner: `<rect class="e-filter" x="420" y="128" width="92" height="116" rx="18"/><path class="e-thin" d="M432 146 h68 M432 226 h68"/>`,
        blower: `<path class="e-shroud" d="M430 330 A150 150 0 0 0 280 180 L150 140 Q110 132 106 172 L130 362 A150 150 0 1 0 430 330 Z"/>`,
        flywheel: `<circle class="e-hidden" cx="280" cy="330" r="128"/>` + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path class="e-hidden" d="M${280 + 104 * Math.cos(a)} ${330 + 104 * Math.sin(a)} L${280 + 124 * Math.cos(a)} ${330 + 124 * Math.sin(a)}"/>`; }).join(""),
        coil: `<rect class="e-hidden" x="168" y="222" width="50" height="28" rx="4"/>`,
        recoil: `<circle class="e-metal" cx="280" cy="330" r="96"/><circle class="e-thin" cx="280" cy="330" r="72"/>` + Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return `<path class="e-line" d="M${280 + 78 * Math.cos(a)} ${330 + 78 * Math.sin(a)} L${280 + 90 * Math.cos(a)} ${330 + 90 * Math.sin(a)}"/>`; }).join("") + `<circle class="e-metal-dk" cx="280" cy="330" r="26"/><path class="e-line" d="M205 196 L192 170"/><rect class="e-handle" x="158" y="150" width="66" height="22" rx="10"/>`,
        tank: `<rect class="e-tank" x="150" y="30" width="290" height="84" rx="24"/>`,
        cap: `<rect class="e-metal-dk" x="360" y="12" width="60" height="22" rx="6"/>`,
        cylinderopen: `<g transform="${CYL_S}"><rect class="e-metal" x="-48" y="-150" width="96" height="152"/>${fins(9)}</g>`,
        flywheelopen: `<circle class="e-metal" cx="280" cy="330" r="126"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(0 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(20 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(40 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(60 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(80 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(100 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(120 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(140 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(160 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(180 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(200 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(220 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(240 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(260 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(280 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(300 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(320 280 330)"/><rect class="e-metal-dk" x="275" y="206" width="10" height="22" rx="2" transform="rotate(340 280 330)"/><circle class="e-light" cx="280" cy="330" r="80"/><circle class="e-metal-dk" cx="280" cy="330" r="30"/><circle class="e-light" cx="280" cy="330" r="12"/><rect x="276" y="300" width="8" height="10" fill="var(--hot)" stroke="var(--ink)" stroke-width="2"/><path class="e-yellow" d="M196 270 A100 100 0 0 1 236 238 L246 254 A80 80 0 0 0 214 280 Z"/>`,
        coilopen: `<path class="e-metal-dk" d="M150 214 h80 v34 h-16 v-20 h-48 v20 h-16 z"/><rect x="170" y="216" width="40" height="18" rx="4" fill="#c9782e" stroke="var(--ink)" stroke-width="2"/><path class="e-wire" d="M190 216 C 190 190, 160 170, 150 150"/>`
      },
      order: ["block", "head", "rcover", "muffler", "heatshield", "aircleaner", "blower", "flywheel", "coil", "recoil", "cylinderopen", "flywheelopen", "coilopen", "tank", "cap"]
    }
  };

  // [layer, text, x, y, anchor, dotX, dotY, partCardId, view]
  const ENGINE_LABELS = [
    ["tank", "Fuel tank", 160, 74, "middle", null, null, "fuel-tank", "front"],
    ["cap", "Fuel cap", 142, 24, "start", null, null, "fuel-cap", "front"],
    ["aircleaner", "Air cleaner", 75, 152, "middle", null, null, "air-cleaner-housing", "front"],
    ["carb", "Carburetor", 168, 220, "middle", 168, 150, "carburetor", "front"],
    ["cylinder", "Cylinder + fins", 284, 190, "middle", null, null, "cooling-fins", "front"],
    ["head", "Cylinder head", 318, 106, "middle", null, null, "cylinder-head", "front"],
    ["rcover", "Rocker cover", 335, 74, "middle", null, null, "rocker-arms", "front"],
    ["plug", "Spark plug", 416, 118, "start", 405, 134, "spark-plug", "front"],
    ["heatshield", "Heat shield", 451, 192, "middle", null, null, "heat-shield", "front"],
    ["muffler", "Muffler", 451, 252, "middle", null, null, "muffler", "front"],
    ["cover", "Crankcase cover", 230, 296, "middle", null, null, "crankcase-cover", "front"],
    ["crank", "PTO shaft (3/4 in)", 230, 392, "middle", 230, 340, "crankshaft", "front"],
    ["govarm", "Governor arm", 6, 338, "start", 120, 282, "governor-arm", "front"],
    ["controls", "Controls", 67, 292, "middle", null, null, "throttle-control", "front"],
    ["oilfill", "Oil fill / dipstick", 6, 474, "start", 108, 374, "dipstick", "front"],
    ["drain", "Drain plug", 318, 474, "start", 295, 438, "oil-drain-plug", "front"],
    ["block", "Crankcase + base", 230, 510, "middle", null, null, "cylinder-block", "front"],
    ["tank", "Fuel tank", 295, 80, "middle", null, null, "fuel-tank", "starter"],
    ["cap", "Fuel cap", 352, 28, "end", null, null, "fuel-cap", "starter"],
    ["recoil", "Recoil starter", 280, 294, "middle", null, null, "recoil-starter", "starter"],
    ["recoil", "Rope handle", 191, 140, "middle", null, null, "starter-rope", "starter"],
    ["coil", "Magnetron coil (under)", 108, 212, "start", 193, 236, "ignition-coil", "starter"],
    ["flywheel", "Flywheel (under)", 280, 442, "middle", null, null, "flywheel", "starter"],
    ["blower", "Blower housing", 512, 476, "end", 372, 438, "blower-housing", "starter"],
    ["muffler", "Muffler", 70, 248, "middle", null, null, "muffler", "starter"],
    ["heatshield", "Heat shield", 70, 176, "middle", null, null, "heat-shield", "starter"],
    ["aircleaner", "Air cleaner", 466, 190, "middle", null, null, "air-cleaner-housing", "starter"],
    ["block", "Crankcase + base", 280, 512, "middle", null, null, "cylinder-block", "starter"],
    ["flywheelopen", "Flywheel", 280, 442, "middle", null, null, "flywheel", "starter"],
    ["flywheelopen", "Fan fins", 404, 236, "start", 372, 250, "flywheel-fan", "starter"],
    ["flywheelopen", "Magnet", 168, 272, "end", 214, 262, "flywheel-magnets", "starter"],
    ["flywheelopen", "Flywheel key", 300, 296, "start", 280, 305, "flywheel-key", "starter"],
    ["coilopen", "Magnetron coil", 108, 200, "start", 190, 225, "ignition-coil", "starter"],
    ["rockersopen", "Rocker arms + springs", 335, 74, "middle", null, null, "rocker-arms", "front"],
    ["crankopen", "Crankshaft", 230, 356, "middle", null, null, "crankshaft", "front"],
    ["crankopen", "Cam gear", 178, 248, "middle", 178, 292, "camshaft", "front"],
    ["crankopen", "Governor gear", 300, 248, "middle", 286, 292, "governor-gear", "front"]
  ];

  function engineSVG(opts) {
    opts = opts || {};
    const labels = opts.labels !== false;
    const extra = opts.extra || {};
    return `<div class="engine-views">${Object.entries(VIEWS).map(([vid, v]) => {
      // parts ending in "open" are what you see after a cover comes off; hidden until then
      const hid = (k) => (k.endsWith("open") ? ' style="display:none"' : "");
      const parts = v.order.map((k) => `<g class="e-part" data-part="${k}"${hid(k)}>${v.parts[k]}</g>`).join("");
      const lab = labels ? `<g class="e-labels">${ENGINE_LABELS.filter((l) => l[8] === vid).map(([k, t, x, y, a, dx, dy, card]) =>
        `<g data-label="${k}" data-card="${card}"${hid(k)}>${dx != null ? `<circle class="e-dot" cx="${dx}" cy="${dy}" r="5"/>` : ""}<text class="e-label" x="${x}" y="${y}" text-anchor="${a}">${esc(t)}</text></g>`).join("")}</g>` : "";
      return `<figure class="engine-view" data-view="${vid}"><figcaption>${esc(v.title)}</figcaption>
        <svg class="diagram" viewBox="-8 -8 536 538" role="img" aria-label="${esc((opts.aria || "130G32 engine") + ", " + v.title)}">${parts}${lab}${extra[vid] || ""}</svg></figure>`;
    }).join("")}</div>`;
  }

  // ---------- exploded view (viewBox 0 0 920 640) ----------
  // [partId, svg, labelX, labelY, anchor]
  const EX = [
    ["rocker-arms", `<path class="e-metal-dk" d="M280 52 l50 -10 l4 10 l-50 10 z M350 42 l50 10 l-4 10 l-50 -10 z"/><circle class="e-yellow" cx="320" cy="48" r="5"/><circle class="e-yellow" cx="360" cy="48" r="5"/>`, 420, 50, "start"],
    ["valve-springs", `<path class="e-line" d="M285 75 l14 6 l-14 6 l14 6 l-14 6 l14 6 M375 75 l14 6 l-14 6 l14 6 l-14 6 l14 6"/>`, 420, 92, "start"],
    ["retainers", `<rect class="e-metal" x="280" y="66" width="24" height="6" rx="2"/><rect class="e-metal" x="370" y="66" width="24" height="6" rx="2"/>`, 420, 72, "start"],
    ["cylinder-head", `<rect class="e-metal" x="250" y="115" width="170" height="44" rx="4"/><path class="e-thin" d="M258 126 h154 M258 148 h154"/>`, 430, 142, "start"],
    ["intake-valve", `<path class="e-light" d="M290 170 v46 l-16 10 h36 l-16 -10 z" stroke="var(--ink)" stroke-width="2.5"/>`, 270, 215, "end"],
    ["exhaust-valve", `<path class="e-metal" d="M380 170 v46 l-16 10 h36 l-16 -10 z"/>`, 430, 215, "start"],
    ["head-gasket", `<rect class="e-yellow" x="252" y="240" width="166" height="8" rx="2"/>`, 430, 250, "start"],
    ["cylinder-block", `<rect class="e-metal" x="240" y="262" width="190" height="104" rx="6"/>` + [270, 284, 298, 312, 326].map((y) => `<rect class="e-metal" x="228" y="${y}" width="214" height="6" rx="3"/>`).join(""), 450, 300, "start"],
    ["sleeve", `<rect class="e-metal-dk" x="295" y="262" width="80" height="104"/>`, 335, 356, "middle"],
    ["ring-top", `<ellipse class="e-line" cx="195" cy="384" rx="34" ry="7" style="stroke-width:3"/>`, 156, 388, "end"],
    ["ring-middle", `<ellipse class="e-line" cx="195" cy="402" rx="34" ry="7" style="stroke-width:3"/>`, 156, 406, "end"],
    ["ring-bottom", `<ellipse class="e-line" cx="195" cy="420" rx="34" ry="7" style="stroke-width:5"/>`, 156, 424, "end"],
    ["piston", `<rect class="e-light" x="300" y="378" width="70" height="56" rx="6"/><path class="e-thin" d="M300 388 h70 M300 396 h70 M300 404 h70"/>`, 335, 452, "middle"],
    ["piston-pin", `<rect class="e-metal" x="390" y="400" width="60" height="14" rx="6"/>`, 460, 412, "start"],
    ["connecting-rod", `<circle class="e-light" cx="335" cy="470" r="12"/><path class="e-light" d="M327 480 L320 520 h30 L343 480 z" stroke="var(--ink)" stroke-width="2.5"/><path class="e-light" d="M305 520 h60 a30 16 0 0 1 -60 0 z" stroke="var(--ink)" stroke-width="2.5"/>`, 380, 500, "start"],
    ["splash-dipper", `<path class="e-yellow" d="M352 548 l14 22 l-8 2 l-12 -20 z"/>`, 380, 552, "start"],
    ["rod-cap", `<path class="e-metal" d="M305 540 h60 a30 16 0 0 1 -60 0 z"/>`, 270, 548, "end"],
    ["rod-bolts", `<rect class="e-metal-dk" x="306" y="560" width="8" height="20"/><rect class="e-metal-dk" x="356" y="560" width="8" height="20"/>`, 262, 574, "end"],
    ["crankshaft", `<rect class="e-light" x="150" y="600" width="390" height="18" rx="4"/><rect class="e-metal" x="300" y="588" width="70" height="40" rx="6"/>`, 545, 614, "start"],
    ["mag-journal", `<rect class="e-metal-dk" x="200" y="600" width="40" height="18"/>`, 175, 640, "middle"],
    ["crank-pin-journal", `<rect class="e-metal-dk" x="320" y="592" width="30" height="10"/>`, 335, 584, "middle"],
    ["pto-journal", `<rect class="e-metal-dk" x="440" y="600" width="40" height="18"/>`, 470, 640, "middle"],
    ["push-rods", `<path class="e-line" style="stroke-width:4" d="M560 80 v170 M590 80 v170"/>`, 600, 120, "start"],
    ["tappets", `<rect class="e-metal" x="550" y="256" width="20" height="18" rx="3"/><rect class="e-metal" x="580" y="256" width="20" height="18" rx="3"/>`, 610, 270, "start"],
    ["camshaft", `<rect class="e-light" x="520" y="300" width="170" height="12" rx="4"/><circle class="e-metal" cx="520" cy="306" r="26"/>`, 700, 310, "start"],
    ["cam-lobes", `<ellipse class="e-metal-dk" cx="575" cy="300" rx="10" ry="16"/><ellipse class="e-metal-dk" cx="605" cy="300" rx="10" ry="16"/>`, 590, 346, "middle"],
    ["cam-journals", `<rect class="e-metal-dk" x="660" y="300" width="26" height="12"/>`, 700, 336, "start"],
    ["governor-gear", `<circle class="e-light" cx="580" cy="400" r="26"/>`, 615, 398, "start"],
    ["governor-flyweights", `<rect class="e-metal-dk" x="566" y="386" width="10" height="16" rx="2"/><rect class="e-metal-dk" x="584" y="398" width="10" height="16" rx="2"/>`, 615, 420, "start"],
    ["crankcase-cover", `<rect class="e-metal-dk" x="560" y="460" width="120" height="90" rx="10"/>`, 690, 500, "start"],
    ["spark-plug", `<rect class="e-light" x="70" y="40" width="22" height="50" rx="4"/><rect class="e-metal-dk" x="74" y="90" width="14" height="16"/>`, 100, 70, "start"],
    ["ignition-coil", `<path class="e-metal-dk" d="M50 140 h70 v40 h-14 v-26 h-42 v26 h-14 z"/>`, 130, 160, "start"],
    ["flywheel", `<circle class="e-metal" cx="95" cy="270" r="62"/><circle class="e-light" cx="95" cy="270" r="16"/>`, 95, 350, "middle"],
    ["flywheel-magnets", `<rect class="e-yellow" x="82" y="210" width="26" height="12" rx="2"/>`, 95, 200, "middle"],
    ["flywheel-key", `<rect class="e-hot" x="140" y="262" width="14" height="8" fill="var(--hot)" stroke="var(--ink)" stroke-width="2"/>`, 160, 276, "start"],
    ["recoil-starter", `<circle class="e-metal-dk" cx="95" cy="430" r="46"/><circle class="e-light" cx="95" cy="430" r="14"/>`, 95, 492, "middle"],
    ["blower-housing", `<rect class="e-light" x="20" y="510" width="140" height="70" rx="20"/>`, 90, 600, "middle"],
    ["carburetor", `<rect class="e-metal-dk" x="770" y="40" width="60" height="58" rx="6"/><rect class="e-metal" x="778" y="98" width="44" height="22" rx="8"/>`, 800, 140, "middle"],
    ["paper-filter", `<rect class="e-filter" x="760" y="160" width="90" height="50" rx="4"/><path class="e-thin" d="M770 160 v50 M782 160 v50 M794 160 v50 M806 160 v50 M818 160 v50 M830 160 v50 M842 160 v50"/>`, 805, 228, "middle"],
    ["pre-cleaner", `<rect class="e-yellow" x="760" y="240" width="90" height="18" rx="6"/>`, 805, 276, "middle"],
    ["fuel-tank", `<rect class="e-tank" x="740" y="300" width="130" height="60" rx="14"/>`, 805, 378, "middle"],
    ["muffler", `<rect class="e-metal-dk" x="740" y="400" width="130" height="56" rx="18"/>`, 805, 474, "middle"],
    ["spark-plug-wire", `<path class="e-line" style="stroke-width:5" d="M81 40 C 70 20, 40 30, 40 130"/>`, 20, 22, "start"]
  ];
  function explodedSVG() {
    return `<svg class="diagram" viewBox="-10 -10 940 670" role="img" aria-label="Exploded diagram of the engine parts. Tap a part to see its card.">
      ${EX.map(([id, shape]) => `<g class="e-part" data-part="${id}" tabindex="0" role="button">${shape}</g>`).join("")}
      ${EX.map(([id, , x, y, a]) => `<text class="e-label" data-for="${id}" x="${x}" y="${y}" text-anchor="${a}" style="font-size:14px">${esc(labelFor(id))}</text>`).join("")}
    </svg>`;
  }
  function labelFor(id) {
    const p = window.DATA.PARTS.find((x) => x.id === id);
    return p ? p.name.replace(/ \(.*\)/, "") : id;
  }

  // ---------- micrometer scales ----------
  // Close-up of the sleeve and thimble. reading is 0..1 in (the part inside the mic's range).
  function micCloseup(reading, opts) {
    opts = opts || {};
    const r = Math.max(0, Math.min(1, reading));
    const EDGE = 340, PX = 1600, DATUM = 120, R = 66;
    const thou = Math.round(r * 10000) / 10;            // thousandths, keep one decimal
    const t = ((thou % 25) + 25) % 25;                  // thimble value 0..25
    let s = `<svg class="diagram mic-closeup" viewBox="0 0 560 240" role="img" aria-label="Micrometer sleeve and thimble${opts.showValue ? " reading " + reading.toFixed(3) : ""}">`;
    s += `<rect x="0" y="0" width="560" height="240" fill="var(--bg)"/>`;
    s += `<rect class="m-sleeve" x="-4" y="92" width="${EDGE + 4}" height="56"/>`;
    s += `<line class="m-datum" x1="0" y1="${DATUM}" x2="${EDGE}" y2="${DATUM}"/>`;
    // sleeve ticks every 0.025
    let lastVisible = null;
    for (let k = 0; k <= 40; k++) {
      const v = k * 0.025;
      const x = EDGE - (r - v) * PX;
      if (x < 4 || x > EDGE + 0.5) continue;
      const major = k % 4 === 0;
      lastVisible = { x, k };
      s += `<line class="${major ? "m-tick-major" : "m-tick"}" x1="${x}" y1="${DATUM}" x2="${x}" y2="${DATUM - (major ? 26 : 14)}"/>`;
      if (major) s += `<text class="m-num" x="${x}" y="${DATUM - 32}" text-anchor="middle">${k / 4 === 10 ? "1" : k / 4}</text>`;
    }
    if (opts.highlight && lastVisible) s += `<line class="m-hl" x1="${lastVisible.x}" y1="${DATUM + 2}" x2="${lastVisible.x}" y2="${DATUM - (lastVisible.k % 4 === 0 ? 28 : 16)}"/>`;
    // thimble body
    s += `<path class="m-thimble" d="M${EDGE} 62 L${EDGE + 14} 48 H548 V192 H${EDGE + 14} L${EDGE} 178 Z"/>`;
    s += `<line class="m-tick" x1="${EDGE + 14}" y1="48" x2="${EDGE + 14}" y2="192" style="stroke-width:1.5"/>`;
    for (let n = 0; n < 25; n++) {
      let d = n - t; if (d > 12.5) d -= 25; if (d <= -12.5) d += 25;
      const phi = d * 2 * Math.PI / 25;
      if (Math.abs(phi) > 1.4) continue;
      const y = DATUM - R * Math.sin(phi);
      const major = n % 5 === 0;
      const hl = opts.highlight && Math.abs(d) < 0.5;
      s += `<line class="${hl ? "m-hl" : major ? "m-tick-major" : "m-tick"}" x1="${EDGE + 1}" y1="${y}" x2="${EDGE + (major ? 34 : 22)}" y2="${y}"/>`;
      if (major) s += `<text class="m-num" x="${EDGE + 44}" y="${y + 7}" style="opacity:${Math.max(0.35, Math.cos(phi)).toFixed(2)}">${n}</text>`;
    }
    s += `<text class="m-note" x="10" y="226">${esc(opts.note || "Sleeve: 0.025 in per line, numbers = 0.100 in. Thimble: 0.001 in per line.")}</text>`;
    s += `</svg>`;
    return s;
  }

  // Flattened vernier view: thimble lines on the right, 10 vernier lines on the sleeve on the left.
  function micVernier(reading) {
    const tenth = Math.round(reading * 10000) % 10;        // 0..9 ten-thousandths
    const thouFloor = Math.floor(Math.round(reading * 10000) / 10) % 25;
    const f = tenth / 10;
    const DATUM = 240, SP = 18;
    let s = `<svg class="diagram mic-closeup" viewBox="0 0 560 280" role="img" aria-label="Vernier scale view">`;
    s += `<rect x="0" y="0" width="560" height="280" fill="var(--bg)"/>`;
    s += `<rect class="m-sleeve" x="120" y="20" width="220" height="236"/>`;
    s += `<path class="m-thimble" d="M340 10 H520 V270 H340 Z"/>`;
    for (let k = 0; k <= 10; k++) {
      const y = DATUM - k * SP * 0.9;
      const aligned = k === tenth;
      s += `<line class="${aligned ? "m-hl" : "m-tick"}" x1="${aligned ? 250 : 280}" y1="${y}" x2="340" y2="${y}"/>`;
      s += `<text class="m-num-sm" x="${aligned ? 242 : 272}" y="${y + 5}" text-anchor="end"${aligned ? ' style="fill:var(--hot)"' : ""}>${k % 10}</text>`;
    }
    for (let d = -1; d <= 13; d++) {
      const n = ((thouFloor + d) % 25 + 25) % 25;
      const y = DATUM - (d - f) * SP;
      if (y < 14 || y > 268) continue;
      const aligned = d === tenth;
      s += `<line class="${aligned ? "m-hl" : n % 5 === 0 ? "m-tick-major" : "m-tick"}" x1="340" y1="${y}" x2="${n % 5 === 0 ? 380 : 366}" y2="${y}"/>`;
      if (n % 5 === 0) s += `<text class="m-num-sm" x="388" y="${y + 5}">${n}</text>`;
    }
    s += `<text class="m-note" x="130" y="14">Vernier lines (on the sleeve)</text>`;
    s += `<text class="m-note" x="400" y="276" text-anchor="middle">Thimble</text></svg>`;
    return s;
  }

  // Whole micrometer for the simulator. gap = reading (0..1 in) * 200 px.
  function micFull(reading, part) {
    const g = Math.max(0, Math.min(1, reading)) * 200;
    const face = 150 + g;
    const edge = 380 + g;
    let s = `<svg class="diagram" viewBox="0 0 880 300" role="img" aria-label="Outside micrometer. Drag the thimble left or right.">`;
    s += `<rect x="0" y="0" width="880" height="300" fill="none"/>`;
    // frame
    s += `<path class="e-metal-dk" d="M90 110 H150 V170 H110 V230 Q110 270 150 270 H330 Q370 270 370 230 V170 H350 V110 H390 V240 Q390 290 330 290 H150 Q90 290 90 240 Z"/>`;
    s += `<text class="e-text" x="240" y="262" text-anchor="middle">FRAME</text>`;
    // anvil
    s += `<rect class="e-light" x="120" y="122" width="30" height="36"/>`;
    // part being measured
    if (part) s += `<rect x="150" y="116" width="${part.size * 200}" height="48" rx="6" fill="color-mix(in srgb, var(--hot) 35%, var(--metal-3))" stroke="var(--ink)" stroke-width="2"/><text class="e-text" x="${150 + part.size * 100}" y="104" text-anchor="middle">${esc(part.name)}</text>`;
    // spindle
    s += `<rect class="e-light" x="${face}" y="126" width="${380 - face + 10}" height="28"/>`;
    // lock nut
    s += `<rect class="e-metal" x="356" y="108" width="20" height="64" rx="4"/>`;
    // sleeve with tiny ticks
    s += `<rect class="m-sleeve" x="376" y="118" width="250" height="44"/><line class="m-datum" x1="376" y1="140" x2="626" y2="140"/>`;
    for (let k = 0; k <= 40; k++) { const x = 380 + k * 5; if (x < edge) s += `<line class="m-tick" x1="${x}" y1="140" x2="${x}" y2="${140 - (k % 4 ? 6 : 12)}" style="stroke-width:1.5"/>`; }
    // thimble (draggable) and ratchet
    s += `<g class="mic-thimble" style="cursor:grab"><path class="m-thimble" d="M${edge} 106 L${edge + 10} 98 H${edge + 150} V182 H${edge + 10} L${edge} 174 Z"/>`;
    for (let i = 1; i < 8; i++) s += `<line class="m-tick" x1="${edge + 20 + i * 15}" y1="104" x2="${edge + 20 + i * 15}" y2="178" style="stroke-width:1;opacity:.5"/>`;
    s += `<rect class="e-metal-dk" x="${edge + 150}" y="116" width="50" height="48" rx="10"/></g>`;
    // labels
    const L = (x, y, t, a) => `<text class="e-label" x="${x}" y="${y}" text-anchor="${a || "middle"}" style="font-size:15px">${t}</text>`;
    s += L(135, 112, "ANVIL") + L(Math.min(face + 40, 330), 196, "SPINDLE") + L(366, 98, "LOCK NUT") + L(470, 196, "SLEEVE") + L(edge + 80, 90, "THIMBLE  ⇔ drag") + L(edge + 175, 186, "RATCHET");
    s += `</svg>`;
    return s;
  }

  window.SVGS = { engineSVG, ENGINE_LABELS, VIEWS, explodedSVG, micCloseup, micVernier, micFull };
})();
