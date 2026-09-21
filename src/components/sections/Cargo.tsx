import { cargo, studio } from "@/data/site";
import Reveal from "../Reveal";
import SectionHeader from "../SectionHeader";
import VentureCards from "../VentureCards";

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
        />

        {/* the holding company the ventures sit under */}
        <Reveal className="mb-16 overflow-hidden rounded-2xl border border-line bg-ink">
          <div className="h-2 bg-gold" />
          <div className="grid gap-8 px-6 py-8 md:grid-cols-12 md:px-10 md:py-10">
            <div className="md:col-span-5">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-display text-[length:var(--step-h3)] leading-none tracking-tight text-paper">
                  {studio.name}
                </h3>
                <span className="rounded-md border border-gold/50 px-2 py-1 font-mono text-[11px] tracking-[0.25em] text-gold">
                  {studio.short}
                </span>
              </div>
              <div className="mt-4 font-mono text-[10px] leading-relaxed tracking-[0.25em] text-fg-dim">
                {studio.role.toUpperCase()}
                <br />
                {studio.kind.toUpperCase()} · {studio.range.toUpperCase()}
              </div>
            </div>
            <p className="text-[16px] leading-relaxed text-paper/90 md:col-span-7">{studio.blurb}</p>
          </div>
        </Reveal>

        <div className="mb-8 flex flex-wrap items-center gap-4 font-mono text-[11px] tracking-[0.3em] text-fg-dim">
          <span className="text-gold">VENTURES</span>
          <span className="h-px w-10 bg-line-2" />
          <span>
            {String(cargo.length).padStart(2, "0")} UNDER {studio.short}
          </span>
          <span className="h-px w-10 bg-line-2" />
          <span>TAP A CARD</span>
        </div>

        <VentureCards />
      </div>
    </section>
  );
}
