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
src/app/                 root layout (fonts, metadata), globals.css (tokens, keyframes)
  (experience)/          the full site: layout (song, intro, 3D layer, nav) and page (section order)
  recruiter/             /recruiter, the no-sound résumé view
  Artemis/               focused homepage, shared layout, and product/ technical deep dive
src/data/site.ts         ALL copy: profile, flight log, ventures, projects, wrestling, layover, skills, nav, recruiter view
src/data/artemis.ts      product deep-dive copy, including scoped historical results
src/data/countries.json  the 23 visited countries (slug, ISO, flag, region, atlas id)
src/data/*.generated.json  built by scripts, do not edit by hand
src/lib/audio-cues.ts    where the song starts and where the buzzer lands
src/components/
  IntroGate.tsx          boarding pass + choice (Continue / Recruiter view) -> alarm clock -> airplane -> reveal
  AlarmClock.tsx         the SVG clock, driven by the song's clock
  AudioProvider.tsx      the one <audio> element, shared by the intro and the nav button
  WorldMap.tsx, Stamp.tsx  outlines rendered from the generated geo data
  sections/              Hero, Passport, FlightLog, Cargo, Mat, Layover, Arrivals
  recruiter/             the recruiter view's sections, all server-rendered
  artemis/               the /Artemis sections; Lanes.tsx is the hero's rank strip
  three/                 "Night flight", the optional WebGL layer (see below)
scripts/
  build-geo.mjs          world map + per-country stamp outlines from world-atlas
  build-globe.mjs        public/three/globe.json: land dots and visited outlines for the 3D globe
  build-photos.mjs       raw photos -> public/photos/*.webp + manifest
  build-og.mjs           social share card from art-src/og-bg.png
```

### Two ways in

The first screen is the boarding pass with two choices:

- **Continue** starts the full experience below: the song, the alarm-clock
  intro, and the Night flight layer.
- **Recruiter view** goes to `/recruiter/`, the résumé on one quiet page. It
  sits outside the `(experience)` route group, so the audio element, the intro
  and the WebGL code never load there. It is server-rendered HTML from
  `site.ts`; the client code is the starfield canvas, the section index, the
  floating résumé and back-to-top buttons and the copy-email buttons. It has a
  print stylesheet that prints ink on paper with every "More" fold open.

`/recruiter/` works as a direct link, so it can go straight into an
application. The hero and footer of the full site link to it, and it links
back. In `site.ts`, `recruiter.impact` holds the headline numbers and
`recruiter.emphasis` the phrases the highlighter picks out of the bullets.
A phrase that no longer matches the copy just stops being highlighted.

The recruiter view has its own look rather than the passport's: a night sky.
Near-black, warm off-white and one amber accent, set in Geist and Geist Mono
(loaded on that page only), over a canvas of twinkling stars, two faint orbits
and the odd meteor (`Starfield.tsx`, a still frame under reduced motion). Its
colours are the `--cv-*` variables at the bottom of `globals.css`, used as
`bg-cv-*`, `text-cv-*` and so on, so changing the palette is an edit there and
nowhere else. A sticky header carries the section index; roles, ventures and
projects show their first lines and fold the rest behind "More". Stack icons
come from `simple-icons`, mapped by skill name in `recruiter/icons.tsx`.

### Artemis

`/Artemis/` is the focused startup homepage: an autonomous performance engineer
for distributed AI training. It introduces the category, the GPU-time and
engineering-time value, a conceptual performance loop, and a single primary
action (contact the founder). The product is clearly marked in development.
No benchmark grids, architecture diagrams, or research backlog appear here.

`/Artemis/product/` is the deep dive. It explains the intended autonomous
workflow, distinguishes planned capabilities from existing prototypes and
historical hardware experiments, and retains the technical material: the
problem, origin story, GPUBridge, separate transport channels, detector,
evidence, research, sole founder David Czartoryski, and feedback invitation.
A local contents index replaces the old seven-item sticky navigation.

Both routes sit outside `(experience)`: no intro, song, or WebGL loads. They
share the Artemis layout, Archivo and Martian Mono fonts, dark palette,
wordmark, short navigation, and footer. The homepage has no animated telemetry
or illustrative performance numbers. The product page retains the interactive
rank-lane rebalance illustration, regression chart, and collectives explorer.
Reduced motion disables animation. Its examples are labeled illustrations,
not live monitoring or customer results.

Homepage copy lives in `artemis/Hero.tsx` and `artemis/Homepage.tsx`; the workflow
visual is `artemis/PerformanceLoop.tsx`. Detailed copy remains in
`src/data/artemis.ts`, with the new product overview in the product route.
Keep each historical number's hardware and measurement scope attached. The
detector source is private: never add private repository or raw evidence links.
Build social cards with `npm run og:artemis` (`scripts/build-artemis-og.mjs`).
The founder photo stays in `public/team/`, avoiding case-insensitive path
collisions with `/Artemis/`.

GitHub Pages paths are case-sensitive, so `/artemis` would miss; the 404
page sends any casing of it to `/Artemis/`.

`/Artemis/Demo/` serves the standalone fleet demo from `public/Artemis/Demo/`.
It plays one simulated day of an Artemis fleet of 192 A100 GPUs running 8
training jobs, all from a single clock, so the overview, job charts, racks
and incidents always agree. A guided story walks through a GPU failure, a hot
GPU, a slow input loader and a switch failure. Everything is simulated: it
touches no live hardware, sends no network requests and records no visits or
clicks. The files use relative URLs and hash navigation, so GitHub Pages
serves it with no API or extra routing. The case-sensitive public entry point is
`https://davidczartoryski.com/Artemis/Demo` (Pages adds the trailing slash).

To refresh it from the canonical Artemis checkout, run:

```sh
cd ~/code/straggler-detector
.venv/bin/python -m straggler.fleet.demo export --target static --out ~/code/david-portfolio/public/Artemis/Demo
```

Then build and publish this website as usual. Do not copy the private source,
raw hardware evidence, Vercel functions, or credentials into the public site.

### The intro and the song

`public/audio/theme.mp3` is the theme song. Playback starts at `SONG_START`
(11 s) when the visitor taps Continue, the clock rings at `BUZZER_AT` (21.85 s),
turns into the plane 0.7 s later, and the overlay clears 1.5 s after that.
All four numbers live in `src/lib/audio-cues.ts`. The animation reads
`audio.currentTime` every frame, so changing a number there is the whole edit.

The intro runs once per browser tab (sessionStorage). `?intro=off` on the URL
skips it, and the footer's "Replay boarding" runs it again.

### Night flight (the 3D layer)

One fixed canvas behind the page, built with React Three Fiber. The camera
flies a single route as you scroll; each section is a stop: the sky with
hold-to-board, the dotted globe, the flight path, the cargo hold, the mat,
the floating prints, and the runway.

- **Loading.** `three/NightFlight.tsx` is the only piece in the main bundle.
  After the intro clears and the browser is idle, and only if WebGL works (and
  data saver is off), it pulls in `three/Scene.tsx` through `next/dynamic`
  with `ssr: false`. Without WebGL nothing loads and the page is untouched.
- **No per-frame React.** Motion's `useScroll`, pointer, hover and
  in-view signals write into `three/store.ts`; scenes read it in `useFrame`.
  The DOM hooks are data attributes: `data-stamp`, `data-leg`, `data-venture`
  and `data-nf="hero-art"`. CSS that applies only while the layer runs is
  scoped to `html.nf-on` in `globals.css`.
- **Size.** `Scene.tsx` uses `createRoot` with a short `extend()` list instead
  of `<Canvas>`, which would register all of three and stop tree-shaking.
  Everything is procedural; the only fetched data is `globe.json` and, near
  the Layover stop, eight existing thumbnails.
- **Motion and devices.** `prefers-reduced-motion` gets static scenes with no
  camera travel and no hold. DPR is capped at 1.5 (1 on touch screens), the
  loop stops while the tab is hidden or the intro covers the page, and
  `PerformanceMonitor` trims particle counts when frames drop.
- **Globe data.** `npm run globe` rebuilds `public/three/globe.json` from the
  same `world-atlas` and `countries.json`; run it after adding a country.

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
numeric code, which is how world-atlas keys countries), then `npm run geo`
and `npm run globe`.

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
