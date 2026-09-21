"use client";

import { useState } from "react";
import geo from "@/data/geo.generated.json";
import countries from "@/data/countries.json";
import { profile } from "@/data/site";
import Plane from "./Plane";

const nameOf = new Map(countries.map((c) => [c.slug, c.name]));

/** Home-base airport code to the projected city point it maps onto. */
const CITY_POINT: Record<string, string> = {
  BOS: "boston",
  WAW: "warsaw",
  MXP: "milan",
  SFO: "menloPark",
};

/** Quadratic arc between two projected points, bowed toward the top. */
function arc(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  return `M${a.x},${a.y} Q${mx},${my - d * 0.28} ${b.x},${b.y}`;
}

export default function WorldMap({
  onPick,
  highlight,
}: {
  onPick?: (slug: string) => void;
  highlight?: string | null;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const active = hover ?? highlight ?? null;
  const cp = geo.cityPoints as Record<string, { x: number; y: number }>;
  // Home bases, and the legs between Boston and each of the others.
  const bases = profile.bases
    .map((b) => ({ code: b.code, pt: cp[CITY_POINT[b.code]] }))
    .filter((b) => b.pt);
  const routes = bases.filter((b) => b.code !== "BOS").map((b) => [cp.boston, b.pt]);
  const activeMarker = active ? geo.markers.find((m) => m.slug === active) : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${geo.width} ${geo.height}`}
        className="h-auto w-full"
        role="img"
        aria-label="World map with the 23 countries David has visited highlighted"
      >
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d4a853" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#d4a853" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={geo.sphere} fill="rgba(243,234,216,0.02)" stroke="rgba(243,234,216,0.12)" strokeWidth="1" />
        {geo.countries.map((c, i) => {
          const visited = !!c.slug;
          const isActive = visited && c.slug === active;
          return (
            <path
              key={c.id ?? i}
              d={c.d}
              fill={visited ? (isActive ? "#f3ead8" : "rgba(212,168,83,0.78)") : "rgba(243,234,216,0.06)"}
              stroke={visited ? "rgba(11,16,32,0.6)" : "rgba(243,234,216,0.14)"}
              strokeWidth={visited ? 0.8 : 0.5}
              className={visited ? "cursor-pointer transition-[fill] duration-300" : undefined}
              onMouseEnter={visited ? () => setHover(c.slug) : undefined}
              onMouseLeave={visited ? () => setHover(null) : undefined}
              onClick={visited && c.slug ? () => onPick?.(c.slug as string) : undefined}
            />
          );
        })}

        {/* routes out of Boston */}
        <g fill="none" stroke="rgba(243,234,216,0.55)" strokeWidth="1.2">
          {routes.map(([a, b], i) => (
            <path key={i} d={arc(a, b)} className="route-dash" />
          ))}
        </g>

        {/* markers */}
        {geo.markers.map((m) => (
          <g key={m.slug} transform={`translate(${m.x} ${m.y})`} className="pointer-events-none">
            <circle r="7" fill="url(#glow)" />
            <circle r="4" fill="none" stroke="#f3ead8" strokeWidth="0.8" className="ping-soft" opacity="0.6" />
            <circle r="1.8" fill="#f3ead8" />
          </g>
        ))}

        {/* home bases */}
        {bases.map(({ code, pt }) => (
          <g key={code} transform={`translate(${pt.x} ${pt.y})`} className="pointer-events-none">
            <circle r="3" fill="#d63a2f" stroke="#0b1020" strokeWidth="0.8" />
            <text x="6" y="-5" fontFamily="var(--font-mono)" fontSize="11" fill="#f3ead8" letterSpacing="1.5">
              {code}
            </text>
          </g>
        ))}

        {activeMarker && (
          <g transform={`translate(${activeMarker.x} ${activeMarker.y - 16})`} className="pointer-events-none">
            <rect x="-60" y="-16" width="120" height="20" rx="3" fill="#f3ead8" />
            <text
              textAnchor="middle"
              y="-2"
              fontFamily="var(--font-mono)"
              fontSize="11"
              fontWeight="600"
              fill="#0b1020"
              letterSpacing="1.5"
            >
              {nameOf.get(active as string)?.toUpperCase()}
            </text>
          </g>
        )}
      </svg>
      <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-fg-dim">
        <Plane size={12} /> ROUTES OUT OF BOS
      </div>
    </div>
  );
}
