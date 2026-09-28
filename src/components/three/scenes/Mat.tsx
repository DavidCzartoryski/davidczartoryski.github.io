"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  Group,
  MeshLambertMaterial,
  PlaneGeometry,
  ShaderMaterial,
} from "three";
import { INK, INK_2, PAPER, col, hullGeometry, outlineMaterial, rng } from "../lib";
import { WORLD, weight } from "../route";
import { flight } from "../store";

const DUST = 1400;
const SIZE = 18;

// The mat, drawn like the ink wrestlers: dry-brush paper strokes on navy.
// Everything is in one fragment shader on a single floor quad.
const matVert = /* glsl */ `
varying vec2 vP;
varying float vDepth;
void main() {
  // the quad lies flat, so its plane is x/z
  vP = position.xz;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const matFrag = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uWeight;
uniform float uTime;
varying vec2 vP;
varying float vDepth;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
// A hand-drawn ring: the radius wobbles, the bristles drop out in streaks.
float stroke(float r, float ang, float R, float w, float seed) {
  float wob = (noise(vec2(ang * 3.0, seed)) - 0.5) * w * 1.6;
  float edge = abs(r - R - wob);
  float body = 1.0 - smoothstep(w * 0.35, w * 0.5, edge);
  float bristle = smoothstep(0.25, 0.65, noise(vec2(ang * 40.0 + seed, r * 30.0)));
  return body * mix(0.35, 1.0, bristle);
}
float bar(vec2 p, vec2 c, vec2 extent) {
  vec2 d = abs(p - c) - extent;
  float body = 1.0 - smoothstep(0.0, 0.03, max(d.x, d.y));
  return body * mix(0.4, 1.0, smoothstep(0.2, 0.7, noise(p * 22.0)));
}
void main() {
  float r = length(vP);
  float ang = atan(vP.y, vP.x);
  float ink = 0.0;
  ink = max(ink, stroke(r, ang, 6.0, 0.22, 1.0));
  ink = max(ink, stroke(r, ang, 6.45, 0.07, 7.0) * step(0.35, noise(vec2(ang * 6.0, 3.0))));
  ink = max(ink, stroke(r, ang, 1.5, 0.1, 4.0));
  // the starting line: one short, straight stroke through the centre
  ink = max(ink, bar(vP, vec2(0.0, 0.0), vec2(0.5, 0.035)) * 0.8);
  // Cross-hatching inside the circle, like the shading in the illustration.
  float hatch = step(0.82, fract((vP.x + vP.y) * 3.2)) * step(r, 5.7) * step(1.2, r);
  hatch *= smoothstep(0.35, 0.8, noise(vP * 1.4)) * 0.22;
  ink = max(ink, hatch);
  // The mat square, drawn loosely and broken at the corners.
  vec2 q = abs(vP);
  float sq = 1.0 - smoothstep(0.02, 0.06, abs(max(q.x, q.y) - 8.0));
  ink = max(ink, sq * step(max(q.x, q.y) - min(q.x, q.y), 7.0) * 0.5);
  float fade = 1.0 - smoothstep(6.5, 9.0, r) * 0.6;
  float fog = 1.0 - exp(-pow(0.026 * vDepth, 2.0));
  vec3 c = mix(uInk, uPaper, ink * 0.9);
  gl_FragColor = vec4(mix(c, uInk, fog), uWeight * max(ink, 0.0) * fade);
  #include <colorspace_fragment>
}`;

// Chalk dust: drifts down, lands on the mat and fades where it settled.
const dustVert = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uWeight;
uniform float uPixel;
varying float vAlpha;
void main() {
  float s = aSeed;
  float cycle = fract(uTime * (0.05 + s * 0.05) + s);
  float fall = clamp(cycle / 0.55, 0.0, 1.0);
  float settle = clamp((cycle - 0.55) / 0.45, 0.0, 1.0);
  vec3 p = position;
  p.y = mix(position.y, 0.03, fall * fall * (3.0 - 2.0 * fall));
  p.x += sin(uTime * 0.4 + s * 30.0) * 0.4 * (1.0 - fall);
  p.z += cos(uTime * 0.3 + s * 20.0) * 0.4 * (1.0 - fall);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPixel * (1.2 + s * 1.8) * clamp(12.0 / -mv.z, 0.5, 2.0);
  vAlpha = uWeight * (0.2 + 0.6 * fall) * (1.0 - settle);
}`;
const dustFrag = /* glsl */ `
uniform vec3 uPaper;
varying float vAlpha;
void main() {
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  gl_FragColor = vec4(uPaper, vAlpha * smoothstep(0.5, 0.1, r));
  #include <colorspace_fragment>
}`;

export default function MatScene() {
  const root = useRef<Group>(null);
  const floor = useMemo(() => new PlaneGeometry(SIZE, SIZE).rotateX(-Math.PI / 2), []);
  // The mat itself: a low disc with a thick paper outline, the sketch treatment.
  const disc = useMemo(() => {
    const geo = new CylinderGeometry(6.9, 6.9, 0.16, 72);
    return { geo, hull: hullGeometry(geo), mat: new MeshLambertMaterial({ color: INK_2 }), line: outlineMaterial(PAPER, 0.07) };
  }, []);
  const dust = useMemo(() => {
    const rand = rng(64);
    const pos = new Float32Array(DUST * 3);
    const seed = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 7;
      pos.set([Math.cos(a) * r, 1 + rand() * 7, Math.sin(a) * r], i * 3);
      seed[i] = rand();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    return g;
  }, []);
  const mats = useMemo(
    () => ({
      mat: new ShaderMaterial({
        vertexShader: matVert,
        fragmentShader: matFrag,
        transparent: true,
        depthWrite: false,
        uniforms: { uInk: { value: col(INK) }, uPaper: { value: col(PAPER) }, uWeight: { value: 1 }, uTime: { value: 0 } },
      }),
      dust: new ShaderMaterial({
        vertexShader: dustVert,
        fragmentShader: dustFrag,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uWeight: { value: 1 }, uPixel: { value: 1 }, uPaper: { value: col(PAPER) } },
      }),
    }),
    [],
  );

  useFrame((state) => {
    const w = weight(4, flight.routeS) * (flight.portrait ? 0.6 : 1);
    const g = root.current!;
    g.visible = w > 0.002;
    if (!g.visible) return;
    const t = flight.reduced ? 0 : state.clock.elapsedTime;
    mats.mat.uniforms.uWeight.value = w;
    disc.line.uniforms.uOpacity.value = 0.85 * w;
    mats.dust.uniforms.uWeight.value = w;
    mats.dust.uniforms.uTime.value = t;
    mats.dust.uniforms.uPixel.value = state.viewport.dpr;
    dust.setDrawRange(0, Math.floor(DUST * flight.quality));
    // The whole mat turns slowly under the camera.
    g.rotation.y = flight.reduced ? 0 : t * 0.03;
  });

  return (
    <group ref={root} position={WORLD.mat} visible={false}>
      <mesh geometry={disc.geo} material={disc.mat} position={[0, -0.09, 0]}>
        <mesh geometry={disc.hull} material={disc.line} />
      </mesh>
      <mesh geometry={floor} material={mats.mat} position={[0, 0.005, 0]} />
      <points geometry={dust} material={mats.dust} />
    </group>
  );
}
