"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Group, MeshLambertMaterial, PlaneGeometry, ShaderMaterial } from "three";
import { BRASS_2, INK_2, PAPER, RED, col } from "../lib";
import { WORLD, weight } from "../route";
import { flight } from "../store";

const LENGTH = 130;
const HALF = 2.6;
const BARS = 14;

// kinds: 0 edge, 1 centerline, 2 threshold, 3 far end, 4 approach
function lights() {
  const pos: number[] = [];
  const kind: number[] = [];
  const seq: number[] = [];
  const add = (x: number, z: number, k: number, s = 0) => {
    pos.push(x, 0.06, z);
    kind.push(k);
    seq.push(s);
  };
  for (let z = 0; z >= -LENGTH; z -= 3) {
    add(-HALF, z, 0);
    add(HALF, z, 0);
  }
  for (let z = -2; z >= -LENGTH; z -= 5) add(0, z, 1);
  for (let x = -HALF; x <= HALF + 1e-6; x += 0.4) {
    add(x, 0.4, 2);
    add(x, -LENGTH, 3);
  }
  // Approach bars in front of the threshold; the strobe runs from the far bar in.
  for (let b = 0; b < BARS; b++) {
    const z = 3 + b * 3;
    for (let x = -0.8; x <= 0.8 + 1e-6; x += 0.4) add(x, z, 4, (BARS - 1 - b) / BARS);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("aKind", new BufferAttribute(new Float32Array(kind), 1));
  g.setAttribute("aSeq", new BufferAttribute(new Float32Array(seq), 1));
  return g;
}

const vert = /* glsl */ `
attribute float aKind;
attribute float aSeq;
uniform float uTime;
uniform float uWeight;
uniform float uPixel;
uniform float uLand;
varying float vKind;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = -mv.z;
  float base = aKind == 1.0 ? 2.0 : aKind == 4.0 ? 2.6 : 3.4;
  float strobe = 0.0;
  if (aKind == 4.0) {
    // the "rabbit": a flash that races along the approach bars toward the runway
    float head = fract(uTime * 0.9);
    strobe = exp(-pow((aSeq - head) * 12.0, 2.0));
  }
  gl_PointSize = uPixel * (base + strobe * 6.0) * clamp(60.0 / depth, 0.55, 4.0);
  float far = smoothstep(150.0, 40.0, depth);
  float a = aKind == 1.0 ? 0.35 : aKind == 4.0 ? 0.3 + strobe * 0.9 : 0.85;
  vAlpha = uWeight * a * mix(0.55, 1.0, uLand) * mix(0.35, 1.0, far);
  vKind = aKind;
}`;
const frag = /* glsl */ `
uniform vec3 uWarm;
uniform vec3 uCool;
uniform vec3 uEnd;
varying float vKind;
varying float vAlpha;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r > 1.0) discard;
  float core = smoothstep(0.35, 0.0, r);
  float halo = pow(1.0 - r, 2.0) * 0.45;
  vec3 c = vKind == 3.0 ? uEnd : vKind == 1.0 || vKind == 4.0 ? uCool : uWarm;
  gl_FragColor = vec4(c, vAlpha * (core + halo));
  #include <colorspace_fragment>
}`;

export default function Runway() {
  const root = useRef<Group>(null);
  const geo = useMemo(() => lights(), []);
  const ground = useMemo(() => new PlaneGeometry(90, 220).rotateX(-Math.PI / 2), []);
  const strip = useMemo(() => new PlaneGeometry(HALF * 2, LENGTH).rotateX(-Math.PI / 2), []);
  const mats = useMemo(
    () => ({
      lights: new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uWeight: { value: 1 },
          uPixel: { value: 1 },
          uLand: { value: 0 },
          uWarm: { value: col(BRASS_2) },
          uCool: { value: col(PAPER) },
          uEnd: { value: col(RED) },
        },
      }),
      ground: new MeshLambertMaterial({ color: "#090d1b" }),
      strip: new MeshLambertMaterial({ color: INK_2 }),
    }),
    [],
  );

  useFrame((state) => {
    const w = weight(6, flight.routeS);
    const g = root.current!;
    g.visible = w > 0.002;
    if (!g.visible) return;
    const u = mats.lights.uniforms;
    u.uTime.value = flight.reduced ? 0 : state.clock.elapsedTime;
    u.uWeight.value = w;
    u.uPixel.value = state.viewport.dpr;
    // Lights come up as the camera settles onto the approach.
    u.uLand.value = Math.max(0, Math.min(1, (flight.routeS - 6.1) / 0.8));
  });

  return (
    <group ref={root} position={WORLD.runway} visible={false}>
      <mesh geometry={ground} material={mats.ground} position={[0, -0.02, -40]} />
      <mesh geometry={strip} material={mats.strip} position={[0, 0, -LENGTH / 2]} />
      <points geometry={geo} material={mats.lights} frustumCulled={false} />
    </group>
  );
}
