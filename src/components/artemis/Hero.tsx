import { artemis, mailto } from "@/data/artemis";
import { Arrow, Container, Ticks } from "./bits";
import Lanes, { LanesLegend } from "./Lanes";

const { hero } = artemis;

/** What a finding about the strip next to it would carry. Illustrative values, real field names. */
const READOUT = [
  ["kind", "rank"],
  ["rank", "2"],
  ["island", "nvidia"],
  ["window", "37"],
  ["excess_ms", "+14.0 per step"],
  ["cause", "SM clock drop (NVML)"],
] as const;

function Readout() {
  return (
    <div className="ar-mono relative border border-ar-line-2 bg-ar-card p-4 text-[11.5px] leading-relaxed lg:w-[300px]">
      <p className="flex items-center gap-2 border-b border-ar-line pb-3 text-[10.5px] uppercase tracking-[0.12em] text-ar-signal-ink">
        <span aria-hidden="true" className="ar-pulse h-2 w-2 rounded-full bg-ar-signal" />
        Finding · window 37
      </p>
      <dl className="mt-3 grid grid-cols-[88px_1fr] gap-y-1.5">
        {READOUT.map(([k, v], i) => {
          const delay = { "--ar-i": i } as React.CSSProperties;
          return (
            <div key={k} className="contents">
              <dt className="ar-type text-ar-faint" style={delay}>
                {k}
              </dt>
              <dd className={`ar-type ${k === "excess_ms" ? "font-semibold text-ar-signal-ink" : "text-ar-ink"}`} style={delay}>
                {v}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative pb-16 pt-14 md:pb-24 md:pt-24">
      <Container>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <p className="ar-mono ar-rise text-[11px] uppercase tracking-[0.16em] text-ar-faint">
            <span className="text-ar-ink">Artemis</span>
            <span aria-hidden="true" className="mx-2.5 opacity-50">/</span>
            {hero.eyebrow}
          </p>
          <h1
            id="hero-title"
            className="ar-display ar-rise mt-6 text-[clamp(2.75rem,7.2vw,6.4rem)] leading-[0.93] text-ar-ink"
            style={{ "--ar-d": "80ms" } as React.CSSProperties}
          >
            {hero.lead} <span className="text-ar-signal">{hero.mark}</span>
          </h1>
          <p
            className="ar-rise mt-8 max-w-[640px] text-[17px] leading-[1.65] text-ar-muted md:text-[18.5px]"
            style={{ "--ar-d": "160ms" } as React.CSSProperties}
          >
            {hero.lede}
          </p>
          <div className="ar-rise mt-9 flex flex-wrap gap-3" style={{ "--ar-d": "240ms" } as React.CSSProperties}>
            <a
              href={mailto(`${artemis.name}: design partner`)}
              className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-ar-ink px-6 text-[15px] font-medium text-ar-bg transition-opacity hover:opacity-85"
            >
              Become a design partner
              <Arrow className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href={artemis.github}
              className="inline-flex h-12 items-center gap-2.5 rounded-full border border-ar-line-2 px-6 text-[15px] font-medium text-ar-ink transition-colors hover:border-ar-ink/50"
            >
              GPUBridge on GitHub
            </a>
          </div>
        </div>
        <dl
          className="ar-rise self-end border-t border-ar-line-2 lg:col-span-4"
          style={{ "--ar-d": "320ms" } as React.CSSProperties}
        >
          {hero.specs.map((s) => (
            <div key={s.k} className="grid grid-cols-[112px_1fr] gap-4 border-b border-ar-line py-3.5">
              <dt className="ar-mono pt-0.5 text-[10.5px] uppercase tracking-[0.12em] text-ar-faint">{s.k}</dt>
              <dd className="text-[14.5px] text-ar-ink">{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <figure className="ar-rise mt-16 md:mt-20" style={{ "--ar-d": "420ms" } as React.CSSProperties}>
        <div className="relative border border-ar-line-2 bg-ar-card/60">
          <Ticks />
          <div className="ar-mono flex items-center justify-between border-b border-ar-line px-4 py-2.5 text-[10.5px] uppercase tracking-[0.12em] text-ar-faint">
            <span>Job 0x2a · 8 ranks · data parallel</span>
            <span className="hidden sm:inline">Step time, live</span>
          </div>
          <div className="relative">
            <Lanes />
            <div className="hidden lg:absolute lg:inset-y-4 lg:right-4 lg:flex lg:items-center">
              <Readout />
            </div>
          </div>
          <div className="border-t border-ar-line p-4 lg:hidden">
            <Readout />
          </div>
        </div>
        <figcaption className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-8">
          <LanesLegend />
          <p className="max-w-[440px] text-[13px] leading-relaxed text-ar-faint md:text-right">{hero.caption}</p>
        </figcaption>
      </figure>
      </Container>
    </section>
  );
}
