/* Shared header, menu, search, progress storage and small helpers. Loaded on every page after data.js. */
(function () {
  const D = window.DATA;

  // ---------- helpers ----------
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  function store(key, val) {
    try {
      if (val === undefined) { const v = localStorage.getItem("b130g32:" + key); return v ? JSON.parse(v) : null; }
      localStorage.setItem("b130g32:" + key, JSON.stringify(val));
    } catch (e) { return null; }
  }

  // ---------- progress ----------
  const DRAG_TOTAL = 16;
  const TRACKS = [
    { cat: "placed", label: "Parts placed on the engine", total: DRAG_TOTAL, href: "diagram.html" },
    { cat: "systems", label: "Systems explored", total: 8, href: "systems.html" },
    { cat: "strokes", label: "Strokes completed", total: 4, href: "stroke.html" },
    { cat: "mic", label: "Micrometer readings passed (goal: 10)", total: 10, href: "micrometer.html" },
    { cat: "quizzes", label: "Quizzes finished", total: 5, href: "quiz.html" },
    { cat: "assembly", label: "Teardown and rebuild", total: 2, href: "assembly.html" },
    { cat: "study", label: "Study guide questions you know", total: 20, href: "study.html" }
  ];
  const Progress = {
    data() { return store("progress") || {}; },
    save(d) { store("progress", d); },
    mark(cat, id, val) {
      const d = this.data(); d[cat] = d[cat] || {};
      const isNew = !(id in d[cat]);
      d[cat][id] = val === undefined ? true : val;
      this.save(d);
      if (isNew && cat !== "visited") {
        const t = TRACKS.find((t) => t.cat === cat);
        if (t) toast("✓ " + t.label + ": " + Math.min(this.count(cat), t.total) + " of " + t.total);
      }
      return isNew;
    },
    has(cat, id) { const d = this.data(); return !!(d[cat] && id in d[cat]); },
    get(cat, id) { const d = this.data(); return d[cat] ? d[cat][id] : undefined; },
    list(cat) { return Object.keys(this.data()[cat] || {}); },
    count(cat) { return this.list(cat).length; },
    clear(cat) { const d = this.data(); delete d[cat]; this.save(d); },
    reset() { this.save({}); },
    pct(cat) { const t = TRACKS.find((t) => t.cat === cat); return t ? Math.min(1, this.count(cat) / t.total) : 0; },
    overall() { return TRACKS.reduce((s, t) => s + this.pct(t.cat), 0) / TRACKS.length; }
  };

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  // ---------- header + nav ----------
  const here = location.pathname.split("/").pop() || "index.html";
  const QUICK = [["study.html", "Study Guide"], ["parts.html", "Parts"], ["engine-3d.html", "3D Engine"], ["systems.html", "Systems"], ["stroke.html", "4-Stroke"], ["micrometer.html", "Micrometer"], ["specs.html", "Specs"], ["quiz.html", "Quiz"]];
  function isCurrent(href) { return href === here || (href === "systems.html" && /^system-/.test(here)); }

  function renderHeader() {
    const h = document.createElement("header");
    h.className = "site-header";
    h.innerHTML = `<div class="bar">
      <a class="brand" href="index.html">130G32 <span>Engine Lab</span></a>
      <nav class="quick-links" aria-label="Main">${QUICK.map(([href, t]) => `<a href="${href}"${isCurrent(href) ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</nav>
      <button class="hdr-btn search" type="button" aria-label="Search the site">&#9906; Search</button>
      <button class="hdr-btn menu" type="button" aria-expanded="false" aria-controls="nav-panel">&#9776; Menu</button>
    </div>`;
    document.body.prepend(h);

    const secs = [...new Set(D.PAGES.map((p) => p.sec))];
    const panel = document.createElement("div");
    panel.className = "nav-panel"; panel.id = "nav-panel"; panel.hidden = true;
    panel.innerHTML = `<div class="sheet" role="dialog" aria-label="Site menu">
      <div class="sheet-head"><h2>Menu</h2><button class="btn ghost close" type="button">Close</button></div>
      ${secs.map((s) => `<div class="nav-sec"><h3>${s}</h3><ul>${D.PAGES.filter((p) => p.sec === s).map((p) => `<li><a href="${p.href}"${isCurrent(p.href) ? ' aria-current="page"' : ""}>${p.title}</a></li>`).join("")}${s === "How it works" ? D.SYSTEMS.map((sy) => `<li><a href="system-${sy.id}.html" style="padding-left:28px;font-weight:400"${here === "system-" + sy.id + ".html" ? ' aria-current="page"' : ""}>${sy.name}</a></li>`).join("") : ""}</ul></div>`).join("")}
    </div>`;
    document.body.appendChild(panel);
    const menuBtn = $(".hdr-btn.menu", h);
    const open = (v) => { panel.hidden = !v; menuBtn.setAttribute("aria-expanded", v); if (v) $(".close", panel).focus(); };
    menuBtn.addEventListener("click", () => open(true));
    $(".close", panel).addEventListener("click", () => open(false));
    panel.addEventListener("click", (e) => { if (e.target === panel) open(false); });

    $(".hdr-btn.search", h).addEventListener("click", openSearch);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { open(false); closeSearch(); }
      if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
    });
  }

  // ---------- search ----------
  let index;
  function buildIndex() {
    if (index) return index;
    index = [];
    D.PAGES.forEach((p) => index.push({ kind: "Page", title: p.title, text: p.desc, href: p.href }));
    D.SYSTEMS.forEach((s) => index.push({ kind: "System", title: s.name, text: s.plain + " " + s.steps.map((x) => x[0]).join(" "), href: `system-${s.id}.html` }));
    D.PARTS.forEach((p) => index.push({ kind: "Part", title: p.name, text: `${p.plain}. ${p.does} ${p.official} ${p.pn}`, href: `parts.html#p-${p.id}` }));
    D.SPECS.forEach((s) => index.push({ kind: "Spec", title: s.name, text: `Standard ${s.std}. Reject ${s.reject}.`, href: `specs.html#s-${s.id}` }));
    D.GLOSSARY.forEach(([t, d]) => index.push({ kind: "Word", title: t, text: d, href: `glossary.html#g-${slug(t)}` }));
    D.TROUBLE.forEach((t) => index.push({ kind: "Problem", title: t.symptom, text: t.causes, href: "troubleshoot.html" }));
    return index;
  }
  function search(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    const words = q.split(/\s+/);
    return buildIndex().map((it) => {
      const t = it.title.toLowerCase(), x = it.text.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (t.includes(w)) score += t.startsWith(w) ? 6 : 4; else if (x.includes(w)) score += 1; else return null;
      }
      return { it, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 30).map((r) => r.it);
  }
  let searchPanel;
  function openSearch() {
    if (!searchPanel) {
      searchPanel = document.createElement("div");
      searchPanel.className = "search-panel";
      searchPanel.innerHTML = `<div class="box" role="dialog" aria-label="Search">
        <label for="site-search">Search parts, words, specs, and pages</label>
        <div class="row"><input id="site-search" type="search" placeholder="Try: flywheel key, surge, 0.708" autocomplete="off"><button class="btn ghost" type="button">Close</button></div>
        <ul class="search-results" aria-live="polite"></ul></div>`;
      document.body.appendChild(searchPanel);
      const inp = $("input", searchPanel), out = $("ul", searchPanel);
      inp.addEventListener("input", () => {
        const r = search(inp.value);
        out.innerHTML = inp.value.trim() && !r.length ? `<li class="small">No matches. Try a shorter word.</li>` :
          r.map((it) => `<li><a href="${it.href}"><span class="kind">${it.kind}</span><b>${esc(it.title)}</b><span class="small">${esc(it.text.slice(0, 120))}</span></a></li>`).join("");
      });
      $("button", searchPanel).addEventListener("click", closeSearch);
      searchPanel.addEventListener("click", (e) => { if (e.target === searchPanel) closeSearch(); });
      out.addEventListener("click", (e) => { if (e.target.closest("a")) closeSearch(); });
    }
    searchPanel.hidden = false;
    $("input", searchPanel).focus();
  }
  function closeSearch() { if (searchPanel) searchPanel.hidden = true; }

  function renderFooter() {
    const f = document.createElement("footer");
    f.className = "site-footer";
    f.innerHTML = `<div><p><b>Made by Dev2go / Matthew Tietjen, for Len\u00e9a Benson.</b></p><p>${esc(D.ENGINE.source)}</p><p>A student learning site. Not made by or connected to Briggs and Stratton. Always follow the official manual and your instructor.</p></div>`;
    document.body.appendChild(f);
  }

  // Scroll to and flash a #hash target after the page builds its content.
  function flashHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const t = document.getElementById(id);
    if (t) { t.scrollIntoView({ block: "start" }); t.classList.add("flash"); setTimeout(() => t.classList.remove("flash"), 1500); }
  }

  // A photo that fails to load shows a clear note instead of an empty box.
  window.addEventListener("error", (e) => {
    const img = e.target;
    if (!img || img.tagName !== "IMG" || !img.closest(".part-photo, .photo-open, .card")) return;
    const note = document.createElement("span");
    note.className = "photo-missing"; note.textContent = "Photo unavailable - see caption";
    img.replaceWith(note);
  }, true);

  window.U = { $, $$, esc, shuffle, pick, slug, store, toast, Progress, TRACKS, DRAG_TOTAL, flashHash };

  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
    Progress.mark("visited", here);
  });
})();
