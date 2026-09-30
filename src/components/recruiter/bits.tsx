import { recruiter } from "@/data/site";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Longest first, so a phrase always wins over any shorter one inside it.
const EMPHASIS = new RegExp(
  `(${[...recruiter.emphasis].sort((a, b) => b.length - a.length).map(escape).join("|")})`,
  "g",
);

/** A bullet with its résumé-worthy phrases run through the highlighter. */
export function Emphasis({ text }: { text: string }) {
  return (
    <>
      {text.split(EMPHASIS).map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="mark font-semibold text-ink">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function SectionHead({
  n,
  title,
  aside,
  small,
}: {
  n: string;
  title: React.ReactNode;
  aside?: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-ink/15 ${
        small ? "mb-5 pb-3" : "mb-6 pb-4"
      }`}
    >
      <h2 className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] tracking-[0.3em] text-gold-deep">{n}</span>
        <span
          className={`font-display leading-none tracking-[-0.02em] ${
            small ? "text-[1.6rem]" : "text-[clamp(2rem,3.4vw,2.6rem)]"
          }`}
        >
          {title}
        </span>
      </h2>
      {aside && <p className="font-mono text-[10px] tracking-[0.25em] text-ink/55">{aside}</p>}
    </div>
  );
}

/** Bullet list shared by roles, ventures and education. */
export function Bullets({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`space-y-2.5 leading-relaxed ${className}`}>
      {items.map((b) => (
        <li key={b} className="flex gap-3">
          <span aria-hidden className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-ink/40" />
          <span>
            <Emphasis text={b} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span
          key={t}
          className="rounded-full border border-ink/15 px-2.5 py-0.5 font-mono text-[10px] tracking-[0.14em] text-ink/65"
        >
          {t.toUpperCase()}
        </span>
      ))}
    </div>
  );
}
