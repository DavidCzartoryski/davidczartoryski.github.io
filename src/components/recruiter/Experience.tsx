import { flightLog } from "@/data/site";
import { Bullets, Chips, SectionHead } from "./bits";

export default function Experience() {
  return (
    <section id="experience">
      <SectionHead n="01" title="Experience" aside="NEWEST FIRST" />
      <ol className="divide-y divide-ink/10">
        {flightLog.map((leg) => {
          const current = /present/i.test(leg.range);
          return (
            <li key={leg.id} id={leg.id} className="py-8 first:pt-3">
              <article>
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h3 className="font-display text-[1.7rem] leading-tight tracking-tight">{leg.company}</h3>
                  <div className="flex items-center gap-2 font-mono text-[12px] tracking-[0.08em] text-ink/70">
                    {current && (
                      <span className="rounded-sm bg-stamp-green/10 px-1.5 py-0.5 text-[9px] tracking-[0.2em] text-stamp-green">
                        NOW
                      </span>
                    )}
                    {leg.range}
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-mono text-[11px] tracking-[0.2em]">
                  <span className="text-gold-deep">{leg.title.toUpperCase()}</span>
                  <span className="text-ink/55">{leg.city.toUpperCase()}</span>
                </div>
                <Bullets items={leg.bullets} className="mt-5 text-[15px] text-ink/80" />
                {leg.tech && (
                  <div className="mt-5">
                    <Chips items={leg.tech} />
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
