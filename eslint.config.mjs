import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Static export ships unoptimized images on purpose; next/image adds nothing here.
      "@next/next/no-img-element": "off",
    },
  },
  {
    // The WebGL layer mutates three.js objects (positions, uniforms, geometry
    // ranges) inside useFrame by design: that is how React Three Fiber avoids a
    // React render per frame. The compiler's immutability rule reads those as
    // mutations of hook values, so it is off for this directory only.
    files: ["src/components/three/**"],
    rules: { "react-hooks/immutability": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
