import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: the site is plain HTML/JS/CSS, so it can live on GitHub
  // Pages, Vercel, or any bucket.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  // The dev server is reached over Tailscale from other machines.
  allowedDevOrigins: ["100.80.149.7", "devbox1", "devbox1.tail4a5f8f.ts.net"],
};

export default nextConfig;
