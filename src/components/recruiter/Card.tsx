import { Caps, Chips, Constellation, Dot } from "./bits";
import { ArrowOut, GitHub } from "./icons";

export type CardLink = { href: string; label: string };

/** A venture or a project: a patch of sky up top, then the write-up. */
export default function Card({
  id,
  code,
  meta,
  name,
  metric,
  badge,
  blurb,
  stack,
  links,
  children,
}: {
  id: string;
  code: string;
  meta: string;
  name: string;
  metric?: { value: string; label: string };
  badge?: string;
  blurb: string;
  stack?: string[];
  links?: CardLink[];
  /** Folded detail (More), placed between the blurb and the footer. */
  children?: React.ReactNode;
}) {
  return (
    <li
      id={id}
      className="flex scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-cv-line bg-cv-card transition-colors hover:border-cv-line-2"
    >
      <Sky seed={id} metric={metric} className="h-44" />
      <article className="flex flex-1 flex-col p-6 md:p-7">
        <Code code={code} meta={meta} />
        <h3 className="mt-5 text-[1.5rem] font-light leading-tight tracking-[-0.025em]">
          <Dot>{name}</Dot>
        </h3>
        {badge && <Badge>{badge}</Badge>}
        <p className="mt-5 text-[14.5px] leading-relaxed text-cv-muted">{blurb}</p>
        {children}
        <Foot stack={stack} links={links} />
      </article>
    </li>
  );
}

export function Sky({
  seed,
  metric,
  tall,
  className = "",
  children,
}: {
  seed: string;
  metric?: { value: string; label: string };
  tall?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`no-print relative overflow-hidden border-b border-cv-line bg-[radial-gradient(120%_90%_at_80%_0%,rgb(242_169_59/0.09),transparent_60%),linear-gradient(to_bottom,rgb(255_255_255/0.02),transparent)] ${className}`}
    >
      <Constellation seed={seed} tall={tall} className="absolute inset-0 h-full w-full" />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cv-bg/70 to-transparent" />
      {metric && (
        <div className="absolute inset-x-5 bottom-4 z-10 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[2.4rem] font-light leading-none tracking-[-0.04em] text-cv-fg">{metric.value}</span>
          <Caps className="text-[10px] text-cv-muted">{metric.label}</Caps>
        </div>
      )}
      {children}
    </div>
  );
}

export function Code({ code, meta }: { code: string; meta: string }) {
  return (
    <div className="flex items-center gap-4">
      <Caps className="shrink-0 text-[10.5px] text-cv-faint">{code}</Caps>
      <span aria-hidden className="h-px w-8 shrink-0 bg-cv-line-2" />
      <Caps className="min-w-0 text-[10.5px] text-cv-faint">{meta}</Caps>
    </div>
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-3 inline-flex items-center gap-2 self-start rounded-full border border-cv-accent/30 bg-cv-accent-soft px-3 py-1 text-[12px] text-cv-fg">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-cv-accent" />
      {children}
    </span>
  );
}

export function Foot({ stack, links }: { stack?: string[]; links?: CardLink[] }) {
  if (!stack && !links) return null;
  return (
    <div className="mt-auto space-y-5 pt-6">
      {stack && <Chips items={stack} />}
      {links && (
        <div className="no-print flex flex-wrap gap-2.5">
          {links.map((l, i) => {
            const gh = l.href.includes("github.com");
            return (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener"
                className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13.5px] transition ${
                  i === 0
                    ? "bg-cv-fg font-medium text-cv-bg hover:opacity-90"
                    : "border border-cv-line-2 text-cv-fg hover:border-cv-fg/30"
                }`}
              >
                {gh ? <GitHub size={13} /> : <ArrowOut size={13} />}
                {gh ? "GitHub" : l.label}
              </a>
            );
          })}
        </div>
      )}
      {links && <p className="hidden text-[12px] text-cv-muted print:block">{links.map((l) => l.label).join(" · ")}</p>}
    </div>
  );
}
