import { artemis } from "@/data/artemis";
import { Container, Eyebrow } from "./bits";

const { audience, roadmap } = artemis;

const DOT = [
  "bg-ar-ink",
  "bg-[linear-gradient(90deg,var(--ar-ink)_50%,transparent_50%)] ring-1 ring-ar-ink",
  "ring-1 ring-ar-ink",
];

/** Who buys it, why now, and how far along it is. */
export default function Market() {
  return (
    <section aria-labelledby="audience-title" className="border-t border-ar-line py-20 md:py-28">
      <Container>
        <Eyebrow n="05" className="text-ar-faint">
          Market
        </Eyebrow>
        <h2 id="audience-title" className="ar-display mt-6 text-[clamp(2.3rem,4.6vw,4rem)] leading-[0.97] text-ar-ink">
          {audience.heading}
        </h2>
        <ul className="mt-12 grid border-l border-t border-ar-line md:grid-cols-3">
          {audience.items.map((a) => (
            <li key={a.title} className="border-b border-r border-ar-line bg-ar-bg p-6 md:p-7">
              <h3 className="text-[18px] font-semibold text-ar-ink">{a.title}</h3>
              <p className="mt-2.5 text-[15px] leading-[1.6] text-ar-muted">{a.body}</p>
            </li>
          ))}
        </ul>

        <figure className="mt-16 grid gap-6 md:mt-20 lg:grid-cols-12 lg:gap-10">
          <figcaption className="ar-mono text-[10.5px] uppercase tracking-[0.12em] text-ar-faint lg:col-span-3 lg:pt-3">
            Why now
          </figcaption>
          <blockquote className="ar-display text-[clamp(1.5rem,2.6vw,2.25rem)] leading-[1.18] tracking-[-0.02em] text-ar-ink lg:col-span-9">
            {audience.whyNow}
          </blockquote>
        </figure>

        <div className="mt-20 md:mt-28">
          <h2 className="ar-display text-[clamp(1.8rem,3vw,2.6rem)] leading-tight text-ar-ink">{roadmap.heading}</h2>
          <ol className="mt-8 grid gap-10 md:grid-cols-3 md:gap-8">
            {roadmap.phases.map((phase, i) => (
              <li key={phase.label} className="border-t border-ar-ink pt-5">
                <p className="ar-mono flex items-center gap-2.5 text-[11px] uppercase tracking-[0.12em] text-ar-ink">
                  <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${DOT[i]}`} />
                  {phase.label}
                </p>
                <ul className="mt-5 space-y-3">
                  {phase.items.map((item) => (
                    <li key={item} className="flex gap-3 text-[15px] leading-snug text-ar-muted">
                      <span aria-hidden="true" className="mt-[9px] h-px w-3 shrink-0 bg-ar-ink/40" />
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
