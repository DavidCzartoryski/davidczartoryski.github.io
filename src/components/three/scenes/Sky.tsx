"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  type Mesh,
  type PerspectiveCamera,
  ShaderMaterial,
  Vector3,
} from "three";
import { BRASS_2, PAPER, clamp01, col, damp, rng } from "../lib";
import { buildPlane } from "../plane";
import { weight } from "../route";
import { flight } from "../store";

const STARS = 2600;
const DUST = 2200;
const HOLD_MS = 1200;
const RING_DELAY_MS = 140;

const vert = /* glsl */ `
attribute float aSeed;
attribute float aKind;
uniform float uTime;
uniform float uWeight;
uniform float uHold;
uniform float uIntro;
uniform float uDive;
uniform float uPixel;
uniform float uStrength;
uniform float uAspect;
uniform vec2 uPointer;
uniform vec3 uPlane;
varying float vAlpha;
varying float vKind;
varying float vGlow;
void main() {
  vec3 p = position;
  float s = aSeed;
  bool dust = aKind > 0.5;
  if (dust) {
    // The cloud deck drifts past, wrapping so it never runs out.
    p.x = mod(p.x + 32.0 + uTime * (0.22 + s * 0.3), 64.0) - 32.0;
    p.y += sin(uTime * 0.3 + s * 40.0) * 0.12;
  }
  // Entrance: the field streams in from behind the horizon.
  float intro = clamp(uIntro * 1.3 - s * 0.3, 0.0, 1.0);
  intro = intro * intro * (3.0 - 2.0 * intro);
  p.z -= (1.0 - intro) * (16.0 + s * 18.0);

  // Hold to board: particles gather into a slow orbit around the plane.
  float h = clamp(uHold * 1.35 - s * 0.35, 0.0, 1.0);
  h = h * h * (3.0 - 2.0 * h);
  float ang = s * 43.98 + uTime * (1.1 + s * 1.3);
  float rad = 0.45 + s * 2.1;
  vec3 orbit = uPlane + vec3(cos(ang) * rad, sin(ang) * rad * 0.5, sin(ang * 0.5) * rad * 0.7);
  p = mix(p, orbit, h * (dust ? 0.7 : 0.92));

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  // Cursor pushes particles aside in screen space, so near and far agree.
  vec4 clip = projectionMatrix * mv;
  vec2 d = (clip.xy / clip.w - uPointer) * vec2(uAspect, 1.0);
  float push = uStrength * smoothstep(0.34, 0.0, length(d)) * (1.0 - h);
  mv.xy += normalize(d + 1e-5) * push * (-mv.z) * 0.13;
  gl_Position = projectionMatrix * mv;

  float depth = -mv.z;
  float size = dust ? (2.6 + s * 4.0) * clamp(14.0 / depth, 0.4, 2.2) : (1.0 + s * 1.7);
  gl_PointSize = size * uPixel * (1.0 + uDive * 1.8 + h * 0.7);
  float tw = dust ? 1.0 : 0.55 + 0.45 * sin(uTime * (0.7 + s * 2.2) + s * 60.0);
  float far = dust ? smoothstep(34.0, 10.0, depth) : 1.0;
  vAlpha = uWeight * intro * tw * far * (dust ? 0.22 : 0.9);
  vKind = aKind;
  vGlow = h;
}`;

const frag = /* glsl */ `
uniform vec3 uStar;
uniform vec3 uDust;
uniform vec3 uGlow;
varying float vAlpha;
varying float vKind;
varying float vGlow;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  float soft = vKind > 0.5 ? smoothstep(0.5, 0.0, r) : smoothstep(0.5, 0.12, r);
  vec3 c = mix(mix(uStar, uDust, vKind), uGlow, vGlow * 0.85);
  gl_FragColor = vec4(c, vAlpha * soft * (1.0 + vGlow));
  #include <colorspace_fragment>
}`;

function particleGeometry() {
  const n = STARS + DUST;
  const pos = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  const kind = new Float32Array(n);
  const rand = rng(2027);
  // Interleave the two kinds so trimming the draw range thins both evenly.
  for (let i = 0; i < n; i++) {
    const dust = rand() < DUST / n;
    kind[i] = dust ? 1 : 0;
    seed[i] = rand();
    if (dust) {
      pos.set([rand() * 64 - 32, -2.6 - rand() * 5, 9 - rand() * 37], i * 3);
    } else {
      const y = 0.5 + Math.pow(rand(), 0.8) * 24;
      pos.set([rand() * 90 - 45, y, -8 - rand() * 38], i * 3);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new BufferAttribute(seed, 1));
  g.setAttribute("aKind", new BufferAttribute(kind, 1));
  return g;
}

export default function Sky() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const group = useRef<Group>(null);
  const geo = useMemo(() => particleGeometry(), []);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uWeight: { value: 1 },
          uHold: { value: 0 },
          uIntro: { value: 0 },
          uDive: { value: 0 },
          uPixel: { value: 1 },
          uStrength: { value: 0 },
          uAspect: { value: 1 },
          uPointer: { value: [0, 0] },
          uPlane: { value: new Vector3() },
          uStar: { value: col(PAPER) },
          uDust: { value: col("#8f9bc4") },
          uGlow: { value: col(BRASS_2) },
        },
      }),
    [],
  );
  const plane = useMemo(() => buildPlane(), []);
  const home = useMemo(() => new Vector3(), []);
  const tmp = useMemo(() => new Vector3(), []);
  const st = useRef({ hold: 0, px: 0, py: 0, strength: 0, away: 0 });

  // Park the plane in the open sky above the boarding pass, whatever the aspect.
  const aspect = size.width / Math.max(1, size.height);
  useEffect(() => {
    const halfH = 12 * Math.tan((25 * Math.PI) / 180);
    const portrait = aspect < 0.9;
    const nx = portrait ? 0.56 : 0.5;
    const ny = portrait ? 0.8 : 0.56;
    home.set(nx * halfH * aspect, 0.4 + ny * halfH, 0);
    plane.scale.setScalar(Math.min(1, halfH * aspect * 0.12) * (portrait ? 0.8 : 1));
  }, [aspect, home, plane]);

  useFrame((state, dt) => {
    const now = performance.now();
    const s = st.current;
    const w = weight(0, flight.routeS);
    const g = group.current!;
    g.visible = w > 0.002;
    const u = mat.uniforms;
    const { ring, arc, hint } = flight.dom;

    // Hold progress; boarding fires from here so it lines up with the frame.
    let progress = 0;
    if (flight.hold.start) {
      progress = clamp01((now - flight.hold.start) / HOLD_MS);
      if (progress >= 1) flight.board();
    }
    flight.hold.progress = progress;
    s.hold = progress > s.hold ? damp(s.hold, progress, 10, dt) : damp(s.hold, 0, 2.6, dt);

    if (ring && arc) {
      const showing = flight.hold.start && now - flight.hold.start > RING_DELAY_MS;
      ring.style.opacity = showing ? "1" : "0";
      ring.style.transform = `translate(${flight.hold.x}px, ${flight.hold.y}px) scale(${showing ? 1 : 0.7})`;
      ring.style.transition = "opacity 180ms ease, transform 220ms ease";
      arc.style.strokeDashoffset = String(1 - progress);
    }

    if (!g.visible) {
      if (hint) hint.style.opacity = "0";
      return;
    }

    const t = state.clock.elapsedTime;
    u.uTime.value = flight.reduced ? 0 : t;
    u.uWeight.value = w;
    u.uHold.value = s.hold;
    u.uIntro.value = flight.reduced ? 1 : clamp01((now - flight.introAt) / 2600);
    const since = (now - flight.boardedAt) / 1000;
    u.uDive.value = flight.boardedAt && since < 1.4 ? Math.sin(Math.PI * clamp01(since / 1.4)) : 0;
    u.uPixel.value = state.viewport.dpr;
    u.uAspect.value = aspect;
    geo.setDrawRange(0, Math.floor((STARS + DUST) * flight.quality));

    // Cursor, or a slow wandering point on touch screens.
    const idle = flight.touch || !flight.pointer.inside;
    const tx = idle ? Math.sin(t * 0.23) * 0.5 : flight.pointer.x;
    const ty = idle ? Math.cos(t * 0.19) * 0.3 - 0.2 : flight.pointer.y;
    s.px = damp(s.px, tx, 6, dt);
    s.py = damp(s.py, ty, 6, dt);
    s.strength = damp(s.strength, flight.reduced ? 0 : idle ? 0.35 : 1, 3, dt);
    (u.uPointer.value as number[])[0] = s.px;
    (u.uPointer.value as number[])[1] = s.py;
    u.uStrength.value = s.strength;

    // Plane: cruising bob, levels out and trembles under a hold, leaves on boarding.
    const boardedRecently = flight.boardedAt > 0 && now - flight.boardedAt < 2600;
    s.away = damp(s.away, boardedRecently ? 1 : 0, boardedRecently ? 2.4 : 1.2, dt);
    const bob = flight.reduced ? 0 : Math.sin(t * 0.9) * 0.08;
    const shake = s.hold * (Math.random() - 0.5) * 0.02;
    // Seen three-quarters from above, nose toward the upper right, banking gently.
    const heading = plane.userData.heading as Group;
    const bank = plane.userData.bank as Group;
    heading.rotation.set(0, 0, 0.38 + s.away * 0.2);
    bank.rotation.set(1.02 + (flight.reduced ? 0 : Math.sin(t * 0.5) * 0.14) * (1 - s.hold), 0, 0);
    tmp.set(1, 0.25, -0.6).normalize().applyEuler(heading.rotation);
    plane.position.copy(home).addScaledVector(tmp, s.away * s.away * 45);
    plane.position.y += bob + shake;
    u.uPlane.value.copy(plane.position);
    const beacon = plane.userData.beacon as Mesh;
    beacon.visible = flight.reduced || Math.sin(t * 5) > 0.6;

    // "Press & hold" hint rides under the plane until the visitor has boarded once.
    if (hint) {
      const introIn = clamp01((now - flight.introAt - 1800) / 900);
      const a = flight.reduced || flight.boardedAt ? 0 : clamp01(1 - flight.routeS * 4) * (1 - s.hold) * introIn;
      tmp.copy(plane.position);
      tmp.y -= 1.35 * plane.scale.y;
      tmp.project(camera);
      const x = ((tmp.x + 1) / 2) * size.width;
      const y = ((1 - tmp.y) / 2) * size.height + 10;
      hint.style.opacity = a.toFixed(3);
      hint.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  });

  return (
    <group ref={group}>
      <points geometry={geo} material={mat} frustumCulled={false} />
      <primitive object={plane} />
    </group>
  );
}
