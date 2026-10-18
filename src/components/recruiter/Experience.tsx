import { flightLog, recruiter, type Leg } from "@/data/site";
import { Bullets, Caps, Chips, Dot, More, SectionHead, pad } from "./bits";
import { ArrowOut, Pin } from "./icons";

/** Bullets shown before "More"; the rest of a role waits to be asked for. */
const SHOWN = 2;

/** Two letters for a tile with no logo. */
const initials = (company: string) =>
  company
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

export default function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-h" className="scroll-mt-28 pt-32 md:pt-40">
      <SectionHead
        id="experience"
        n="02"
        kicker="Experience"
        title="Where I've worked"
        aside={`${pad(flightLog.length)} roles`}
      />

      <div className="md:grid md:grid-cols-[180px_40px_1fr] lg:grid-cols-[220px_48px_1fr]">
        <div aria-hidden className="hidden md:block" />
        <div aria-hidden className="relative hidden md:block">
          <span className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent to-cv-accent/60" />
        </div>
        <div aria-hidden className="mb-10 hidden items-center gap-4 md:flex">
          <Caps className="text-[10px] text-cv-faint">Now</Caps>
          <span className="h-px flex-1 bg-cv-line" />
        </div>
      </div>

      <ol>
        {flightLog.map((leg, i) => (
          <Role key={leg.id} leg={leg} last={i === flightLog.length - 1} />
        ))}
      </ol>
    </section>
  );
}

function Role({ leg, last }: { leg: Leg; last: boolean }) {
  const current = /present/i.test(leg.range);
  const shown = leg.bullets.slice(0, SHOWN);
  const rest = leg.bullets.slice(SHOWN);
  // The headline numbers already point at their role; show them on it too.
  const metrics = recruiter.impact.filter((m) => m.href === `#${leg.id}`);
  return (
    <li
      id={leg.id}
      className="grid scroll-mt-28 gap-y-5 pb-16 last:pb-0 md:grid-cols-[180px_40px_1fr] md:pb-0 lg:grid-cols-[220px_48px_1fr]"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:block md:space-y-3 md:pt-3">
        <Caps className="block text-[11.5px] text-cv-fg">{leg.range}</Caps>
        <Caps className="flex items-center gap-1.5 text-[10px] text-cv-faint">
          <Pin size={11} /> {leg.city}
        </Caps>
        {current && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cv-accent/35 bg-cv-accent-soft px-2.5 py-1 font-cv-mono text-[9.5px] uppercase tracking-[0.2em] text-cv-accent">
            <span aria-hidden className="h-1 w-1 rounded-full bg-cv-accent" />
            Current
          </span>
        )}
      </div>

      <div aria-hidden className="relative hidden md:block">
        <span
          className={`absolute left-1/2 top-0 w-px ${last ? "h-6" : "bottom-0"} ${current ? "bg-cv-accent/60" : "bg-cv-line-2"}`}
        />
        {current ? (
          <span className="absolute left-1/2 top-[18px] h-3 w-3 -translate-x-1/2 rounded-full bg-cv-accent shadow-[0_0_0_5px_rgb(242_169_59/0.12),0_0_22px_4px_rgb(242_169_59/0.45)]" />
        ) : (
          <span className="absolute left-1/2 top-[19px] h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-cv-faint bg-cv-bg" />
        )}
      </div>

      <article className={`min-w-0 ${last ? "" : "md:pb-20"}`}>
        <header className="flex items-start gap-4 md:gap-5">
          <Logo src={leg.logo} fallback={initials(leg.company)} />
          <div className="min-w-0 pt-0.5">
            <h3 className="text-[clamp(1.35rem,2.4vw,1.75rem)] font-light leading-tight tracking-[-0.025em]">
              <Dot>{leg.company}</Dot>
            </h3>
            <div className="mt-1 text-[14.5px] text-cv-muted">{leg.title}</div>
          </div>
        </header>

        {metrics.length > 0 && (
          <dl className="mt-6 flex flex-wrap gap-x-7 gap-y-2">
            {metrics.map((m) => (
              <div key={m.value} className="flex items-baseline gap-2.5">
                <dt className="sr-only">{m.label}</dt>
                <dd className="flex items-baseline gap-2.5">
                  <span className="text-[16px] font-medium text-cv-fg">{m.value}</span>
                  <Caps className="text-[9.5px] text-cv-faint">{m.label}</Caps>
                </dd>
              </div>
            ))}
          </dl>
        )}

        <Bullets items={shown} className="mt-6 text-[14.5px]" />
        {rest.length > 0 && (
          <More label="More from this role" count={rest.length}>
            <Bullets items={rest} className="text-[14.5px]" />
          </More>
        )}

        {(leg.tech || leg.links) && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            {leg.tech && <Chips items={leg.tech} />}
            {leg.links && (
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {leg.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    {...(link.href.startsWith("http") && { target: "_blank", rel: "noopener" })}
                    className="inline-flex items-center gap-1.5 text-[13.5px] text-cv-accent underline-offset-4 hover:underline"
                  >
                    {link.label} <ArrowOut size={12} />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </article>
    </li>
  );
}

/** The company's mark in a rounded tile; decorative, since the name sits beside it. */
export function Logo({ src, fallback }: { src?: string; fallback: string }) {
  const tile = "h-14 w-14 shrink-0 rounded-2xl border border-cv-line-2";
  if (src) return <img src={src} alt="" width={100} height={100} className={`${tile} bg-black object-cover`} />;
  return (
    <span
      aria-hidden
      className={`${tile} flex items-center justify-center bg-gradient-to-br from-white/[0.07] to-white/[0.01] font-cv-mono text-[15px] font-medium tracking-[-0.02em] text-cv-fg`}
    >
      {fallback}
    </span>
  );
}
