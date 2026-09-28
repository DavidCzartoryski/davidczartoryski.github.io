import { Vector3 } from "three";
import { flight } from "./store";
import { clamp01, lerp, smoother } from "./lib";

/** Section ids in page order. Each one is a stop on the route. */
export const STOPS = ["top", "passport", "flight-log", "cargo", "the-mat", "layover", "arrivals"] as const;

// Where each scene sits in the world. They are far enough apart that fog
// hides the ones you are not at.
export const WORLD = {
  sky: new Vector3(0, 0, 0),
  globe: new Vector3(0, -10, -70),
  log: new Vector3(0, -14, -130),
  hold: new Vector3(0, -18, -190),
  mat: new Vector3(0, -24, -250),
  photos: new Vector3(0, -20, -310),
  runway: new Vector3(0, -34, -370),
};
export const GLOBE_R = 6;
/** Where the camera aims in the hold: a little above the crates. */
const HOLD_EYE = WORLD.hold.clone().add(new Vector3(0, 0.6, 0));

type Key = { r: number; pos: Vector3; look: Vector3; fov: number };

const v = (base: Vector3, x: number, y: number, z: number) => base.clone().add(new Vector3(x, y, z));
const TAN = Math.tan((25 * Math.PI) / 180); // half of the 50 degree fov

/**
 * A pose that puts `base` at screen position (nx, ny) in NDC, `d` units in
 * front of the camera, looking down on it slightly (`lift`).
 */
function frame(r: number, base: Vector3, aspect: number, d: number, nx: number, ny: number, lift = 1.2): Key {
  const halfH = d * TAN;
  const ox = -nx * halfH * aspect;
  const oy = -ny * halfH;
  return { r, pos: v(base, ox, oy + lift, d), look: v(base, ox, oy, 0), fov: 50 };
}

/**
 * Camera keyframes along the route, as a function of viewport aspect so
 * portrait phones get a framing that fits. r runs 0..7: stop i is r in
 * [i, i+1), and each stop holds between roughly i+0.12 and i+0.88.
 */
export function keyframes(aspect: number): Key[] {
  const portrait = aspect < 0.9;
  const a = Math.min(aspect, 2.1);
  const W = WORLD;
  return [
    { r: 0.0, pos: v(W.sky, 0, 0, 12), look: v(W.sky, 0, 0.4, 0), fov: 50 },
    { r: 0.72, pos: v(W.sky, 0, -0.8, 8.5), look: v(W.sky, 0, -0.6, -6), fov: 52 },

    // Passport: beside the header, then back behind the flat map, then over the stamps.
    portrait ? frame(1.12, W.globe, a, 40, 0.55, 0.6) : frame(1.12, W.globe, a, 15, 0.8, 0.08),
    portrait ? frame(1.47, W.globe, a, 44, 0.5, 0.45) : frame(1.47, W.globe, a, 19, 0.7, 0.05),
    portrait ? frame(1.88, W.globe, a, 36, 0.4, 0.15, 2) : frame(1.88, W.globe, a, 16, 0.62, -0.1, 2.2),

    { r: 2.12, pos: v(W.log, -9, 5.5, portrait ? 19 : 15), look: v(W.log, -7, 0.5, 0), fov: 50 },
    { r: 2.88, pos: v(W.log, 9, 3.5, portrait ? 19 : 15), look: v(W.log, 8, -1, 0), fov: 50 },

    // Cargo: the crates float in the empty space right of the header, then drift up behind the cards.
    portrait ? frame(3.12, HOLD_EYE, a, 20, 0, 0.35, 3) : frame(3.12, HOLD_EYE, a, 15, 0.46, 0.3, 3),
    portrait ? frame(3.88, HOLD_EYE, a, 18, 0, 0.1, 4) : frame(3.88, HOLD_EYE, a, 14, 0.3, 0.12, 4),

    // The mat lies under the wrestlers illustration, clear of the text column.
    portrait ? frame(4.12, W.mat, a, 30, 0, -0.8, 12) : frame(4.12, W.mat, a, 24, 0.5, -0.42, 11),
    portrait ? frame(4.88, W.mat, a, 28, 0, -0.7, 10) : frame(4.88, W.mat, a, 21, 0.45, -0.3, 9),

    { r: 5.12, pos: v(W.photos, 0, 0.5, portrait ? 18 : 14), look: v(W.photos, 0, 0, 0), fov: 50 },
    { r: 5.88, pos: v(W.photos, 0, -3, portrait ? 16 : 12), look: v(W.photos, 0, -3, 0), fov: 50 },

    // Arrivals: on final approach, sinking toward the threshold as the page ends.
    { r: 6.12, pos: v(W.runway, 0, 7, 34), look: v(W.runway, 0, 0.5, -40), fov: 50 },
    { r: 7.0, pos: v(W.runway, 0, 2.2, 7), look: v(W.runway, 0, 1.2, -40), fov: 54 },
  ];
}

/** Writes the camera pose for route position r into pos/look; returns fov. */
export function poseAt(keys: Key[], r: number, pos: Vector3, look: Vector3, snap = false) {
  let k = 0;
  while (k < keys.length - 2 && r > keys[k + 1].r) k++;
  const a = keys[k];
  const b = keys[k + 1];
  // Reduced motion: no travel, just stand at the nearer keyframe.
  const u = snap ? (r - a.r < b.r - r ? 0 : 1) : smoother((r - a.r) / (b.r - a.r));
  pos.lerpVectors(a.pos, b.pos, u);
  look.lerpVectors(a.look, b.look, u);
  // Long hops between stops lift a little, like a climb and descent.
  const hop = a.pos.distanceTo(b.pos);
  if (hop > 20 && !snap) pos.y += Math.sin(Math.PI * u) * Math.min(6, hop * 0.08);
  return lerp(a.fov, b.fov, u);
}

/**
 * Route position from the scroll offset. Stop i begins when its section's
 * top reaches the middle of the viewport; the hero starts at 0.
 */
export function routeFromScroll(): number {
  const { stations, scrollY, vh } = flight;
  if (stations.length < STOPS.length) return 0;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
  const b = (i: number) => (i === 0 ? 0 : i >= stations.length ? maxScroll : Math.min(maxScroll, stations[i].top - vh * 0.5));
  for (let i = 0; i < stations.length; i++) {
    const lo = b(i);
    const hi = Math.max(lo + 1, b(i + 1));
    if (scrollY < hi || i === stations.length - 1) return Math.min(7, i + clamp01((scrollY - lo) / (hi - lo)));
  }
  return 0;
}

/** How present scene i is at route position r: fades in just before its stop, out just after. */
export function weight(i: number, r: number) {
  const a = clamp01((r - (i - 0.45)) / 0.35);
  const b = clamp01((i + 1.45 - r) / 0.35);
  return i === 0 ? b : i === STOPS.length - 1 ? a : a * b;
}


