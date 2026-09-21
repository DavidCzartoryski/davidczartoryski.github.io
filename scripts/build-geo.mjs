// Builds src/data/geo.generated.json: world map paths (110m) with visited
// flags, plus per-country outline paths (50m) fitted into a 200x200 stamp box.
// Run: node scripts/build-geo.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { geoNaturalEarth1, geoPath, geoCentroid } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const VISITED = JSON.parse(readFileSync(new URL("../src/data/countries.json", import.meta.url), "utf8"));
const byNumeric = new Map(VISITED.map((c) => [c.numeric, c]));

const round = (d) => d.replace(/(\d+\.\d{1})\d+/g, "$1");

// ---- World map (110m) ----
const topo110 = require("world-atlas/countries-110m.json");
const world = feature(topo110, topo110.objects.countries);
const W = 1200, H = 600;
const projection = geoNaturalEarth1().fitSize([W, H], { type: "Sphere" });
const path = geoPath(projection);
const sphere = round(path({ type: "Sphere" }));
const countries = world.features.map((f) => {
  const id = Number(f.id);
  const v = byNumeric.get(id);
  return { id, slug: v?.slug ?? null, d: round(path(f) || "") };
}).filter((c) => c.d);

// Markers for visited countries: centroid projected to map space.
const topo50 = require("world-atlas/countries-50m.json");
const world50 = feature(topo50, topo50.objects.countries);
const f50 = new Map(world50.features.map((f) => [Number(f.id), f]));
const f110 = new Map(world.features.map((f) => [Number(f.id), f]));

const markers = VISITED.map((c) => {
  const f = f50.get(c.numeric);
  if (!f) throw new Error(`missing 50m feature for ${c.name}`);
  // Prefer a hand-set anchor (USA centroid drifts into Canada because of Alaska).
  const [lon, lat] = c.anchor ?? geoCentroid(f);
  const [x, y] = projection([lon, lat]);
  return { slug: c.slug, x: +x.toFixed(1), y: +y.toFixed(1) };
});

const cityPoints = Object.fromEntries(
  Object.entries({
    boston: [-71.0589, 42.3601],
    warsaw: [21.0122, 52.2297],
    milan: [9.19, 45.4642],
    menloPark: [-122.1817, 37.4529],
  }).map(([k, ll]) => { const [x, y] = projection(ll); return [k, { x: +x.toFixed(1), y: +y.toFixed(1) }]; }),
);

// ---- Stamps (50m), each fitted to a 200x200 box ----
const S = 200;
const stamps = {};
for (const c of VISITED) {
  // Large countries use the coarser atlas: Canada alone is 120 KB at 50m.
  const f = (c.res === "110m" ? f110 : f50).get(c.numeric);
  const p = geoNaturalEarth1();
  // Rotate so the country sits at the projection center before fitting;
  // avoids the USA/Alaska wrap and keeps small countries undistorted.
  const [clon, clat] = c.anchor ?? geoCentroid(f);
  p.rotate([-clon, 0]).fitExtent([[12, 12], [S - 12, S - 12]], c.clip ? clipTo(f, c.clip) : f);
  const sp = geoPath(p);
  stamps[c.slug] = round(sp(c.clip ? clipTo(f, c.clip) : f) || "");
}

/** Keep only polygons whose bbox falls inside [minLon,minLat,maxLon,maxLat]. */
function clipTo(f, box) {
  const [x0, y0, x1, y1] = box;
  const polys = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
  const keep = polys.filter((poly) => poly[0].every(([lon, lat]) => lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1));
  return { type: "Feature", geometry: { type: "MultiPolygon", coordinates: keep } };
}

mkdirSync(new URL("../src/data/", import.meta.url), { recursive: true });
const out = { width: W, height: H, sphere, countries, markers, cityPoints, stampSize: S, stamps };
writeFileSync(new URL("../src/data/geo.generated.json", import.meta.url), JSON.stringify(out));
const bytes = Buffer.byteLength(JSON.stringify(out));
console.log(`geo.generated.json: ${(bytes / 1024).toFixed(0)} KB, ${countries.length} world paths, ${Object.keys(stamps).length} stamps`);
for (const [k, v] of Object.entries(stamps)) console.log(`  ${k.padEnd(20)} ${(v.length / 1024).toFixed(1)} KB`);
