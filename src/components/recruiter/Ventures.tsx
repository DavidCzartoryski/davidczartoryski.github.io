import { cargo, studio, ventureDeep } from "@/data/site";
import { Breakdown, Bullets, Chips, Label, SectionHead } from "./bits";

export default function Ventures() {
  // The detector is now grouped with the Northeastern research case study.
  const ventures = cargo.filter((c) => c.id !== "straggler");
  return (
    <section id="ventures" aria-labelledby="ventures-h" className="scroll-mt-24 pt-24">
      <SectionHead id="ventures" n="03" title="Ventures" aside={`${ventures.length} under ${studio.short}`} />

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.025em]">{studio.name} LLC</h3>
        <div className="font-mono text-[12px] text-cv-fg">{studio.range}</div>
      </div>
      <div className="mt-0.5 text-[15px] font-medium text-cv-accent">
        {studio.role} · {studio.kind}
      </div>
      <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-cv-muted">{studio.blurb}</p>

      <ul className="mt-8 space-y-4">
        {ventures.map((c) => {
          const deep = ventureDeep[c.id];
          return (
            <li key={c.id} id={c.id} className="scroll-mt-24 rounded-xl p-6 ring-1 ring-cv-line md:p-7">
              <article>
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div className="min-w-0">
                    <Label className="text-cv-faint">
                      {c.tag} · {c.sector}
                    </Label>
                    <h4 className="mt-1.5 text-[1.3rem] font-semibold leading-tight tracking-[-0.025em]">{c.name}</h4>
                  </div>
                  {c.metric && (
                    <div className="shrink-0 rounded-lg bg-cv-accent-soft px-3.5 py-2 text-right">
                      <div className="text-[1.35rem] font-semibold leading-none tracking-[-0.03em] text-cv-accent">
                        {c.metric.value}
                      </div>
                      <div className="mt-1 text-[11.5px] text-cv-muted">{c.metric.label}</div>
                    </div>
                  )}
                </div>

                <p className="mt-3 text-[15.5px] leading-relaxed text-cv-fg">{c.blurb}</p>
                <Bullets items={c.detail} className="mt-4 text-[14.5px] text-cv-muted" />

                {(deep?.stack || c.link) && (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    {deep?.stack ? <Chips items={deep.stack} /> : <span />}
                    {c.link && (
                      <a
                        href={c.link.href}
                        target="_blank"
                        rel="noopener"
                        className="text-[14px] font-medium text-cv-accent underline-offset-4 hover:underline"
                      >
                        {c.link.label} ↗
                      </a>
                    )}
                  </div>
                )}

                {deep && <Breakdown tagline={deep.tagline} sections={deep.sections} />}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
