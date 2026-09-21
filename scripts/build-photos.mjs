// Converts everything under _raw/countries into web-sized WebP files in
// public/photos/<country>/ and writes src/data/photos.generated.json.
// Drop a new folder (named after the country or city) into _raw/countries,
// optionally add it to scripts/photo-places.json, then: npm run photos
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, basename, extname } from "node:path";
import sharp from "sharp";

const ROOT = new URL("../", import.meta.url).pathname;
const RAW = join(ROOT, "_raw/countries");
const OUT = join(ROOT, "public/photos");
const places = JSON.parse(readFileSync(join(ROOT, "scripts/photo-places.json"), "utf8"));
const countries = JSON.parse(readFileSync(join(ROOT, "src/data/countries.json"), "utf8"));

const LARGE = 1800, THUMB = 640;
const isImage = (f) => /\.(jpe?g|png|heic|webp)$/i.test(f);
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function resolvePlace(entryName) {
  const hit = places[entryName];
  if (hit) return hit;
  const guess = countries.find((c) => slugify(c.name) === slugify(entryName) || c.slug === slugify(entryName));
  if (guess) return { country: guess.slug, place: guess.name };
  console.warn(`! ${entryName}: no mapping in scripts/photo-places.json and no country name match, skipping`);
  return null;
}

/** [ [sourcePath, place, country], ... ] */
const jobs = [];
for (const entry of readdirSync(RAW)) {
  if (entry.startsWith(".")) continue;
  const p = join(RAW, entry);
  const meta = resolvePlace(entry);
  if (!meta) continue;
  if (statSync(p).isDirectory()) {
    for (const f of readdirSync(p).filter(isImage).sort()) jobs.push([join(p, f), meta]);
  } else if (isImage(entry)) jobs.push([p, meta]);
}

rmSync(OUT, { recursive: true, force: true });
const manifest = {};
const counters = {};
for (const [src, meta] of jobs) {
  const dir = join(OUT, meta.country);
  mkdirSync(dir, { recursive: true });
  const n = (counters[meta.country] = (counters[meta.country] ?? 0) + 1);
  const stem = `${slugify(meta.place)}-${String(n).padStart(2, "0")}`;
  const img = sharp(src).rotate();
  const { width, height } = await img.metadata();
  const landscape = width >= height;
  const fit = (px) => (landscape ? { width: px, withoutEnlargement: true } : { height: px, withoutEnlargement: true });
  const large = await img.clone().resize(fit(LARGE)).webp({ quality: 78 }).toFile(join(dir, `${stem}.webp`));
  await img.clone().resize(fit(THUMB)).webp({ quality: 72 }).toFile(join(dir, `${stem}-thumb.webp`));
  (manifest[meta.country] ??= []).push({
    src: `/photos/${meta.country}/${stem}.webp`,
    thumb: `/photos/${meta.country}/${stem}-thumb.webp`,
    w: large.width, h: large.height,
    place: meta.place,
    file: basename(src, extname(src)),
  });
  process.stdout.write(`${meta.country}/${stem} ${large.width}x${large.height}\n`);
}
writeFileSync(join(ROOT, "src/data/photos.generated.json"), JSON.stringify(manifest, null, 1));
console.log(`\n${jobs.length} photos across ${Object.keys(manifest).length} countries -> src/data/photos.generated.json`);
