import { BackSide, BufferGeometry, Color, ShaderMaterial, type ColorRepresentation } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// The site's tokens (src/app/globals.css). Stamp red is the one accent.
export const INK = "#0b1020";
export const INK_2 = "#111a33";
export const INK_3 = "#182347";
export const PAPER = "#f3ead8";
export const BRASS = "#d4a853";
export const BRASS_2 = "#f0cf85";
export const RED = "#d63a2f";
export const OUTLINE = "#04060d";

export const FOG_DENSITY = 0.026;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
export const smoother = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Frame-rate independent exponential approach. */
export const damp = (a: number, b: number, lambda: number, dt: number) => lerp(a, b, 1 - Math.exp(-lambda * dt));

/** lon/lat in degrees to a unit vector: +y is north, lon 0 faces +x. */
export function lonLatToVec(lon: number, lat: number, r = 1): [number, number, number] {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo)];
}

/** Linear-space vec3 for a shader uniform, from a site hex colour. */
export const col = (c: ColorRepresentation) => new Color(c);

/**
 * Exp2 fog and output encoding for the hand-written shaders, which do not
 * include three's fog chunks. vDepth is view-space distance.
 */
export const FOG_GLSL = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogDensity;
float fogFactor(float depth) {
  float d = uFogDensity * depth;
  return 1.0 - exp(-d * d);
}
`;

export const fogUniforms = () => ({
  uFogColor: { value: col(INK) },
  uFogDensity: { value: FOG_DENSITY },
});

/**
 * Inverse-hull outline: the same geometry inflated along smooth normals and
 * drawn back faces only. Vertices are merged first so faces of a box stay
 * joined at the corners instead of splitting apart.
 */
export function hullGeometry(geo: BufferGeometry) {
  const g = geo.clone();
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  const merged = mergeVertices(g, 1e-3);
  merged.computeVertexNormals();
  g.dispose();
  return merged;
}

export function outlineMaterial(color: ColorRepresentation = OUTLINE, thickness = 0.035) {
  return new ShaderMaterial({
    side: BackSide,
    uniforms: { uColor: { value: col(color) }, uThickness: { value: thickness }, uOpacity: { value: 1 }, ...fogUniforms() },
    transparent: true,
    vertexShader: /* glsl */ `
      uniform float uThickness;
      varying float vDepth;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position + normal * uThickness, 1.0);
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vDepth;
      ${FOG_GLSL}
      void main() {
        gl_FragColor = vec4(mix(uColor, uFogColor, fogFactor(vDepth)), uOpacity);
        #include <colorspace_fragment>
      }`,
  });
}

/** Deterministic PRNG so every visitor sees the same sky. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
