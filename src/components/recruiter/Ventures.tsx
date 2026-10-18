import { cargo, studio, ventureDeep } from "@/data/site";
import { Breakdown, Bullets, Caps, Dot, More, SectionHead, pad } from "./bits";
import Card from "./Card";

export default function Ventures() {
  // The detector is now grouped with the Northeastern research case study.
  const ventures = cargo.filter((c) => c.id !== "straggler");
  return (
    <section id="ventures" aria-labelledby="ventures-h" className="scroll-mt-28 pt-32 md:pt-40">
      <SectionHead
        id="ventures"
        n="03"
        kicker="Ventures"
        title="Companies I've started"
        aside={`${pad(ventures.length)} under ${studio.short}`}
      />

      <div className="mb-8 grid gap-x-12 gap-y-4 rounded-2xl border border-cv-line bg-cv-card p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:p-8">
        <div>
          <h3 className="text-[1.5rem] font-light leading-tight tracking-[-0.025em]">
            <Dot>{studio.name} LLC</Dot>
          </h3>
          <div className="mt-1 text-[14px] text-cv-muted">
            {studio.role} · {studio.kind}
          </div>
          <Caps className="mt-4 block text-[10.5px] text-cv-faint">{studio.range}</Caps>
        </div>
        <p className="text-[14.5px] leading-relaxed text-cv-muted">{studio.blurb}</p>
      </div>

      <ul className="grid gap-5 lg:grid-cols-3">
        {ventures.map((c) => {
          const deep = ventureDeep[c.id];
          return (
            <Card
              key={c.id}
              id={c.id}
              code={c.tag}
              meta={c.sector}
              name={c.name}
              metric={c.metric}
              blurb={c.blurb}
              stack={deep?.stack}
              links={c.link && [c.link]}
            >
              <More label="How it was built" count={c.detail.length}>
                <Bullets items={c.detail} className="text-[14px]" />
                {deep && (
                  <div className="mt-7 border-t border-cv-line pt-6">
                    <Breakdown tagline={deep.tagline} sections={deep.sections} />
                  </div>
                )}
              </More>
            </Card>
          );
        })}
      </ul>
    </section>
  );
}
