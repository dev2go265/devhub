/* DevHub — renders the control panel from SITES (sites.js). */
(function () {
  "use strict";

  const sites = (typeof SITES !== "undefined" && Array.isArray(SITES)) ? SITES : [];

  const state = { query: "", filter: "all", sort: "newest" };

  const $ = (sel) => document.querySelector(sel);
  const grid = $("#grid");
  const empty = $("#empty");
  const count = $("#result-count");
  const searchInput = $("#search");
  const sortSelect = $("#sort");
  const filterButtons = document.querySelectorAll("[data-filter]");

  // Pastel gradients for thumbnail placeholders, picked per site by name.
  const GRADIENTS = [
    ["#a5b4fc", "#f0abfc"],
    ["#93c5fd", "#6ee7b7"],
    ["#fda4af", "#fcd34d"],
    ["#c4b5fd", "#93c5fd"],
    ["#86efac", "#67e8f9"],
    ["#fdba74", "#f9a8d4"]
  ];

  // ---------- helpers ----------

  // "YYYY-MM-DD" → local Date (avoids the UTC off-by-one from new Date("YYYY-MM-DD")).
  function parseDate(str) {
    const [y, m, d] = String(str).split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function formatDate(str) {
    return parseDate(str).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function siteUrl(site) {
    return "sites/" + encodeURIComponent(site.folder) + "/";
  }

  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "style") node.style.cssText = value;
      else node.setAttribute(key, value);
    }
    (children || []).forEach((child) => child && node.appendChild(child));
    return node;
  }

  function byNewest(a, b) { return parseDate(b.dateAdded) - parseDate(a.dateAdded); }

  // ---------- stats + nav ----------

  function renderStats() {
    const live = sites.filter((s) => s.status === "live").length;
    $("#stat-total").textContent = sites.length;
    $("#stat-live").textContent = live;

    const latest = sites.slice().sort(byNewest)[0];
    const latestLink = $("#stat-latest");
    const openLatest = $("#open-latest");

    if (latest) {
      latestLink.textContent = latest.name;
      latestLink.href = siteUrl(latest);
      $("#stat-latest-date").textContent = "Added " + formatDate(latest.dateAdded);
      openLatest.href = siteUrl(latest);
      openLatest.title = "Open " + latest.name;
    } else {
      latestLink.textContent = "No sites yet";
      $("#stat-latest-date").textContent = "Add one in sites.js";
      openLatest.href = "#sites";
    }
  }

  // ---------- cards ----------

  function thumbPlaceholder(site) {
    const [c1, c2] = GRADIENTS[hash(site.name) % GRADIENTS.length];
    return el("div", {
      class: "thumb-placeholder",
      style: "background: linear-gradient(135deg, " + c1 + ", " + c2 + ");",
      text: site.name.trim().charAt(0).toUpperCase()
    });
  }

  function buildThumb(site) {
    const thumb = el("a", { class: "card-thumb", href: siteUrl(site), tabindex: "-1", "aria-hidden": "true" });

    if (site.thumb) {
      const img = el("img", { src: site.thumb, alt: "", loading: "lazy" });
      // Missing or broken thumb.png falls back to the gradient placeholder.
      img.addEventListener("error", () => img.replaceWith(thumbPlaceholder(site)));
      thumb.appendChild(img);
    } else {
      thumb.appendChild(thumbPlaceholder(site));
    }

    const isLive = site.status === "live";
    thumb.appendChild(el("span", { class: "status-badge" }, [
      el("span", { class: "dot " + (isLive ? "dot-live" : "dot-draft") }),
      document.createTextNode(isLive ? "Live" : "Draft")
    ]));
    return thumb;
  }

  function buildCard(site) {
    const tags = el("div", { class: "tags" }, (site.tags || []).map((tag) =>
      el("button", { type: "button", class: "tag", "data-tag": tag, title: "Show sites tagged " + tag, text: tag })
    ));

    const calendar = el("span", {});
    calendar.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';

    const date = el("span", { class: "card-date" }, [
      calendar.firstChild,
      el("time", { datetime: site.dateAdded, text: formatDate(site.dateAdded) })
    ]);

    const open = el("a", { class: "btn btn-primary btn-sm", href: siteUrl(site), "aria-label": "Open " + site.name }, [
      document.createTextNode("Open "),
      el("span", { "aria-hidden": "true", text: "→" })
    ]);

    return el("article", { class: "card" }, [
      buildThumb(site),
      el("div", { class: "card-body" }, [
        el("h3", { class: "card-title" }, [el("a", { href: siteUrl(site), text: site.name })]),
        el("p", { class: "card-desc", text: site.description || "" }),
        tags,
        el("div", { class: "card-foot" }, [date, open])
      ])
    ]);
  }

  // ---------- filter / sort ----------

  function matches(site) {
    if (state.filter !== "all" && site.status !== state.filter) return false;
    const q = state.query.trim().toLowerCase();
    if (!q) return true;
    if (site.name.toLowerCase().includes(q)) return true;
    return (site.tags || []).some((tag) => tag.toLowerCase().includes(q));
  }

  function sorted(list) {
    const copy = list.slice();
    if (state.sort === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
    else if (state.sort === "oldest") copy.sort((a, b) => -byNewest(a, b));
    else copy.sort(byNewest);
    return copy;
  }

  function render() {
    const visible = sorted(sites.filter(matches));

    grid.replaceChildren(...visible.map(buildCard));
    grid.hidden = visible.length === 0;
    empty.hidden = visible.length !== 0;

    const noun = sites.length === 1 ? "site" : "sites";
    count.textContent = visible.length === sites.length
      ? "Showing all " + sites.length + " " + noun
      : "Showing " + visible.length + " of " + sites.length + " " + noun;
  }

  // ---------- events ----------

  searchInput.addEventListener("input", () => {
    state.query = searchInput.value;
    render();
  });

  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    render();
  });

  function setFilter(value) {
    state.filter = value;
    filterButtons.forEach((btn) => {
      const active = btn.dataset.filter === value;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    render();
  }

  filterButtons.forEach((btn) => btn.addEventListener("click", () => setFilter(btn.dataset.filter)));

  // Clicking a tag on a card searches for that tag.
  grid.addEventListener("click", (event) => {
    const tag = event.target.closest("[data-tag]");
    if (!tag) return;
    searchInput.value = tag.dataset.tag;
    state.query = tag.dataset.tag;
    render();
    searchInput.focus({ preventScroll: true });
  });

  $("#reset").addEventListener("click", () => {
    searchInput.value = "";
    state.query = "";
    setFilter("all");
    searchInput.focus();
  });

  // Mobile menu.
  const menuToggle = $("#menu-toggle");
  const navLinks = $("#nav-links");
  function closeMenu() {
    navLinks.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
  menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.addEventListener("click", (event) => { if (event.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });

  // Nav border once the page scrolls.
  const nav = $(".nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- go ----------
  renderStats();
  render();
})();
