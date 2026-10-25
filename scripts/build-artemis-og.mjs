// Draws the /Artemis share card: the crescent mark and wordmark, the hero line
// and a simple detect → diagnose → resolve → verify workflow. Writes
// src/app/Artemis/opengraph-image.png and twitter-image.png (1200x630) and
// their .alt.txt files.
//
// The type is the page's own: Archivo (wdth 112 / wght 600 for the headline,
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
  "Artemis: an autonomous performance engineer for distributed AI training. Less GPU time wasted. Less engineering time spent chasing slowdowns. Product workflow in development: Detect, Diagnose, Resolve, Verify.";

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
  <cachedir>${join(work, "cache")}</cachedir>${alias("AR Display", "Archivo", "wdth=112,wght=600")}${alias("AR Wide", "Archivo", "wdth=125,wght=600")}${alias("AR Mono", "Martian Mono", "wdth=87.5,wght=400")}${alias("AR Mono Bold", "Martian Mono", "wdth=87.5,wght=600")}
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
  const steps = ["Detect", "Diagnose", "Resolve", "Verify"];
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <mask id="crescent"><rect width="32" height="32" fill="#fff"/><circle cx="21.5" cy="12.5" r="10.5" fill="#000"/></mask>
  </defs>
  <rect width="${W}" height="${H}" fill="#0D0E11"/>
  <g transform="translate(64 49) scale(1.25)">
    <circle cx="16" cy="16" r="13.5" fill="#EDECE7" mask="url(#crescent)"/>
    <circle cx="21" cy="13" r="3.2" fill="#EE5C36"/>
  </g>
  <text x="118" y="78" font-family="AR Wide" font-size="22" letter-spacing="3.52" fill="#EDECE7">ARTEMIS</text>
  <g font-family="AR Display" font-size="60" letter-spacing="-1.5" fill="#EDECE7">
    <text x="62" y="198">An autonomous performance</text>
    <text x="62" y="270">engineer for</text>
    <text x="62" y="342" fill="#FF7A57">distributed AI training.</text>
  </g>
  <g font-family="AR Display" font-size="23" fill="#A9A8A2">
    <text x="64" y="402">Less GPU time wasted. Less time chasing slowdowns.</text>
  </g>
  <line x1="64" y1="458" x2="1136" y2="458" stroke="#EDECE7" stroke-opacity="0.17"/>
  ${steps.map((step, i) => `<circle cx="${76+i*275}" cy="502" r="5" fill="${i===0?'#EE5C36':i===3?'#2FC28C':'#EDECE7'}"/><text x="${94+i*275}" y="510" font-family="AR Display" font-size="23" fill="#EDECE7">${step}</text>${i<3?`<text x="${280+i*275}" y="510" font-family="AR Mono" font-size="20" fill="#8C8B85">→</text>`:''}`).join('')}
  <text x="64" y="575" font-family="AR Mono" font-size="13" letter-spacing="1" fill="#8C8B85">PRODUCT VISION · IN DEVELOPMENT</text>
</svg>`;
}
