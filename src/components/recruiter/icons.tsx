import {
  siAmd,
  siAngular,
  siC,
  siClaude,
  siCplusplus,
  siDjango,
  siDocker,
  siExpress,
  siFastapi,
  siGit,
  siGithub,
  siGithubactions,
  siGnubash,
  siGrafana,
  siHtml5,
  siJavascript,
  siLinux,
  siMongodb,
  siNextdotjs,
  siNodedotjs,
  siNvidia,
  siOpenjdk,
  siOpentelemetry,
  siPostgresql,
  siPrometheus,
  siPython,
  siPytorch,
  siRacket,
  siReact,
  siRust,
  siShopify,
  siSupabase,
  siSwift,
  siTypescript,
  type SimpleIcon,
} from "simple-icons";

/** Skill name (as written in site.ts) → brand mark. Anything missing gets a plain dot. */
const BRANDS: Record<string, SimpleIcon> = {
  Python: siPython,
  TypeScript: siTypescript,
  JavaScript: siJavascript,
  Java: siOpenjdk,
  "C++": siCplusplus,
  C: siC,
  Rust: siRust,
  Swift: siSwift,
  Bash: siGnubash,
  Racket: siRacket,
  Liquid: siShopify,
  "HTML/CSS": siHtml5,
  React: siReact,
  "Next.js": siNextdotjs,
  "Node.js": siNodedotjs,
  Express: siExpress,
  FastAPI: siFastapi,
  Django: siDjango,
  Angular: siAngular,
  SwiftUI: siSwift,
  "React Native": siReact,
  "Claude tool use": siClaude,
  PyTorch: siPytorch,
  "PyTorch distributed": siPytorch,
  NCCL: siNvidia,
  RCCL: siAmd,
  CUDA: siNvidia,
  "CUDA streams": siNvidia,
  ROCm: siAmd,
  Git: siGit,
  Linux: siLinux,
  Docker: siDocker,
  PostgreSQL: siPostgresql,
  Supabase: siSupabase,
  MongoDB: siMongodb,
  "GitHub Actions": siGithubactions,
  OpenTelemetry: siOpentelemetry,
  Prometheus: siPrometheus,
  Grafana: siGrafana,
};

/** Brand colours that would vanish on the near-black page fall back to the text colour. */
function onDark(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.22 ? "var(--cv-fg)" : `#${hex}`;
}

export function Brand({ name, size = 14 }: { name: string; size?: number }) {
  const icon = BRANDS[name];
  if (!icon)
    return <span aria-hidden className="mx-[3px] h-[6px] w-[6px] shrink-0 rounded-full bg-cv-line-2" />;
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} className="shrink-0" fill={onDark(icon.hex)}>
      <path d={icon.path} />
    </svg>
  );
}

type Props = { className?: string; size?: number };

function Line({ className, size = 14, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className ?? ""}`}
    >
      {children}
    </svg>
  );
}

export const ArrowLeft = (p: Props) => (
  <Line {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Line>
);
export const ArrowUp = (p: Props) => (
  <Line {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Line>
);
export const ArrowOut = (p: Props) => (
  <Line {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </Line>
);
export const Download = (p: Props) => (
  <Line {...p}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Line>
);
export const Chevron = (p: Props) => (
  <Line {...p}>
    <path d="m6 9 6 6 6-6" />
  </Line>
);
export const Pin = (p: Props) => (
  <Line {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Line>
);
export const Mail = (p: Props) => (
  <Line {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </Line>
);

export function GitHub({ className, size = 14 }: Props) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={`shrink-0 ${className ?? ""}`}>
      <path d={siGithub.path} />
    </svg>
  );
}

/** simple-icons no longer ships LinkedIn's mark, so it is drawn here. */
export function LinkedIn({ className, size = 14 }: Props) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={`shrink-0 ${className ?? ""}`}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}
