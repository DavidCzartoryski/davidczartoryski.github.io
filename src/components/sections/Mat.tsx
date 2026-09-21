import { wrestling } from "@/data/site";
import Reveal from "../Reveal";
import SectionHeader from "../SectionHeader";

export default function Mat() {
  return (
    <section id="the-mat" className="relative mx-auto max-w-7xl scroll-mt-24 overflow-hidden px-6 py-28 md:py-36">
      <SectionHeader n="04" kicker="The mat" title={wrestling.headline} />

      <div className="grid items-center gap-14 lg:grid-cols-12">
        <Reveal className="lg:col-span-6">
          <div className="space-y-6 text-[16px] leading-relaxed text-fg-muted md:text-[17px]">
            {wrestling.copy.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
            {wrestling.facts.map((f) => (
              <div key={f.label} className="bg-ink p-6">
                <dd className="font-display text-4xl leading-none tracking-tight text-gold-2">{f.value}</dd>
                <dt className="mt-3 font-mono text-[10px] leading-relaxed tracking-[0.22em] text-fg-dim">
                  {f.label.toUpperCase()}
                </dt>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal className="lg:col-span-6" delay={0.15}>
          <div className="relative">
            <div aria-hidden className="absolute inset-x-10 bottom-6 h-24 rounded-[100%] bg-stamp-red/25 blur-3xl" />
            <img
              src="/art/wrestlers-ink.webp"
              alt="Ink illustration of two wrestlers locked in a collar tie"
              className="relative w-full"
              loading="lazy"
            />
            <div className="mt-4 flex items-center justify-between font-mono text-[10px] tracking-[0.28em] text-fg-dim">
              <span>MASSACHUSETTS · NORTHEASTERN</span>
              <span>SIX MINUTES, NO TIMEOUTS</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
