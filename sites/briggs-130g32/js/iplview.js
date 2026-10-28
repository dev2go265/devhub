/* Interactive official IPL diagrams: cropped part pictures, a full-screen viewer, and tappable reference numbers. Needs data.js and ipl.js. */
(function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const D = window.DATA, I = window.IPL;
  const diag = (id) => I.diagrams.find((d) => d.id === id);
  const posOf = (d, ref) => ((I.pos[d] || {})[ref] || [])[0];
  const rowsFor = (d, ref) => I.rows.filter((r) => r[0] === d && r[1] === ref);
  const partsFor = (d, ref) => D.PARTS.filter((p) => p.iplRef && p.iplRef.d === d && p.iplRef.ref === ref);
  const SRC = `From the IPL diagram: official Briggs and Stratton IPL for 130G32-0022-F1 (rev ${I.rev})`;

  // Cropped diagram picture for one part card.
  const HAVE = !!window.IPL_IMAGES;
  const MISSING = (ref, title) => `<p class="small ipl-missing">Official IPL diagram: reference ${esc(ref)} on the "${esc(title)}" drawing. The Briggs and Stratton drawings are copyrighted, so they are only in the offline copy of this site. Look them up at briggsandstratton.com.</p>`;
  function crop(part) {
    if (!part.iplRef) return "";
    if (!HAVE) { const g0 = diag(part.iplRef.d); return g0 ? MISSING(part.iplRef.ref, g0.title) : ""; }
    const { d, ref } = part.iplRef, g = diag(d), p = posOf(d, ref);
    if (!g || !p) return "";
    const W = 600, H = 450, cx = p[0] * g.w, cy = p[1] * g.h;
    const x = Math.max(0, Math.min(g.w - W, cx - W / 2)), y = Math.max(0, Math.min(g.h - H, cy - H / 2));
    return `<figure class="ipl-crop"><button type="button" class="ipl-open" data-d="${d}" data-ref="${esc(ref)}" aria-label="Enlarge the IPL diagram for ${esc(part.name)}">
      <svg viewBox="${x} ${y} ${W} ${H}" role="img" aria-label="IPL diagram crop, reference ${esc(ref)}"><image href="${g.src}" width="${g.w}" height="${g.h}"/><circle cx="${cx}" cy="${cy}" r="40" class="ipl-ring"/></svg>
      <span class="ipl-badge">Ref ${esc(ref)} &middot; tap to enlarge</span></button>
      <figcaption>${SRC}, reference number ${esc(ref)}.</figcaption></figure>`;
  }
  // Real product photo by part number, when one exists.
  function product(part) {
    const ph = D.PRODUCT_PHOTOS[part.id];
    if (!ph) return "";
    return `<figure class="part-photo"><button type="button" class="photo-open" data-src="${esc(ph.src)}" data-cap="${esc(ph.caption)}" aria-label="Enlarge photo"><img src="${esc(ph.src)}" alt="${esc(ph.caption)}"></button><figcaption>${esc(ph.caption)}. Tap to enlarge.</figcaption></figure>`;
  }

  // Full diagram with tappable refs. Returns the element; onPick(ref) is called when a ref is tapped.
  function render(host, d, ref, onPick, zoom) {
    const g = diag(d);
    if (!HAVE) { host.innerHTML = `<div class="callout">${MISSING(ref || "-", g.title)}<span>The parts list below still works: tap a row to see its official part number and card.</span></div>`; return; }
    const spots = Object.entries(I.pos[d] || {}).flatMap(([r, pts]) => pts.map((pt) => [r, pt]));
    host.innerHTML = `<div class="ipl-scroll"><svg class="ipl-full" viewBox="0 0 ${g.w} ${g.h}" style="width:${(zoom || 1) * 100}%" role="img" aria-label="${esc(g.title)} IPL diagram">
      <image href="${g.src}" width="${g.w}" height="${g.h}"/>
      ${spots.map(([r, [x, y]]) => `<circle class="ipl-spot${r === ref ? " on" : ""}${partsFor(d, r).length ? " has-card" : ""}" data-ref="${esc(r)}" cx="${x * g.w}" cy="${y * g.h}" r="42" tabindex="0" role="button" aria-label="Reference ${esc(r)}"/>`).join("")}
    </svg></div>`;
    host.querySelector("svg").addEventListener("click", (e) => { const c = e.target.closest("[data-ref]"); if (c) onPick(c.dataset.ref); });
    host.querySelector("svg").addEventListener("keydown", (e) => { const c = e.target.closest("[data-ref]"); if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onPick(c.dataset.ref); } });
    if (ref) setTimeout(() => { const on = host.querySelector(".ipl-spot.on"); if (on) on.scrollIntoView({ block: "center", inline: "center" }); }, 60);
  }
  function infoHTML(d, ref) {
    const rows = rowsFor(d, ref), parts = partsFor(d, ref);
    if (!rows.length && !parts.length) return `<b>Reference ${esc(ref)}</b><span>No row for this number in the parts list.</span>`;
    return `<b class="tag">Reference ${esc(ref)}</b>` + rows.map((r) => `<span><b class="mono">${esc(r[2])}</b> ${esc(r[3])}${r[4] ? " (" + esc(r[4]) + ")" : ""}</span>`).join("") +
      parts.map((p) => `<div class="ipl-card"><b>${esc(p.name)}</b> &middot; ${esc(p.plain)}<br>${esc(p.does)}<br><b>When it fails:</b> ${esc(p.fails)}<br><b>Part number:</b> ${esc(p.pn)}<br><b>Remember:</b> ${esc(p.trick)}<br><a href="parts.html#p-${p.id}" data-card="${p.id}">Open the full card</a></div>`).join("");
  }

  // Full-screen viewer.
  let box;
  function open(d, ref) {
    if (!box) {
      box = document.createElement("div");
      box.className = "lightbox"; box.hidden = true;
      box.innerHTML = `<div class="lb-inner" role="dialog" aria-label="IPL diagram viewer"><div class="lb-bar"><b class="lb-title"></b><span class="row"><button class="btn ghost" type="button" data-z="-1">&minus; Zoom</button><button class="btn ghost" type="button" data-z="1">+ Zoom</button><button class="btn" type="button" data-close>Close</button></span></div><div class="lb-body"></div><div class="callout lb-info" aria-live="polite"></div><p class="small lb-src"></p></div>`;
      document.body.appendChild(box);
      box.addEventListener("click", (e) => {
        if (e.target === box || e.target.closest("[data-close]")) close();
        const z = e.target.closest("[data-z]"); if (z) { box.zoom = Math.max(1, Math.min(4, box.zoom + +z.dataset.z * 0.75)); draw(); }
        const c = e.target.closest("[data-card]");
        if (c && document.getElementById("p-" + c.dataset.card)) { e.preventDefault(); close(); const el = document.getElementById("p-" + c.dataset.card); el.scrollIntoView({ behavior: "smooth" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1500); }
      });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && box && !box.hidden) close(); });
    }
    box.d = d; box.ref = ref; box.zoom = window.innerWidth < 700 ? 2 : 1.25; box.photo = null;
    box.hidden = false; document.body.style.overflow = "hidden";
    draw();
  }
  function openPhoto(src, cap) {
    open(null, null);
    box.photo = { src, cap }; draw();
  }
  function draw() {
    const body = box.querySelector(".lb-body");
    if (box.photo) {
      box.querySelector(".lb-title").textContent = box.photo.cap;
      body.innerHTML = `<div class="ipl-scroll"><img src="${esc(box.photo.src)}" alt="${esc(box.photo.cap)}" style="width:${box.zoom * 60}%;display:block;margin:0 auto;background:#fff"></div>`;
      box.querySelector(".lb-info").hidden = true; box.querySelector(".lb-src").textContent = box.photo.cap;
      return;
    }
    if (!box.d) return;
    box.querySelector(".lb-info").hidden = false;
    box.querySelector(".lb-title").textContent = diag(box.d).title;
    box.querySelector(".lb-src").textContent = SRC + ". Tap any reference number.";
    render(body, box.d, box.ref, (r) => { box.ref = r; draw(); }, box.zoom);
    box.querySelector(".lb-info").innerHTML = box.ref ? infoHTML(box.d, box.ref) : "<b>Tap a reference number on the diagram.</b>";
  }
  function close() { box.hidden = true; document.body.style.overflow = ""; }

  document.addEventListener("click", (e) => {
    const b = e.target.closest(".ipl-open"); if (b) { open(b.dataset.d, b.dataset.ref); return; }
    const ph = e.target.closest(".photo-open"); if (ph) openPhoto(ph.dataset.src, ph.dataset.cap);
  });

  // Optional equipment the operator's manual marks "if installed", and the gear reduction group.
  const OPT = /SWITCH, Key|SET, Key|Key Switch|MOTOR, Starter|Starter Motor|ALTERNATOR|Alternator|SWITCH, Rocker|Flat Panel|Oil Sensor|SENSOR, Oil|MODULE, Oil|CAP, Connector|PANEL, Control|Pump Applications|High Altitude/;
  const fit = (r) => (r[0] === "p20" || OPT.test(r[3] + " " + r[4]) ? "optional" : /^\d+[A-Z]$/.test(r[1]) ? "alternate" : "");
  window.IPLV = { HAVE, fit, crop, product, render, infoHTML, open, rowsFor, partsFor, diag };
})();
