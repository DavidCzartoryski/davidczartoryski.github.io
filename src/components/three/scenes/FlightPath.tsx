"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Group,
  LineBasicMaterial,
  ShaderMaterial,
  Vector3,
} from "three";
import { BRASS, BRASS_2, PAPER, clamp01, col, damp } from "../lib";
import { buildPlane } from "../plane";
import { WORLD, weight } from "../route";
import { flight } from "../store";

// One waypoint per flight-log card, newest first, then the origin.
const WAYPOINTS = [
  [-10, 1.3, 0],
  [-5, -0.7, -1.6],
  [0, 0.9, 0.4],
  [5, -0.9, -1.2],
  [10, 0.5, 0.8],
] as const;
const DASHES = 150;

const lightVert = /* glsl */ `
attribute float aLit;
attribute float aFlash;
uniform float uWeight;
uniform float uPixel;
uniform float uTime;
varying float vLit;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float breathe = 0.85 + 0.15 * sin(uTime * 2.0 + position.x);
  gl_PointSize = uPixel * (10.0 + aLit * 34.0 * breathe + aFlash * 60.0) * clamp(15.0 / -mv.z, 0.5, 2.0);
  vLit = aLit;
  vAlpha = uWeight * (0.35 + 0.65 * aLit + aFlash * 0.4);
}`;
const lightFrag = /* glsl */ `
uniform vec3 uCold;
uniform vec3 uHot;
varying float vLit;
varying float vAlpha;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r > 1.0) discard;
  float core = smoothstep(0.28, 0.0, r);
  float halo = pow(1.0 - r, 2.2) * 0.55;
  vec3 c = mix(uCold, uHot, vLit);
  gl_FragColor = vec4(c, vAlpha * (core + halo * vLit));
  #include <colorspace_fragment>
}`;

export default function FlightPath() {
  const root = useRef<Group>(null);
  const { curve, dashes, flown, lights } = useMemo(() => {
    const pts = WAYPOINTS.map(([x, y, z]) => new Vector3(x, y, z));
    // Lead in and out so the route enters and leaves the frame.
    const curve = new CatmullRomCurve3([new Vector3(-16, 3.2, 2), ...pts, new Vector3(16, -2, 2)], false, "centripetal");
    const seg = (from: number, to: number) => {
      const arr: number[] = [];
      for (let i = 0; i < DASHES; i++) {
        const a = from + ((to - from) * i) / DASHES;
        const b = a + ((to - from) / DASHES) * 0.55;
        arr.push(...curve.getPointAt(a).toArray(), ...curve.getPointAt(b).toArray());
      }
      const g = new BufferGeometry();
      g.setAttribute("position", new BufferAttribute(new Float32Array(arr), 3));
      return g;
    };
    const dashes = seg(0, 1);
    const flown = seg(0, 1);
    const lights = new BufferGeometry();
    lights.setAttribute("position", new BufferAttribute(new Float32Array(pts.flatMap((p) => p.toArray())), 3));
    lights.setAttribute("aLit", new BufferAttribute(new Float32Array(pts.length), 1));
    lights.setAttribute("aFlash", new BufferAttribute(new Float32Array(pts.length), 1));
    return { curve, dashes, flown, lights };
  }, []);

  const mats = useMemo(
    () => ({
      dash: new LineBasicMaterial({ color: PAPER, transparent: true, opacity: 0.22, depthWrite: false }),
      flown: new LineBasicMaterial({ color: BRASS_2, transparent: true, opacity: 0.9, depthWrite: false }),
      light: new ShaderMaterial({
        vertexShader: lightVert,
        fragmentShader: lightFrag,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uWeight: { value: 1 },
          uPixel: { value: 1 },
          uTime: { value: 0 },
          uCold: { value: col(PAPER) },
          uHot: { value: col(BRASS) },
        },
      }),
    }),
    [],
  );
  const plane = useMemo(() => {
    const p = buildPlane();
    p.scale.setScalar(0.42);
    return p;
  }, []);
  const lit = useRef(WAYPOINTS.map(() => ({ v: 0, flash: 0, was: false })));
  const tan = useMemo(() => new Vector3(), []);
  const at = useMemo(() => new Vector3(), []);

  useFrame((state, dt) => {
    const w = weight(2, flight.routeS);
    const g = root.current!;
    g.visible = w > 0.002;
    if (!g.visible) return;
    const t = flight.reduced ? 0 : state.clock.elapsedTime;

    // Waypoints ignite once, with a flash, as their cards scroll into view.
    const aLit = lights.attributes.aLit as BufferAttribute;
    const aFlash = lights.attributes.aFlash as BufferAttribute;
    lit.current.forEach((l, i) => {
      const on = flight.legs[i];
      if (on && !l.was) l.flash = 1;
      l.was = on;
      l.v = flight.reduced ? (on ? 1 : 0) : damp(l.v, on ? 1 : 0, 3, dt);
      l.flash = flight.reduced ? 0 : damp(l.flash, 0, 2.5, dt);
      aLit.setX(i, l.v);
      aFlash.setX(i, l.flash);
    });
    aLit.needsUpdate = true;
    aFlash.needsUpdate = true;

    // The little plane flies the route with the scroll; the part behind it turns brass.
    const f = clamp01((flight.routeS - 2.05) / 0.85);
    const u = 0.04 + f * 0.92;
    curve.getPointAt(u, at);
    curve.getTangentAt(u, tan);
    plane.position.copy(at);
    plane.position.y += 0.35 + (flight.reduced ? 0 : Math.sin(t * 1.4) * 0.05);
    plane.rotation.set(0, Math.atan2(-tan.z, tan.x), Math.asin(Math.max(-1, Math.min(1, tan.y))));
    flown.setDrawRange(0, Math.floor(u * DASHES) * 2);

    mats.dash.opacity = 0.22 * w;
    mats.flown.opacity = 0.9 * w;
    mats.light.uniforms.uWeight.value = w;
    mats.light.uniforms.uPixel.value = state.viewport.dpr;
    mats.light.uniforms.uTime.value = t;
  });

  return (
    <group ref={root} position={WORLD.log} visible={false}>
      <lineSegments geometry={dashes} material={mats.dash} />
      <lineSegments geometry={flown} material={mats.flown} />
      <points geometry={lights} material={mats.light} />
      <primitive object={plane} />
    </group>
  );
}
