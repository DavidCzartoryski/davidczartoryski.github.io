import { cargo, flightPlan, studio } from "@/data/site";
import Reveal from "../Reveal";
import SectionHeader from "../SectionHeader";

const TONE: Record<string, string> = {
  red: "bg-stamp-red",
  blue: "bg-stamp-blue",
  green: "bg-stamp-green",
  violet: "bg-stamp-violet",
};

export default function Cargo() {
  return (
    <section id="cargo" className="relative scroll-mt-24 border-y border-line bg-ink-2/40 py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          n="03"
          kicker="Cargo"
          title={
            <>
              What&apos;s in the <em className="italic text-gold-2">hold.</em>
            </>
          }
          blurb={
            <>
              <span className="font-display text-lg text-paper">{studio.name}</span>
              <br />
              {studio.role} · {studio.kind} · {studio.range}
              <br />
              <span className="mt-3 block">{studio.blurb}</span>
            </>
          }
        />

        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cargo.map((c, i) => (
            <Reveal key={c.id} delay={(i % 3) * 0.08}>
              <li className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-ink transition-colors hover:border-line-2">
                {/* strap and punch hole */}
                <div className={`h-2 ${TONE[c.tone]}`} />
                <div className="flex items-start justify-between px-6 pt-5">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-fg-dim">TAG {c.tag}</span>
                  <span aria-hidden className="h-4 w-4 rounded-full border-2 border-line-2 bg-ink-2" />
                </div>
                <div className="px-6 pb-6 pt-3">
                  <h3 className="font-display text-3xl leading-none tracking-tight">{c.name}</h3>
                  <div className="mt-2 font-mono text-[10px] tracking-[0.25em] text-gold">{c.sector.toUpperCase()}</div>
                  <p className="mt-5 text-[15px] leading-relaxed text-paper/90">{c.blurb}</p>
                  <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-fg-muted">
                    {c.detail.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto flex items-end justify-between border-t border-dashed border-line px-6 py-4">
                  {c.metric ? (
                    <div>
                      <div className="font-display text-3xl leading-none tracking-tight text-gold-2">{c.metric.value}</div>
                      <div className="mt-1 font-mono text-[10px] tracking-[0.22em] text-fg-dim">{c.metric.label.toUpperCase()}</div>
                    </div>
                  ) : (
                    <span />
                  )}
                  {c.link && (
                    <a
                      href={c.link.href}
                      target="_blank"
                      rel="noopener"
                      className="font-mono text-[11px] tracking-[0.2em] text-paper underline-offset-4 hover:text-gold hover:underline"
                    >
                      {c.link.label} ↗
                    </a>
                  )}
                </div>
              </li>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-16">
          <div className="mb-6 flex flex-wrap items-center gap-4 font-mono text-[11px] tracking-[0.3em] text-fg-dim">
            <span>FLIGHT PLAN</span>
            <span className="h-px w-8 bg-line-2" />
            <span className="rounded-full border border-ember/60 px-3 py-1 text-ember">FILED, NOT FLOWN</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {flightPlan.map((f) => (
              <div key={f.name} className="rounded-2xl border border-dashed border-line-2 p-6">
                <div className="font-display text-2xl tracking-tight">{f.name}</div>
                <p className="mt-3 text-[14px] leading-relaxed text-fg-muted">{f.blurb}</p>
                <div className="mt-4 font-mono text-[10px] tracking-[0.25em] text-fg-dim">IDEA IN PROGRESS · NOT YET BUILT</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
