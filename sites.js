/*
 * DevHub site registry — the only file you edit to add a site.
 *
 * Each entry:
 *   name        Display name on the card.
 *   description One line shown under the name.
 *   folder      Folder name inside /sites/ (the card links to /sites/<folder>/).
 *   tags        Tech tags, e.g. ["HTML", "CSS"]. Searchable.
 *   status      "live" or "draft".
 *   dateAdded   "YYYY-MM-DD". Drives the Newest/Oldest sort and "Latest" stat.
 *   thumb       Path to a preview image, e.g. "sites/<folder>/thumb.png",
 *               or null to show a gradient placeholder with the site's initial.
 */
const SITES = [
  {
    name: "Essence",
    description: "An interactive field guide to making perfume and cologne at home, from first batch to first sale.",
    folder: "essence",
    tags: ["HTML", "CSS", "JS", "Three.js", "GSAP"],
    status: "live",
    dateAdded: "2026-09-28",
    thumb: "sites/essence/thumb.png"
  },
  {
    name: "The Devs2Go Story",
    description: "How a flopped Discord server became a one-person web studio with bigger plans.",
    folder: "devs2go-story",
    tags: ["HTML", "CSS", "JS", "Three.js", "GSAP", "Lenis"],
    status: "live",
    dateAdded: "2026-09-29",
    thumb: "sites/devs2go-story/thumb.png"
  },
  {
    name: "130G32 Engine Lab",
    description: "Hands-on small engines site for the Briggs and Stratton 130G32: parts, IPL diagrams, 4-stroke simulator, micrometer practice, and a 3D teardown. Made for Len\u00e9a Benson.",
    folder: "briggs-130g32",
    tags: ["HTML", "CSS", "JS", "Three.js", "SVG"],
    status: "draft",
    dateAdded: "2026-10-28",
    thumb: "sites/briggs-130g32/thumb.png"
  },
  {
    name: "Derby City Blades — V1 Dark Forge",
    description: "Handmade fixed-blade and EDC knives in Louisville, Kentucky. Dark forge design option.",
    folder: "derby-v1-dark-forge",
    tags: ["HTML", "CSS", "JS"],
    status: "draft",
    dateAdded: "2026-11-05",
    thumb: "sites/derby-v1-dark-forge/thumb.png"
  },
  {
    name: "Derby City Blades — V2 Light Editorial",
    description: "Handmade fixed-blade and EDC knives in Louisville, Kentucky. Light editorial design option.",
    folder: "derby-v2-light-editorial",
    tags: ["HTML", "CSS", "JS"],
    status: "draft",
    dateAdded: "2026-11-05",
    thumb: "sites/derby-v2-light-editorial/thumb.png"
  },
  {
    name: "Derby City Blades — V3 Forge Industrial",
    description: "Handmade fixed-blade and EDC knives in Louisville, Kentucky. Forge industrial design option.",
    folder: "derby-v3-forge-industrial",
    tags: ["HTML", "CSS", "JS"],
    status: "draft",
    dateAdded: "2026-11-05",
    thumb: "sites/derby-v3-forge-industrial/thumb.png"
  },
  {
    name: "Derby City Blades — Original",
    description: "The live Derby City Blades site, as it stands now.",
    folder: "derby-current-live",
    tags: ["HTML", "CSS", "JS"],
    status: "draft",
    dateAdded: "2026-11-05",
    thumb: "sites/derby-current-live/thumb.png"
  },
  {
    name: "Derby City Blades",
    description: "Handmade fixed-blade and EDC knives in Louisville, Kentucky.",
    folder: "derby-city-blades",
    tags: ["HTML", "CSS", "JS"],
    status: "draft",
    dateAdded: "2026-11-02",
    thumb: null
  }
];


