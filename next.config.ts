import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: the site is plain HTML/JS/CSS, so it can live on GitHub
  // Pages, Vercel, or any bucket.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  // The dev server runs on the Mac mini and is opened over Tailscale from the
  // MacBook and iPhone.
  allowedDevOrigins: [
    "100.120.219.83",
    "davids-mac-mini",
    "davids-mac-mini.tail41525f.ts.net",
  ],
};

export default nextConfig;
