# David Czartoryski · Passport

A travel-themed single-page portfolio. Next.js 16 (App Router, static export),
React 19, Tailwind CSS 4, Motion. No server: `npm run build` writes plain
HTML/JS/CSS to `out/`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000, bound to 0.0.0.0
npm run build      # static export to ./out
```

## How it is put together

```
src/app/                 layout (fonts, metadata), page (section order), globals.css (tokens, keyframes)
src/data/site.ts         ALL copy: profile, flight log, ventures, wrestling, layover, skills, nav
src/data/countries.json  the 23 visited countries (slug, ISO, flag, region, atlas id)
src/data/*.generated.json  built by scripts, do not edit by hand
src/lib/audio-cues.ts    where the song starts and where the buzzer lands
src/components/
  IntroGate.tsx          boarding pass -> alarm clock -> airplane -> reveal
  AlarmClock.tsx         the SVG clock, driven by the song's clock
  AudioProvider.tsx      the one <audio> element, shared by the intro and the nav button
  WorldMap.tsx, Stamp.tsx  outlines rendered from the generated geo data
  sections/              Hero, Passport, FlightLog, Cargo, Mat, Layover, Arrivals
scripts/
  build-geo.mjs          world map + per-country stamp outlines from world-atlas
  build-photos.mjs       raw photos -> public/photos/*.webp + manifest
  build-og.mjs           social share card from art-src/og-bg.png
```

### The intro and the song

`public/audio/theme.mp3` is the theme song. Playback starts at `SONG_START`
(11 s) when the visitor taps BOARD, the clock rings at `BUZZER_AT` (21.85 s),
turns into the plane 0.7 s later, and the overlay clears 1.5 s after that.
All four numbers live in `src/lib/audio-cues.ts`. The animation reads
`audio.currentTime` every frame, so changing a number there is the whole edit.

The intro runs once per browser tab (sessionStorage). `?intro=off` on the URL
skips it, and the footer's "Replay boarding" runs it again.

### Adding photos

1. Drop a folder into `_raw/countries/` named after the city or country
   (`Greece/`, `Athens/`, `Dubai/`). HEIC, JPEG, PNG, WebP all work.
2. If the folder name is a city, map it in `scripts/photo-places.json`:
   `"Athens": { "country": "greece", "place": "Athens" }`. Folders named exactly
   after a country need no entry.
3. `npm run photos`. Stamps with photos become clickable automatically, and the
   contact sheet in Layover picks them up.

`_raw/` is gitignored; the processed WebP files in `public/photos/` are what
ships.

### Adding a country

Add a row to `src/data/countries.json` (the `numeric` field is the ISO 3166-1
numeric code, which is how world-atlas keys countries), then `npm run geo`.

### Editing copy

Everything written on the page is in `src/data/site.ts`. The Meta leg in the
flight log has no dates because none were given; fill in `range` there.

## Deploy

`.github/workflows/pages.yml` builds and publishes `out/` to GitHub Pages on
every push to `main` (enable Pages > Source: GitHub Actions in the repo
settings). With a custom domain, add `public/CNAME` and set `SITE_URL` in
`src/data/site.ts`. Under a `username.github.io/repo` path, set `basePath` in
`next.config.ts`. The same `out/` folder also deploys to Vercel or any static
host as-is.
