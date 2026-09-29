# DevHub

A personal dev control panel — one homepage for every test website I build, styled like [Devs2Go](https://devs2go.com). Hosted on Vercel.

## How it works

- Each test site lives in its own folder: `sites/<site-name>/` with its own `index.html`.
- `sites.js` is the registry — the homepage renders every card, stat, search, filter, and sort from it.
- Clicking a card opens `/sites/<site-name>/` as its own page inside the deployment.

## Adding a site

1. Create `sites/<site-name>/` (lowercase, hyphens) with an `index.html` inside, plus any CSS/JS it needs. Use relative paths.
2. Optional: drop in a `thumb.png` (16:10 works best). Without one, the card shows a gradient placeholder with the site's initial.
3. Add one entry to the `SITES` array in `sites.js` (name, description, folder, tags, status, dateAdded, thumb).
4. Push to `main` — Vercel deploys automatically.

## Deploy

Connected to the Vercel `devhub` project, linked to this repo. Every push to `main` goes live on its own — no CLI step needed.
