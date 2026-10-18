import { recruiter } from "@/data/site";
import { Chevron } from "./icons";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Longest first, so a phrase always wins over any shorter one inside it.
const EMPHASIS = new RegExp(
  `(${[...recruiter.emphasis].sort((a, b) => b.length - a.length).map(escape).join("|")})`,
  "g",
);

export const pad = (n: number) => String(n).padStart(2, "0");

/** A bullet with its résumé-worthy phrases run through the highlighter. */
export function Emphasis({ text }: { text: string }) {
  return (
    <>
      {text.split(EMPHASIS).map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="mark font-medium text-cv-fg">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Small, widely tracked capitals: dates, places, counts. */
export function Caps({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`font-cv-mono text-[11px] uppercase tracking-[0.24em] ${className}`}>{children}</span>;
}

/** A title with the amber full stop the whole page signs off with. */
export function Dot({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <span className="text-cv-accent">.</span>
    </>
  );
}

/** "02 ─── EXPERIENCE", then the title, with a count on the right. */
export function SectionHead({
  id,
  n,
  kicker,
  title,
  aside,
  center,
}: {
  id: string;
  n: string;
  kicker: string;
  title: string;
  aside?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-12 md:mb-14 ${center ? "text-center" : ""}`}>
      <div
        className={`flex items-center gap-4 text-[11px] uppercase tracking-[0.32em] text-cv-faint ${center ? "justify-center" : ""}`}
      >
        <span className="font-cv-mono">{n}</span>
        <span aria-hidden className="h-px w-10 bg-cv-line-2 md:w-16" />
        <span>{kicker}</span>
      </div>
      <div
        className={`mt-6 flex flex-wrap items-end gap-x-8 gap-y-3 md:mt-8 ${center ? "justify-center" : "justify-between"}`}
      >
        <h2 id={`${id}-h`} className="text-[clamp(2rem,4vw,2.6rem)] font-light leading-[1.1] tracking-[-0.03em]">
          <Dot>{title}</Dot>
        </h2>
        {aside && <Caps className="pb-1.5 text-cv-faint">{aside}</Caps>}
      </div>
    </div>
  );
}

/** Bullet list shared by roles, ventures, projects and education. */
export function Bullets({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`space-y-2.5 leading-relaxed text-cv-muted ${className}`}>
      {items.map((b) => (
        <li key={b} className="flex gap-3">
          <span aria-hidden className="mt-[0.7em] h-px w-2.5 shrink-0 bg-cv-accent/70" />
          <span>
            <Emphasis text={b} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Chips({ items, label = "Stack" }: { items: string[]; label?: string }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={label}>
      {items.map((t) => (
        <li
          key={t}
          className="rounded-full border border-cv-line bg-white/[0.02] px-2.5 py-[3px] text-[11.5px] text-cv-muted"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

/**
 * "HOW IT WAS BUILT · 03 ──── MORE": the part of an entry that waits to be
 * asked for. Print opens every one of these (ExpandForPrint).
 */
export function More({
  label,
  count,
  id,
  children,
}: {
  label: string;
  count: number;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <details id={id} className="group/more mt-6 scroll-mt-28">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full py-1">
        <Caps className="text-cv-faint">{label}</Caps>
        <Caps className="text-cv-faint/80">{pad(count)}</Caps>
        <span aria-hidden className="h-px flex-1 bg-cv-line" />
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-cv-line-2 px-3.5 font-cv-mono text-[10.5px] uppercase tracking-[0.2em] text-cv-muted transition-colors group-hover/more:border-cv-fg/30 group-hover/more:text-cv-fg">
          <span className="group-open/more:hidden">More</span>
          <span className="hidden group-open/more:inline">Less</span>
          <Chevron size={12} className="transition-transform group-open/more:rotate-180" />
        </span>
      </summary>
      <div className="pt-5">{children}</div>
    </details>
  );
}

/** The long-form write-up behind a venture or a project. */
export function Breakdown({ tagline, sections }: { tagline: string; sections: { heading: string; body: string[] }[] }) {
  return (
    <div className="space-y-6">
      <p className="text-[1.1rem] font-light leading-snug tracking-[-0.01em] text-cv-fg">{tagline}</p>
      {sections.map((s) => (
        <div key={s.heading}>
          <h5 className="text-[14px] font-medium text-cv-fg">{s.heading}</h5>
          {s.body.map((p) => (
            <p key={p} className="mt-2 text-[14px] leading-relaxed text-cv-muted">
              {p}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Deterministic per id, so every card gets its own sky and the server and client agree. */
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** A small constellation: the art at the top of a card where a screenshot would go. */
export function Constellation({ seed, tall, className = "" }: { seed: string; tall?: boolean; className?: string }) {
  const r = rng(seed);
  const W = 400;
  // A tall sky gets a tall viewBox, so slicing it to fit never blows the stars up.
  const H = tall ? 720 : 160;
  const dust = Array.from({ length: Math.round(H / 4.7) }, () => [r() * W, r() * H, 0.4 + r() * 0.9, 0.15 + r() * 0.45]);
  const n = 6 + Math.floor(r() * 3);
  const stars = Array.from({ length: n }, (_, i) => [
    40 + ((W - 80) * (i + r() * 0.8)) / n,
    // Upper part only: the bottom of the sky is where a card's number sits.
    22 + r() * (H * 0.45),
  ]);
  const path = stars.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const bright = Math.floor(r() * n);
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className}>
      {dust.map(([x, y, s, o], i) => (
        <circle key={i} cx={x} cy={y} r={s} fill="#ededea" opacity={o} />
      ))}
      <path d={path} fill="none" stroke="#ededea" strokeOpacity={0.14} strokeWidth={0.8} />
      {stars.map(([x, y], i) =>
        i === bright ? (
          <g key={i}>
            <circle cx={x} cy={y} r={9} fill="#f2a93b" opacity={0.14} />
            <circle cx={x} cy={y} r={2.6} fill="#f2a93b" />
          </g>
        ) : (
          <circle key={i} cx={x} cy={y} r={1.5} fill="#ededea" opacity={0.75} />
        ),
      )}
    </svg>
  );
}
