// Builds public/three/globe.json for the 3D passport globe, from the same
// world-atlas the flat map and the stamps use (see build-geo.mjs).
//
// The globe is a Fibonacci sphere of N dots. Rather than shipping positions,
// the file ships which dots are land (a bitset) and, for each land dot, which
// visited country it sits in; the scene regenerates the sphere from N with the
// same formula. Visited countries also get their outlines, in degrees.
// Run: node scripts/build-globe.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoBounds, geoCentroid, geoContains } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const VISITED = JSON.parse(readFileSync(new URL("../src/data/countries.json", import.meta.url), "utf8"));
const topo110 = require("world-atlas/countries-110m.json");
const topo50 = require("world-atlas/countries-50m.json");
const world110 = feature(topo110, topo110.objects.countries).features.filter((f) => Number(f.id) !== 10); // no Antarctica
const f50 = new Map(feature(topo50, topo50.objects.countries).features.map((f) => [Number(f.id), f]));
const f110 = new Map(world110.map((f) => [Number(f.id), f]));

export const N = 36000;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** Must match fibPoint() in src/components/three/scenes/Globe.tsx. */
function fibPoint(i) {
  const y = 1 - (2 * (i + 0.5)) / N;
  const theta = i * GOLDEN;
  return [((Math.atan2(Math.sin(theta), Math.cos(theta)) * 180) / Math.PI), (Math.asin(y) * 180) / Math.PI];
}

// Bounding boxes first: geoContains is exact but slow.
function withBounds(f) {
  const [[x0, y0], [x1, y1]] = geoBounds(f);
  return { f, x0, y0, x1, y1, wraps: x0 > x1 };
}
const inBox = (b, lon, lat) => lat >= b.y0 && lat <= b.y1 && (b.wraps ? lon >= b.x0 || lon <= b.x1 : lon >= b.x0 && lon <= b.x1);
const land = world110.map(withBounds);
const visited = VISITED.map((c) => withBounds(f50.get(c.numeric)));

const bits = new Uint8Array(Math.ceil(N / 8));
const country = [];
let landCount = 0;
for (let i = 0; i < N; i++) {
  const [lon, lat] = fibPoint(i);
  let v = 0;
  for (let k = 0; k < visited.length; k++) {
    if (inBox(visited[k], lon, lat) && geoContains(visited[k].f, [lon, lat])) {
      v = k + 1;
      break;
    }
  }
  const isLand = v > 0 || land.some((b) => inBox(b, lon, lat) && geoContains(b.f, [lon, lat]));
  if (!isLand) continue;
  bits[i >> 3] |= 1 << (i & 7);
  country.push(v);
  landCount++;
}

// Outlines: 50m for small countries, 110m where the stamps also use 110m.
const Q = 20; // degrees * 20, so 0.05 deg resolution
function rings(f) {
  const polys = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
  const out = [];
  for (const poly of polys) {
    const ring = poly[0];
    const flat = [];
    let last = null;
    for (const [lon, lat] of ring) {
      const q = [Math.round(lon * Q), Math.round(lat * Q)];
      if (last && Math.abs(q[0] - last[0]) + Math.abs(q[1] - last[1]) < 6) continue; // drop points under ~0.3 deg apart
      flat.push(q[0], q[1]);
      last = q;
    }
    if (flat.length >= 8) out.push(flat);
  }
  return out;
}

const countries = VISITED.map((c) => {
  const f = (c.res === "110m" ? f110 : f50).get(c.numeric) ?? f50.get(c.numeric);
  const [lon, lat] = c.anchor ?? geoCentroid(f50.get(c.numeric));
  return { slug: c.slug, anchor: [+lon.toFixed(2), +lat.toFixed(2)], rings: rings(f) };
});

const homes = {
  BOS: [-71.0589, 42.3601],
  SFO: [-122.1817, 37.4529], // Menlo Park, as on the flat map
  WAW: [21.0122, 52.2297],
};

const b64 = (u8) => Buffer.from(u8).toString("base64");
const out = { n: N, q: Q, land: b64(bits), country: b64(Uint8Array.from(country)), countries, homes };
mkdirSync(new URL("../public/three/", import.meta.url), { recursive: true });
const json = JSON.stringify(out);
writeFileSync(new URL("../public/three/globe.json", import.meta.url), json);
const perCountry = VISITED.map((c, k) => `${c.slug}:${country.filter((v) => v === k + 1).length}`).join(" ");
console.log(`globe.json: ${(json.length / 1024).toFixed(0)} KB, ${landCount} land dots of ${N}`);
console.log(`  dots per visited country: ${perCountry}`);
