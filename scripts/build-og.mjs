// Composites the share card: art-src/og-bg.png (passport, boarding pass, alarm
// clock still life) with the name set in a Didot-style serif on the empty left
// half. Writes src/app/opengraph-image.png and twitter-image.png (1200x630).
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url).pathname;
const W = 1200, H = 630;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="fade" x1="0" x2="1">
      <stop offset="0" stop-color="#0b1020" stop-opacity="0.85"/>
      <stop offset="0.55" stop-color="#0b1020" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#0b1020" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#fade)"/>
  <text x="72" y="118" font-family="IBM Plex Mono, Menlo, monospace" font-size="18" letter-spacing="6" fill="#d4a853">PASSPORT NO. DC-2027 · ISSUED BOSTON, MA</text>
  <text x="72" y="270" font-family="Didot, Bodoni 72, Bodoni MT, Georgia, serif" font-size="112" fill="#f3ead8" letter-spacing="-3">David</text>
  <text x="72" y="380" font-family="Didot, Bodoni 72, Bodoni MT, Georgia, serif" font-size="112" font-style="italic" fill="#f0cf85" letter-spacing="-3">Czartoryski</text>
  <text x="72" y="450" font-family="IBM Plex Mono, Menlo, monospace" font-size="20" letter-spacing="5" fill="#f3ead8" fill-opacity="0.85">SOFTWARE ENGINEER · FOUNDER · WRESTLER</text>
  <text x="72" y="540" font-family="IBM Plex Mono, Menlo, monospace" font-size="18" letter-spacing="6" fill="#d4a853">23 COUNTRIES STAMPED · NORTHEASTERN '27</text>
</svg>`;

const bg = await sharp(`${ROOT}art-src/og-bg.png`).resize(W, H, { fit: "cover", position: "east" }).toBuffer();
const out = await sharp(bg).composite([{ input: Buffer.from(svg) }]).png({ compressionLevel: 9 }).toBuffer();
writeFileSync(`${ROOT}src/app/opengraph-image.png`, out);
writeFileSync(`${ROOT}src/app/twitter-image.png`, out);
const alt = "David Czartoryski, software engineer, founder, wrestler. 23 countries stamped. A navy passport, boarding pass, and brass alarm clock on a dark wooden table.";
writeFileSync(`${ROOT}src/app/opengraph-image.alt.txt`, alt);
writeFileSync(`${ROOT}src/app/twitter-image.alt.txt`, alt);
console.log(`share card: ${(out.length / 1024).toFixed(0)} KB`);
