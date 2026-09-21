import geo from "@/data/geo.generated.json";

const INKS = ["var(--stamp-red)", "var(--stamp-blue)", "var(--stamp-green)", "var(--stamp-violet)"];

/** Passport stamp with the country's real outline. Deterministic tilt/ink per index. */
export default function Stamp({
  slug,
  name,
  iso,
  region,
  index,
}: {
  slug: string;
  name: string;
  iso: string;
  region: string;
  index: number;
}) {
  const d = (geo.stamps as Record<string, string>)[slug];
  const ink = INKS[index % INKS.length];
  const tilt = ((index * 37) % 13) - 6;
  const S = geo.stampSize;
  const label = name.toUpperCase();
  const fontSize = label.length > 16 ? 9.5 : label.length > 11 ? 11 : 12.5;

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      className="h-full w-full"
      style={{ transform: `rotate(${tilt}deg)` }}
      aria-hidden
    >
      <g filter="url(#ink-grain)" style={{ color: ink }} stroke="currentColor" fill="none">
        <rect x="6" y="6" width={S - 12} height={S - 12} rx="18" strokeWidth="3.5" opacity="0.9" />
        <rect x="14" y="14" width={S - 28} height={S - 28} rx="13" strokeWidth="1.2" opacity="0.7" />
        <path d={d} strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.14" />
        <g fill="currentColor" stroke="none" fontFamily="var(--font-mono)" fontWeight="600" textAnchor="middle" opacity="0.92">
          <text x={S / 2} y="34" fontSize={fontSize} letterSpacing="2">
            {label}
          </text>
          <text x={S / 2} y={S - 26} fontSize="9" letterSpacing="2.5">
            {iso} · {region.toUpperCase()}
          </text>
        </g>
      </g>
    </svg>
  );
}

/** Shared ink-bleed filter. Render once per page. */
export function StampDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <filter id="ink-grain" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" seed="7" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feComponentTransfer in="rough">
            <feFuncA type="table" tableValues="0 0.55 0.9 1" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
}
