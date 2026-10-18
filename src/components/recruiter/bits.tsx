import { recruiter } from "@/data/site";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Longest first, so a phrase always wins over any shorter one inside it.
const EMPHASIS = new RegExp(
  `(${[...recruiter.emphasis].sort((a, b) => b.length - a.length).map(escape).join("|")})`,
  "g",
);

/** A bullet with its résumé-worthy phrases run through the highlighter. */
export function Emphasis({ text, inv }: { text: string; inv?: boolean }) {
  return (
    <>
      {text.split(EMPHASIS).map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className={`mark font-semibold ${inv ? "text-cv-inv-fg" : "text-cv-fg"}`}>
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Small uppercase mono label: kickers, table headings, metadata. */
export function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`block font-mono text-[11px] uppercase tracking-[0.12em] ${className}`}>{children}</span>;
}

export function SectionHead({ id, n, title, aside }: { id: string; n: string; title: string; aside?: string }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-cv-line pb-4">
      <h2 id={`${id}-h`} className="flex items-baseline gap-3">
        <span className="font-mono text-[12px] text-cv-accent">{n}</span>
        <span className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-none tracking-[-0.03em]">{title}</span>
      </h2>
      {aside && <Label className="text-cv-faint">{aside}</Label>}
    </div>
  );
}

/** Bullet list shared by roles, ventures, projects and education. */
export function Bullets({ items, inv, className = "" }: { items: string[]; inv?: boolean; className?: string }) {
  return (
    <ul className={`space-y-2.5 leading-relaxed ${className}`}>
      {items.map((b) => (
        <li key={b} className="flex gap-3">
          <span
            aria-hidden
            className={`mt-[0.68em] h-[5px] w-[5px] shrink-0 rounded-full ${inv ? "bg-cv-inv-accent" : "bg-cv-line-2"}`}
          />
          <span>
            <Emphasis text={b} inv={inv} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Chips({ items, inv }: { items: string[]; inv?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Stack">
      {items.map((t) => (
        <li
          key={t}
          className={`rounded-md px-2 py-[3px] font-mono text-[11px] ${
            inv ? "bg-white/[0.07] text-cv-inv-muted" : "bg-cv-surface text-cv-muted ring-1 ring-inset ring-cv-line"
          }`}
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

/** "Read the full breakdown": the long-form copy, folded away until asked for. */
export function Breakdown({
  tagline,
  sections,
  inv,
}: {
  tagline: string;
  sections: { heading: string; body: string[] }[];
  inv?: boolean;
}) {
  return (
    <details className={`group no-print mt-6 border-t pt-4 ${inv ? "border-cv-inv-line" : "border-cv-line"}`}>
      <summary className={`inline-flex cursor-pointer list-none items-center gap-2 text-[14px] font-medium transition-opacity hover:opacity-80 ${inv ? "text-cv-inv-accent" : "text-cv-accent"}`}>
        <span aria-hidden className="text-[11px] transition-transform group-open:rotate-90">
          ▶
        </span>
        <span className="group-open:hidden">Read the full breakdown</span>
        <span className="hidden group-open:inline">Hide the breakdown</span>
      </summary>
      <div className="mt-5 space-y-6">
        <p className="text-[1.15rem] font-medium leading-snug tracking-[-0.01em]">{tagline}</p>
        {sections.map((s) => (
          <div key={s.heading}>
            <h5 className="text-[14px] font-semibold">{s.heading}</h5>
            {s.body.map((p) => (
              <p key={p} className={`mt-2 text-[14.5px] leading-relaxed ${inv ? "text-cv-inv-muted" : "text-cv-muted"}`}>
                {p}
              </p>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
}
