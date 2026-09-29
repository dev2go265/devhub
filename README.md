# DevHub

A control panel homepage for all my test websites. Plain HTML, CSS and JS. No framework, no build step.

## Structure

```
devhub/
├── index.html          Control panel homepage
├── sites.js            Site registry: the only file to edit when adding a site
├── css/style.css       Homepage styles
├── js/app.js           Renders cards, stats, search, filter and sort from sites.js
└── sites/
    ├── neon-landing-page/   Example site (replace)
    └── portfolio-draft/     Example site (replace)
```

Each site in `sites/<site-name>/` is self-contained, with its own `index.html`, CSS and JS. Clicking a card loads `/sites/<site-name>/` as a normal page.

## Add a site

1. Create `sites/<site-name>/` with an `index.html` (and any assets, using relative paths).
2. Optional: add `sites/<site-name>/thumb.png` (16:10 works best). If there isn't one, the card shows the site's initial on a pastel gradient.
3. Add one entry to the `SITES` array in `sites.js`:

   ```js
   {
     name: "Weather App",
     description: "Five-day forecast with animated icons.",
     folder: "weather-app",
     tags: ["HTML", "CSS", "API"],
     status: "draft",          // "live" or "draft"
     dateAdded: "2026-10-01",  // YYYY-MM-DD
     thumb: "sites/weather-app/thumb.png"  // or null
   }
   ```

That's it. Stats, the "Open latest" button, search, filters and sorting all update from that file.

## Run locally

From the project folder:

```sh
python3 -m http.server 8765
```

Then open http://localhost:8765. Use a local server, not `file://`: folder links like `sites/foo/` only resolve to `index.html` when a server is running.

## Deploy to Vercel

```sh
npm i -g vercel
vercel login
cd /Volumes/MATT_APFS/Projects/devhub
vercel --prod
```

On the first run, `vercel` asks a few setup questions. Accept the defaults: link to a new project, keep `./` as the directory, and don't override any build settings. Vercel detects a static site and serves the files as they are.

No `vercel.json` is needed. Vercel serves `index.html` for any folder URL, so `/sites/<site-name>/` works automatically.

## Replacing the examples

Delete `sites/neon-landing-page/` and `sites/portfolio-draft/`, and remove their two entries from `sites.js`.
