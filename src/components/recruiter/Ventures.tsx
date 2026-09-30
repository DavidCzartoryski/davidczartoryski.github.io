import { cargo, studio, ventureDeep } from "@/data/site";
import { Bullets, Chips, SectionHead } from "./bits";

export default function Ventures() {
  return (
    <section id="ventures">
      <SectionHead n="02" title="Ventures" />

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pt-3">
        <h3 className="font-display text-[1.7rem] leading-tight tracking-tight">{studio.name} LLC</h3>
        <div className="font-mono text-[12px] tracking-[0.08em] text-ink/70">{studio.range}</div>
      </div>
      <div className="mt-1 font-mono text-[11px] tracking-[0.2em] text-gold-deep">
        {studio.role.toUpperCase()} · {studio.kind.toUpperCase()}
      </div>
      <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-ink/80">{studio.blurb}</p>

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {cargo.map((c) => {
          const deep = ventureDeep[c.id];
          return (
            <li key={c.id} id={c.id} className="rounded-2xl border border-ink/12 bg-paper-hi/80 p-5 md:p-6">
              <article className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] tracking-[0.25em] text-ink/50">
                      {c.tag} · {c.sector.toUpperCase()}
                    </div>
                    <h4 className="mt-2 font-display text-[1.5rem] leading-tight tracking-tight">{c.name}</h4>
                  </div>
                  {c.metric && (
                    <div className="shrink-0 text-right">
                      <div className="font-display text-[1.8rem] leading-none tracking-tight">{c.metric.value}</div>
                      <div className="mt-1 font-mono text-[10px] tracking-[0.2em] text-ink/55">
                        {c.metric.label.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-[15px] leading-relaxed text-ink/85">{c.blurb}</p>
                <Bullets items={c.detail} className="mt-3 text-[14px] text-ink/70" />

                {(deep?.stack || c.link) && (
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                    {deep?.stack ? <Chips items={deep.stack} /> : <span />}
                    {c.link && (
                      <a
                        href={c.link.href}
                        target="_blank"
                        rel="noopener"
                        className="font-mono text-[11px] tracking-[0.18em] text-ink underline-offset-4 hover:underline"
                      >
                        {c.link.label} ↗
                      </a>
                    )}
                  </div>
                )}

                {deep && (
                  <details className="group no-print mt-5 border-t border-dashed border-ink/15 pt-4">
                    <summary className="flex cursor-pointer list-none items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-gold-deep transition-colors hover:text-ink">
                      <span aria-hidden className="transition-transform group-open:rotate-90">
                        ▸
                      </span>
                      <span className="group-open:hidden">READ THE FULL BREAKDOWN</span>
                      <span className="hidden group-open:inline">HIDE THE BREAKDOWN</span>
                    </summary>
                    <div className="mt-4 space-y-5">
                      <p className="font-display text-[1.2rem] italic leading-snug">{deep.tagline}</p>
                      {deep.sections.map((s) => (
                        <div key={s.heading}>
                          <h5 className="font-mono text-[10px] tracking-[0.25em] text-ink/55">{s.heading.toUpperCase()}</h5>
                          {s.body.map((p) => (
                            <p key={p} className="mt-2 text-[14px] leading-relaxed text-ink/75">
                              {p}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
