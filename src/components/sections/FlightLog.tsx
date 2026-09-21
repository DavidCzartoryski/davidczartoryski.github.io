import { education, flightLog, skills } from "@/data/site";
import Plane from "../Plane";
import Reveal from "../Reveal";
import SectionHeader from "../SectionHeader";

export default function FlightLog() {
  return (
    <section id="flight-log" className="relative mx-auto max-w-7xl scroll-mt-24 px-6 py-28 md:py-36">
      <SectionHeader
        n="02"
        kicker="Flight log"
        title={
          <>
            Every leg <em className="italic text-gold-2">logged.</em>
          </>
        }
        blurb="Employment, newest first. Founded companies live in the cargo hold below, so the employment history reads as what it is."
      />

      <ol className="relative">
        {/* route rail */}
        <div aria-hidden className="absolute bottom-6 left-[7px] top-6 hidden w-px border-l border-dashed border-line-2 md:block" />

        {flightLog.map((leg, i) => (
          <Reveal key={leg.id} delay={0.05}>
            <li className="relative grid gap-6 border-t border-line py-12 md:grid-cols-12 md:gap-10">
              <span aria-hidden className="absolute -left-[3px] top-14 hidden h-[15px] w-[15px] items-center justify-center rounded-full border border-gold/60 bg-ink md:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              </span>
              <div className="font-mono md:col-span-3 md:pl-10">
                <div className="text-[10px] tracking-[0.3em] text-gold">LEG {String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 text-[12px] tracking-[0.12em] text-paper">{leg.range}</div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="font-display text-3xl tracking-tight text-paper/90">{leg.code}</span>
                  <span className="text-[10px] tracking-[0.2em] text-fg-dim">{leg.city.toUpperCase()}</span>
                </div>
              </div>
              <div className="md:col-span-9">
                <h3 className="font-display text-[length:var(--step-h3)] leading-tight tracking-tight">
                  {leg.company}
                </h3>
                <div className="mt-1 font-mono text-[11px] tracking-[0.25em] text-gold">{leg.title.toUpperCase()}</div>
                <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-fg-muted">
                  {leg.bullets.map((b) => (
                    <li key={b} className="flex gap-3">
                      <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-gold/80" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                {leg.tech && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {leg.tech.map((t) => (
                      <span key={t} className="rounded-full border border-line px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-fg-dim">
                        {t.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          </Reveal>
        ))}

        {/* origin: school */}
        <Reveal>
          <li className="relative grid gap-6 border-y border-line py-12 md:grid-cols-12 md:gap-10">
            <span aria-hidden className="absolute -left-[5px] top-14 hidden h-5 w-5 items-center justify-center rounded-full bg-gold text-ink md:flex">
              <Plane size={11} />
            </span>
            <div className="font-mono md:col-span-3 md:pl-10">
              <div className="text-[10px] tracking-[0.3em] text-gold">ORIGIN</div>
              <div className="mt-2 text-[12px] tracking-[0.12em] text-paper">{education.range}</div>
              <div className="mt-4 flex items-center gap-3">
                <span className="font-display text-3xl tracking-tight text-paper/90">BOS</span>
                <span className="text-[10px] tracking-[0.2em] text-fg-dim">{education.city.toUpperCase()}</span>
              </div>
            </div>
            <div className="md:col-span-9">
              <h3 className="font-display text-[length:var(--step-h3)] leading-tight tracking-tight">{education.school}</h3>
              <div className="mt-1 font-mono text-[11px] tracking-[0.25em] text-gold">{education.degree.toUpperCase()}</div>
              <ul className="mt-6 space-y-3 text-[15px] leading-relaxed text-fg-muted">
                {education.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-gold/80" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        </Reveal>
      </ol>

      {/* carry-on: skills */}
      <Reveal className="mt-16">
        <div className="mb-6 font-mono text-[11px] tracking-[0.3em] text-fg-dim">CARRY-ON · TECHNICAL SKILLS</div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((g) => (
            <div key={g.group} className="bg-ink p-6">
              <div className="font-display text-xl tracking-tight">{g.group}</div>
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 font-mono text-[11px] tracking-[0.12em] text-fg-muted">
                {g.items.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
