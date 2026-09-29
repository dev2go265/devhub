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
 *
 * The two entries below are EXAMPLE SITES — replace them with your own.
 */
const SITES = [
  {
    name: "Neon Landing Page",
    description: "Example site: a dark, glowing product landing page for a fictional synth app.",
    folder: "neon-landing-page",
    tags: ["HTML", "CSS", "Example"],
    status: "live",
    dateAdded: "2026-09-28",
    thumb: "sites/neon-landing-page/thumb.png"
  },
  {
    name: "Portfolio Draft",
    description: "Example site: a minimal one-page portfolio layout, still in progress.",
    folder: "portfolio-draft",
    tags: ["HTML", "CSS", "JavaScript", "Example"],
    status: "draft",
    dateAdded: "2026-09-21",
    thumb: null
  }
];
