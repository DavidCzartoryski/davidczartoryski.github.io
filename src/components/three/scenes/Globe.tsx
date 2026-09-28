"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  NormalBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { photosFor } from "@/lib/photos";
import { BRASS, BRASS_2, INK_2, PAPER, RED, clamp01, col, damp, lonLatToVec } from "../lib";
import { GLOBE_R, WORLD, weight } from "../route";
import { flight } from "../store";

type GlobeData = {
  n: number;
  q: number;
  land: string;
  country: string;
  countries: { slug: string; anchor: [number, number]; rings: number[][] }[];
  homes: Record<"BOS" | "SFO" | "WAW", [number, number]>;
};

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
/** Same sphere as scripts/build-globe.mjs, point i as lon/lat degrees. */
function fibPoint(i: number, n: number): [number, number] {
  const y = 1 - (2 * (i + 0.5)) / n;
  const th = i * GOLDEN;
  return [(Math.atan2(Math.sin(th), Math.cos(th)) * 180) / Math.PI, (Math.asin(y) * 180) / Math.PI];
}
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const dotVert = /* glsl */ `
attribute float aCountry;
uniform float uTime;
uniform float uWeight;
uniform float uHover;
uniform float uPixel;
varying float vAlpha;
varying float vKind;
varying float vHover;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  // Dim toward the limb so the sphere reads as round.
  vec3 n = normalize(normalMatrix * normalize(position));
  float facing = clamp(dot(n, normalize(-mv.xyz)), 0.0, 1.0);
  bool visited = aCountry > -0.5;
  float hover = visited && abs(aCountry - uHover) < 0.5 ? 1.0 : 0.0;
  float pulse = visited ? 0.8 + 0.2 * sin(uTime * 1.6 + aCountry * 0.7) : 1.0;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPixel * (visited ? 2.9 : 2.1) * (1.0 + hover * 0.8) * clamp(19.0 / -mv.z, 0.6, 1.6);
  vAlpha = uWeight * (0.25 + 0.75 * facing) * (visited ? pulse : 0.34);
  vKind = visited ? 1.0 : 0.0;
  vHover = hover;
}`;
const dotFrag = /* glsl */ `
uniform vec3 uLand;
uniform vec3 uBrass;
uniform vec3 uHot;
varying float vAlpha;
varying float vKind;
varying float vHover;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  vec3 c = mix(uLand, uBrass, vKind);
  c = mix(c, uHot, vHover);
  gl_FragColor = vec4(c, vAlpha * smoothstep(0.5, 0.2, r));
  #include <colorspace_fragment>
}`;

// Dotted great-circle arcs with a bright pulse travelling out of Boston.
const arcVert = /* glsl */ `
attribute float aU;
uniform float uTime;
uniform float uWeight;
uniform float uPixel;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float head = fract(uTime * 0.18);
  float d = aU - head;
  float glow = exp(-d * d * 220.0);
  gl_PointSize = uPixel * (1.6 + glow * 3.0) * clamp(19.0 / -mv.z, 0.6, 1.6);
  vAlpha = uWeight * (0.4 + glow * 0.6);
}`;
const arcFrag = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  gl_FragColor = vec4(uColor, vAlpha * smoothstep(0.5, 0.1, r));
  #include <colorspace_fragment>
}`;

const shellVert = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const shellFrag = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uRim;
uniform float uWeight;
varying vec3 vN;
varying vec3 vV;
void main() {
  float rim = pow(1.0 - clamp(dot(vN, vV), 0.0, 1.0), 4.0);
  gl_FragColor = vec4(uBase + uRim * rim * 0.38, uWeight);
  #include <colorspace_fragment>
}`;

function pointsMaterial(vertexShader: string, fragmentShader: string, extra: Record<string, { value: unknown }>, additive = false) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: additive ? AdditiveBlending : NormalBlending,
    uniforms: { uTime: { value: 0 }, uWeight: { value: 1 }, uPixel: { value: 1 }, ...extra },
  });
}

/** Great circle a->b as points, lifted off the surface mid-way. */
function arcPoints(a: [number, number], b: [number, number], samples: number) {
  const va = new Vector3(...lonLatToVec(a[0], a[1]));
  const vb = new Vector3(...lonLatToVec(b[0], b[1]));
  const ang = va.angleTo(vb);
  const pos = new Float32Array(samples * 3);
  const u = new Float32Array(samples);
  const p = new Vector3();
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    // slerp
    p.copy(va).multiplyScalar(Math.sin((1 - t) * ang)).addScaledVector(vb, Math.sin(t * ang)).divideScalar(Math.sin(ang));
    p.multiplyScalar(GLOBE_R * (1.004 + Math.sin(Math.PI * t) * 0.12 * ang));
    pos.set([p.x, p.y, p.z], i * 3);
    u[i] = t;
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("aU", new BufferAttribute(u, 1));
  return g;
}

/** A flat mark lying on the globe at lon/lat, facing out. */
function surfaceMark(mesh: Mesh, lon: number, lat: number, lift = 1.012) {
  const [x, y, z] = lonLatToVec(lon, lat, GLOBE_R * lift);
  mesh.position.set(x, y, z);
  mesh.lookAt(x * 2, y * 2, z * 2);
}

function useGlobeData() {
  const [data, setData] = useState<GlobeData | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/three/globe.json")
      .then((r) => r.json())
      .then((d: GlobeData) => live && setData(d))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  return data;
}

function build(data: GlobeData) {
  // Land dots, tagged with the visited country they fall in (or -1).
  const land = unb64(data.land);
  const country = unb64(data.country);
  const pos: number[] = [];
  const tag: number[] = [];
  let k = 0;
  for (let i = 0; i < data.n; i++) {
    if (!(land[i >> 3] & (1 << (i & 7)))) continue;
    const [lon, lat] = fibPoint(i, data.n);
    pos.push(...lonLatToVec(lon, lat, GLOBE_R * 1.002));
    tag.push(country[k++] - 1);
  }
  // Every visited country also gets a dot at its anchor, so Vatican City and
  // Jamaica show up even though no grid dot lands inside them.
  data.countries.forEach((c, ci) => {
    pos.push(...lonLatToVec(c.anchor[0], c.anchor[1], GLOBE_R * 1.003));
    tag.push(ci);
  });
  const dots = new BufferGeometry();
  dots.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  dots.setAttribute("aCountry", new BufferAttribute(new Float32Array(tag), 1));

  // Visited borders as line segments.
  const seg: number[] = [];
  for (const c of data.countries) {
    for (const ring of c.rings) {
      for (let i = 0; i < ring.length; i += 2) {
        const j = (i + 2) % ring.length;
        seg.push(
          ...lonLatToVec(ring[i] / data.q, ring[i + 1] / data.q, GLOBE_R * 1.003),
          ...lonLatToVec(ring[j] / data.q, ring[j + 1] / data.q, GLOBE_R * 1.003),
        );
      }
    }
  }
  const borders = new BufferGeometry();
  borders.setAttribute("position", new BufferAttribute(new Float32Array(seg), 3));

  // A faint graticule every 30 degrees.
  const grid: number[] = [];
  for (let lat = -60; lat <= 60; lat += 30)
    for (let lon = -180; lon < 180; lon += 4) grid.push(...lonLatToVec(lon, lat, GLOBE_R * 1.001), ...lonLatToVec(lon + 4, lat, GLOBE_R * 1.001));
  for (let lon = -180; lon < 180; lon += 30)
    for (let lat = -84; lat < 84; lat += 4) grid.push(...lonLatToVec(lon, lat, GLOBE_R * 1.001), ...lonLatToVec(lon, lat + 4, GLOBE_R * 1.001));
  const graticule = new BufferGeometry();
  graticule.setAttribute("position", new BufferAttribute(new Float32Array(grid), 3));

  const { BOS, SFO, WAW } = data.homes;
  const arcs = [arcPoints(BOS, SFO, 90), arcPoints(BOS, WAW, 140)];
  return { dots, borders, graticule, arcs };
}

export default function Globe() {
  const data = useGlobeData();
  const built = useMemo(() => (data ? build(data) : null), [data]);
  const root = useRef<Group>(null);
  const tilt = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const state = useRef({ spin: -1.05, tilt: 0.42, vel: 0 });

  const mats = useMemo(
    () => ({
      dots: pointsMaterial(dotVert, dotFrag, {
        uHover: { value: -1 },
        uLand: { value: col(PAPER) },
        uBrass: { value: col(BRASS) },
        uHot: { value: col(BRASS_2) },
      }),
      arcs: pointsMaterial(arcVert, arcFrag, { uColor: { value: col(BRASS_2) } }, true),
      shell: new ShaderMaterial({
        vertexShader: shellVert,
        fragmentShader: shellFrag,
        transparent: true,
        uniforms: { uBase: { value: col(INK_2) }, uRim: { value: col(BRASS) }, uWeight: { value: 1 } },
      }),
      border: new LineBasicMaterial({ color: BRASS_2, transparent: true, opacity: 0.85, depthWrite: false }),
      grid: new LineBasicMaterial({ color: PAPER, transparent: true, opacity: 0.06, depthWrite: false }),
      stamp: new MeshBasicMaterial({ color: RED, transparent: true, side: DoubleSide, depthWrite: false }),
      home: new MeshBasicMaterial({ color: PAPER, transparent: true, depthWrite: false }),
      pulse: new MeshBasicMaterial({ color: BRASS_2, transparent: true, side: DoubleSide, depthWrite: false }),
    }),
    [],
  );
  const shellGeo = useMemo(() => new SphereGeometry(GLOBE_R * 0.995, 56, 40), []);

  // Stamp marks where there is film, home-base beacons at BOS, SFO, WAW.
  const markers = useMemo(() => {
    if (!data) return null;
    const g = new Group();
    const stamps: Mesh[] = [];
    const pulses: Mesh[] = [];
    const outer = new RingGeometry(0.22, 0.27, 28);
    const inner = new RingGeometry(0.12, 0.14, 28);
    data.countries.forEach((c) => {
      if (photosFor(c.slug).length === 0) return;
      for (const geo of [outer, inner]) {
        const m = new Mesh(geo, mats.stamp);
        surfaceMark(m, c.anchor[0], c.anchor[1], 1.014);
        m.userData.phase = stamps.length * 0.9;
        g.add(m);
        stamps.push(m);
      }
    });
    const core = new RingGeometry(0, 0.09, 16);
    const ring = new RingGeometry(0.13, 0.16, 32);
    Object.values(data.homes).forEach(([lon, lat], i) => {
      const dot = new Mesh(core, mats.home);
      surfaceMark(dot, lon, lat, 1.016);
      g.add(dot);
      const p = new Mesh(ring, mats.pulse.clone());
      surfaceMark(p, lon, lat, 1.016);
      p.userData.phase = i / 3;
      g.add(p);
      pulses.push(p);
    });
    return { g, stamps, pulses };
  }, [data, mats]);

  const slugIndex = useMemo(() => new Map(data?.countries.map((c, i) => [c.slug, i]) ?? []), [data]);

  useFrame((three, dt) => {
    // Full strength at the header and over the stamps; quieter behind the flat map card,
    // brightening again whenever a stamp is hovered.
    const rs = flight.routeS;
    const behindMap = Math.max(0, 1 - Math.abs(rs - 1.47) / 0.18);
    const overStamps = Math.max(0, Math.min(1, (rs - 1.6) / 0.12));
    const quiet = 1 - 0.55 * behindMap - 0.4 * overStamps;
    const w = weight(1, rs) * Math.max(quiet, flight.hoverStamp ? 1 : 0) * (flight.portrait ? 0.65 : 1);
    const r = root.current;
    if (!r) return;
    r.visible = w > 0.002 && !!built;
    if (!r.visible) return;
    const t = flight.reduced ? 0 : three.clock.elapsedTime;
    const s = state.current;
    const px = three.viewport.dpr;

    // Rotation: hover a stamp to turn to it; otherwise drag, coast and drift.
    const hover = flight.hoverStamp;
    const hi = hover != null ? slugIndex.get(hover) : undefined;
    if (hi !== undefined && data) {
      const [lon, lat] = data.countries[hi].anchor;
      const targetSpin = (-lon * Math.PI) / 180 - Math.PI / 2;
      // shortest way round
      const delta = Math.atan2(Math.sin(targetSpin - s.spin), Math.cos(targetSpin - s.spin));
      const targetTilt = Math.max(-0.7, Math.min(0.9, (lat * Math.PI) / 180));
      if (flight.reduced) {
        s.spin += delta;
        s.tilt = targetTilt;
      } else {
        s.spin += delta * (1 - Math.exp(-4 * dt));
        s.tilt = damp(s.tilt, targetTilt, 4, dt);
      }
      s.vel = 0;
    } else {
      const drag = flight.globeDrag;
      if (drag.dx || drag.dy) {
        const d = drag.dx * 0.006;
        s.spin += d;
        s.vel = d / Math.max(dt, 1 / 120);
        s.tilt = Math.max(-0.7, Math.min(0.9, s.tilt + drag.dy * 0.004));
        drag.dx = 0;
        drag.dy = 0;
      } else if (!flight.reduced) {
        s.vel = damp(s.vel, drag.active ? 0 : 0.07, 1.4, dt);
        s.spin += s.vel * dt;
      }
    }
    spin.current!.rotation.y = s.spin;
    tilt.current!.rotation.x = s.tilt;

    const du = mats.dots.uniforms;
    du.uTime.value = t;
    du.uWeight.value = w;
    du.uPixel.value = px;
    du.uHover.value = hi ?? -1;
    mats.arcs.uniforms.uTime.value = t;
    mats.arcs.uniforms.uWeight.value = w;
    mats.arcs.uniforms.uPixel.value = px;
    mats.shell.uniforms.uWeight.value = w;
    mats.border.opacity = 0.85 * w;
    mats.grid.opacity = 0.06 * w;
    mats.home.opacity = w;
    mats.stamp.opacity = 0.95 * w;

    if (markers) {
      // Home bases ping outward and fade, staggered a third of a beat apart.
      for (const m of markers.pulses) {
        const k = (t * 0.45 + m.userData.phase) % 1;
        m.scale.setScalar(1 + k * 2.2);
        (m.material as MeshBasicMaterial).opacity = w * 0.85 * (1 - k) * clamp01(k * 6);
      }
      for (const m of markers.stamps) m.scale.setScalar(1 + 0.08 * Math.sin(t * 2 + m.userData.phase));
    }
  });

  return (
    <group ref={root} position={WORLD.globe} visible={false}>
      <group ref={tilt}>
        <group ref={spin}>
          <mesh geometry={shellGeo} material={mats.shell} renderOrder={0} />
          {built && (
            <>
              <lineSegments geometry={built.graticule} material={mats.grid} renderOrder={1} />
              <points geometry={built.dots} material={mats.dots} renderOrder={2} />
              <lineSegments geometry={built.borders} material={mats.border} renderOrder={3} />
              {built.arcs.map((g, i) => (
                <points key={i} geometry={g} material={mats.arcs} renderOrder={4} />
              ))}
            </>
          )}
          {markers && <primitive object={markers.g} />}
        </group>
      </group>
    </group>
  );
}
