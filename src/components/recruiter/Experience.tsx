import { flightLog } from "@/data/site";
import { Bullets, Chips, SectionHead } from "./bits";

export default function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-h" className="scroll-mt-24 pt-24">
      <SectionHead id="experience" n="02" title="Experience" aside="Newest first" />
      <ol>
        {flightLog.map((leg) => {
          const current = /present/i.test(leg.range);
          return (
            <li
              key={leg.id}
              id={leg.id}
              className="group/leg grid scroll-mt-24 gap-x-8 gap-y-2 pb-12 last:pb-0 md:grid-cols-[150px_1fr] md:pb-0"
            >
              <div className="md:pt-[5px]">
                <div className="font-mono text-[12px] text-cv-fg">{leg.range}</div>
                <div className="mt-1 text-[13px] text-cv-faint">{leg.city}</div>
              </div>
              <article className="relative md:border-l md:border-cv-line md:pb-12 md:pl-8 md:group-last/leg:pb-0">
                <span
                  aria-hidden
                  className={`absolute -left-[5px] top-[9px] hidden h-[9px] w-[9px] rounded-full md:block ${
                    current ? "bg-cv-ok ring-4 ring-cv-ok-soft" : "bg-cv-bg ring-2 ring-inset ring-cv-line-2"
                  }`}
                />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.025em]">{leg.company}</h3>
                  {current && (
                    <span className="rounded-full bg-cv-ok-soft px-2 py-0.5 text-[11px] font-semibold text-cv-ok">Current</span>
                  )}
                </div>
                <div className="mt-0.5 text-[15px] font-medium text-cv-accent">{leg.title}</div>
                <Bullets items={leg.bullets} className="mt-4 text-[15px] text-cv-muted" />
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
