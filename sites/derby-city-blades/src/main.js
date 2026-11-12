(function () {
  "use strict";

  var config = window.DCB_CONFIG;
  var gallery = window.DCB_GALLERY;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // A .photo-frame always starts out showing its PHOTO TO COME panel. The image is kept
  // invisible until it has actually loaded, and is removed if the file is missing,
  // so a missing photo never shows up as a broken image.
  // With config.useFiller on, a missing photo first tries the same filename in the filler folder.
  function loadPhoto(frame, file, alt, onLoad) {
    if (!file) return;
    var img = document.createElement("img");
    img.alt = alt;
    img.decoding = "async";
    img.loading = "lazy";
    img.addEventListener("load", function () {
      frame.classList.add("has-photo");
      if (onLoad) onLoad();
    });
    img.addEventListener("error", function () {
      if (config.useFiller && !frame.classList.contains("is-filler")) {
        frame.classList.add("is-filler");
        img.alt = "Filler photo - not Derick's work";
        img.src = config.fillerBase + encodeURIComponent(file);
        return;
      }
      frame.classList.remove("is-filler");
      img.remove();
    });
    img.src = config.imageBase + encodeURIComponent(file);
    frame.appendChild(img);
  }

  function photoFrame(item, onLoad) {
    var frame = el("div", "photo-frame");
    frame.appendChild(el("span", "photo-placeholder", "Photo to come"));
    loadPhoto(frame, item.photo, item.name + " - " + item.caption, onLoad);
    return frame;
  }

  function captionBlock(item) {
    var body = el("div", "card-body");
    body.appendChild(el("p", "eyebrow", item.eyebrow));
    body.appendChild(el("h4", "card-title", item.name));
    body.appendChild(el("p", "card-text", item.caption));
    return body;
  }

  function applyConfig() {
    if (config.logo) {
      var brand = document.querySelector("[data-brand]");
      var logo = el("img", "brand-logo");
      logo.src = config.imageBase + encodeURIComponent(config.logo);
      logo.alt = "Derby City Blades";
      brand.replaceChildren(logo);
    }

    document.querySelectorAll("[data-instagram-link]").forEach(function (link) {
      link.href = config.instagram.url;
      link.textContent = "@" + config.instagram.handle;
    });

    var hero = document.querySelector("[data-hero-photo]");
    if (hero) loadPhoto(hero, config.heroPhoto, config.heroPhotoAlt);
  }

  // The count only includes real photos that actually loaded - never filler or missing files.
  function updateCount(sectionEl, countEl) {
    var n = sectionEl.querySelectorAll(".photo-frame.has-photo:not(.is-filler)").length;
    countEl.textContent = n === 0 ? "Photos to come" : n + (n === 1 ? " photo" : " photos");
  }

  function renderSection(section) {
    var sectionEl = el("section", "gallery-section layout-" + section.layout);
    sectionEl.dataset.section = section.title;

    var head = el("div", "gallery-section-head");
    head.appendChild(el("h3", "gallery-section-title", section.title));
    var count = el("p", "gallery-section-count");
    head.appendChild(count);
    sectionEl.appendChild(head);

    var body = el("div", "gallery-section-body");
    var refresh = function () { updateCount(sectionEl, count); };
    gallery.items
      .filter(function (item) { return item.section === section.title; })
      .forEach(function (item) {
        var card = el("article", "card gallery-card");
        card.appendChild(photoFrame(item, refresh));
        card.appendChild(captionBlock(item));
        body.appendChild(card);
      });
    sectionEl.appendChild(body);
    refresh();
    return sectionEl;
  }

  function renderGallery() {
    var filterBar = document.querySelector("[data-filters]");
    var container = document.querySelector("[data-gallery-sections]");
    var sections = gallery.sections.map(renderSection);
    sections.forEach(function (sectionEl) { container.appendChild(sectionEl); });

    var names = ["All"].concat(gallery.sections.map(function (s) { return s.title; }));
    var chips = names.map(function (name) {
      var chip = el("button", "filter-chip", name);
      chip.type = "button";
      chip.dataset.filter = name;
      chip.setAttribute("aria-pressed", String(name === "All"));
      filterBar.appendChild(chip);
      return chip;
    });

    filterBar.addEventListener("click", function (event) {
      var target = event.target.closest(".filter-chip");
      if (!target) return;
      var filter = target.dataset.filter;
      chips.forEach(function (chip) {
        chip.setAttribute("aria-pressed", String(chip === target));
      });
      sections.forEach(function (sectionEl) {
        sectionEl.hidden = filter !== "All" && sectionEl.dataset.section !== filter;
      });
    });
  }

  applyConfig();
  renderGallery();
})();
