// Draws the /Artemis share card: the crescent mark and wordmark, the hero line
// with "slowest GPU." in signal red, and eight rank lanes where rank 2 computes
// slowly and the other seven wait for it at every all-reduce. Writes
// src/app/Artemis/opengraph-image.png and twitter-image.png (1200x630) and
// their .alt.txt files.
//
// The type is the page's own: Archivo (wdth 116 / wght 620 for the headline,
// wdth 125 for the wordmark) and Martian Mono (wdth 87.5). Pass the variable
// TTFs with --archivo <ttf> --mono <ttf>; without them the script downloads
// both from github.com/google/fonts into a fresh temp directory and deletes it
// afterwards. Font files never enter the repo.
//
//   npm run og:artemis
//   npm run og:artemis -- --archivo ~/fonts/Archivo.ttf --mono ~/fonts/MartianMono.ttf
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const ROOT = new URL("../", import.meta.url).pathname;
const OUT = `${ROOT}src/app/Artemis`;
const W = 1200, H = 630;
const ALT =
  "Artemis share card: the headline “Every training step waits for the slowest GPU.” above eight GPU rank timelines, where seven ranks wait at each all-reduce for the one slow rank drawn in red.";

const FONT_URLS = {
  archivo: "https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/Archivo%5Bwdth,wght%5D.ttf",
  mono: "https://raw.githubusercontent.com/google/fonts/main/ofl/martianmono/MartianMono%5Bwdth,wght%5D.ttf",
};

const { values: args } = parseArgs({ options: { archivo: { type: "string" }, mono: { type: "string" } } });

// ── Fonts ────────────────────────────────────────────────────────────────────
// librsvg can't set variable axes from SVG, so a private fontconfig maps alias
// families onto exact axis values. It has to exist before sharp loads.
const work = mkdtempSync(join(tmpdir(), "artemis-og-"));
try {
  for (const key of ["archivo", "mono"]) {
    const dest = join(work, `${key}.ttf`);
    if (args[key]) {
      copyFileSync(resolve(args[key]), dest);
    } else {
      const res = await fetch(FONT_URLS[key]);
      if (!res.ok) throw new Error(`${FONT_URLS[key]}: HTTP ${res.status}`);
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    }
  }
  const alias = (name, family, variations) => `
  <match target="pattern">
    <test name="family"><string>${name}</string></test>
    <edit name="family" mode="assign" binding="strong"><string>${family}</string></edit>
    <edit name="fontvariations" mode="assign"><string>${variations}</string></edit>
  </match>`;
  writeFileSync(
    join(work, "fonts.conf"),
    `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${work}</dir>
  <cachedir>${join(work, "cache")}</cachedir>${alias("AR Display", "Archivo", "wdth=116,wght=620")}${alias("AR Wide", "Archivo", "wdth=125,wght=600")}${alias("AR Mono", "Martian Mono", "wdth=87.5,wght=400")}${alias("AR Mono Bold", "Martian Mono", "wdth=87.5,wght=600")}
</fontconfig>`,
  );
  process.env.FONTCONFIG_FILE = join(work, "fonts.conf");
  // macOS builds of pango default to CoreText, which never sees these files.
  process.env.PANGOCAIRO_BACKEND = "fc";

  const { default: sharp } = await import("sharp");
  const png = await sharp(Buffer.from(card())).removeAlpha().png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(`${OUT}/opengraph-image.png`, png);
  writeFileSync(`${OUT}/twitter-image.png`, png);
  writeFileSync(`${OUT}/opengraph-image.alt.txt`, ALT);
  writeFileSync(`${OUT}/twitter-image.alt.txt`, ALT);
  console.log(`artemis share card: ${(png.length / 1024).toFixed(0)} KB`);
} finally {
  rmSync(work, { recursive: true, force: true });
}

// ── Card ─────────────────────────────────────────────────────────────────────
function card() {
  const C = {
    bg: "#ECE9E1",
    card: "#F6F4EF",
    ink: "#131418",
    muted: "#45464C",
    faint: "#5E5F64",
    line: "rgba(19,20,24,0.12)",
    signal: "#D9411F",
    signalInk: "#B5321A",
  };
  const M = 64; // outer margin

  // Rank lanes: same model as the page's hero strip (src/components/artemis/Lanes.tsx).
  const RANKS = ["NV", "NV", "NV", "NV", "AMD", "AMD", "AMD", "AMD"];
  const SLOW_RANK = 2;
  const panel = { x: M, y: 384, w: W - 2 * M, h: 190 };
  const labelW = 92;
  const axis = 26; // room for the ALL-REDUCE labels above the lanes
  const lane = (panel.h - axis - 8) / RANKS.length;
  const bar = 12;
  const comm = 24, gap = 12;
  const base = { NV: 136, AMD: 146 }, slow = 178;

  const rand = mulberry32(41);
  const x0 = panel.x + labelW + 18;
  const steps = [];
  for (let x = x0; x < panel.x + panel.w; ) {
    const compute = RANKS.map((v, r) => Math.round((r === SLOW_RANK ? slow : base[v]) + (rand() - 0.5) * 14));
    const barrier = Math.max(...compute);
    steps.push({ x, compute, barrier });
    x += barrier + comm + gap;
  }

  // The strip runs on past the panel edge and fades out, like the page's.
  const right = panel.x + panel.w;
  const fade = { from: right - 92, to: right - 14 };

  const laneY = (i) => panel.y + axis + i * lane;
  let lanes = "";
  let barrierLabels = ""; // kept out of the fade so none comes out half-faded
  for (const step of steps) {
    const bx = step.x + step.barrier;
    lanes += `<line x1="${bx}" x2="${bx}" y1="${panel.y + axis - 9}" y2="${panel.y + panel.h - 4}" stroke="${C.ink}" stroke-opacity="0.32" stroke-width="1" stroke-dasharray="2 3"/>`;
    if (bx + 76 < right) {
      barrierLabels += `<text x="${bx + 4}" y="${panel.y + axis - 11}" font-family="AR Mono" font-size="9.5" letter-spacing="0.6" fill="${C.faint}">ALL-REDUCE</text>`;
    }
    for (let i = 0; i < RANKS.length; i++) {
      const y = laneY(i) + (lane - bar) / 2;
      const c = step.compute[i];
      const isSlow = i === SLOW_RANK;
      lanes += `<rect x="${step.x}" y="${y}" width="${c}" height="${bar}" rx="2" fill="${isSlow ? C.signal : C.ink}" fill-opacity="${isSlow ? 1 : 0.82}"/>`;
      if (step.barrier - c > 2) {
        lanes += `<rect x="${step.x + c + 1.5}" y="${y + 0.5}" width="${step.barrier - c - 2.5}" height="${bar - 1}" rx="1.5" fill="url(#hatch)" stroke="${C.ink}" stroke-opacity="0.25" stroke-width="1"/>`;
      }
      lanes += `<rect x="${bx + 1.5}" y="${y}" width="${comm - 3}" height="${bar}" rx="2" fill="${C.ink}" fill-opacity="0.24"/>`;
    }
  }

  let labels = "";
  for (let i = 0; i < RANKS.length; i++) {
    const y = laneY(i) + lane / 2 + 4;
    const isSlow = i === SLOW_RANK;
    labels += `<text x="${panel.x + 16}" y="${y}" font-family="${isSlow ? "AR Mono Bold" : "AR Mono"}" font-size="12" fill="${isSlow ? C.signalInk : C.muted}">r${i}<tspan dx="8" fill="${isSlow ? C.signalInk : C.faint}">${RANKS[i]}</tspan></text>`;
    if (isSlow) labels += `<circle cx="${panel.x + labelW - 14}" cy="${y - 4}" r="3" fill="${C.signal}"/>`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1" fill="${C.ink}" fill-opacity="0.07"/>
    </pattern>
    <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="5" stroke="${C.ink}" stroke-opacity="0.32" stroke-width="1.4"/>
    </pattern>
    <mask id="crescent" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
      <rect width="32" height="32" fill="#fff"/>
      <circle cx="21.5" cy="12.5" r="10.5" fill="#000"/>
    </mask>
    <linearGradient id="fadeX" gradientUnits="userSpaceOnUse" x1="${fade.from}" y1="0" x2="${fade.to}" y2="0">
      <stop offset="0" stop-color="#fff"/>
      <stop offset="1" stop-color="#000"/>
    </linearGradient>
    <mask id="fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
      <rect width="${W}" height="${H}" fill="url(#fadeX)"/>
    </mask>
    <clipPath id="panel"><rect x="${panel.x + labelW}" y="${panel.y}" width="${panel.w - labelW}" height="${panel.h}"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>

  <!-- Mark + wordmark -->
  <g transform="translate(${M} 52) scale(1.25)">
    <circle cx="16" cy="16" r="13.5" fill="${C.ink}" mask="url(#crescent)"/>
    <circle cx="21" cy="13" r="3.2" fill="${C.signal}"/>
  </g>
  <text x="${M + 54}" y="80" font-family="AR Wide" font-size="22" letter-spacing="3.52" fill="${C.ink}">ARTEMIS</text>

  <!-- Headline -->
  <g font-family="AR Display" font-size="74" letter-spacing="-2.6" fill="${C.ink}">
    <text x="${M - 3}" y="212">Every training step waits</text>
    <text x="${M - 3}" y="286">for the <tspan fill="${C.signal}">slowest GPU.</tspan></text>
  </g>
  <text x="${M}" y="334" font-family="AR Mono" font-size="16" letter-spacing="1.3" fill="${C.muted}">RUNTIME RELIABILITY FOR GPU TRAINING · NVIDIA + AMD</text>

  <!-- Rank lanes -->
  <rect x="${panel.x + 0.5}" y="${panel.y + 0.5}" width="${panel.w - 1}" height="${panel.h - 1}" fill="${C.card}" stroke="${C.line}"/>
  <rect x="${panel.x + 1}" y="${laneY(SLOW_RANK)}" width="${panel.w - 2}" height="${lane}" fill="${C.signal}" fill-opacity="0.07"/>
  <line x1="${panel.x + labelW + 0.5}" x2="${panel.x + labelW + 0.5}" y1="${panel.y}" y2="${panel.y + panel.h}" stroke="${C.line}"/>
  ${labels}
  <g clip-path="url(#panel)"><g mask="url(#fade)">${lanes}</g>${barrierLabels}</g>
</svg>`;
}

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
