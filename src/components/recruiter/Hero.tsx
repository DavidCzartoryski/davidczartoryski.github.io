import { education, flightLog, profile, recruiter } from "@/data/site";
import CopyEmail from "./CopyEmail";
import { Caps } from "./bits";
import { GitHub, LinkedIn, Mail, Pin } from "./icons";

const outline =
  "inline-flex h-11 items-center gap-2.5 rounded-full border border-cv-line-2 bg-white/[0.02] px-5 text-[14px] text-cv-fg transition-colors hover:border-cv-fg/30 hover:bg-white/[0.05]";

/** The first screen: who, what now, how to reach him, and the numbers a recruiter screens on. */
export default function Hero() {
  const now = flightLog[0];
  return (
    <section id="about" aria-label="About" className="scroll-mt-28 pt-14 md:pt-24">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <h1 className="font-cv-mono text-[clamp(3rem,8vw,6.75rem)] font-medium leading-[0.98] tracking-[-0.05em]">
            {profile.first}
            <br />
            {profile.last}
            <span aria-hidden className="ml-[0.08em] inline-block h-[0.15em] w-[0.15em] bg-cv-accent" />
          </h1>

          <p className="mt-8 inline-flex max-w-full items-baseline gap-2.5 rounded-2xl border border-cv-accent/30 bg-cv-accent-soft px-3.5 py-1.5 text-[12.5px] leading-relaxed sm:rounded-full">
            <span aria-hidden className="relative flex h-1.5 w-1.5 shrink-0 -translate-y-px">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cv-accent opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cv-accent" />
            </span>
            <span>
              <span className="font-medium text-cv-fg">{now.title}</span>
              <span className="px-2 text-cv-faint">@</span>
              <span className="text-cv-muted">{now.company}</span>
            </span>
          </p>

          <p className="mt-8 max-w-[600px] text-[15.5px] leading-[1.7] text-cv-muted">
            <span className="text-cv-fg">{recruiter.headline}</span> {recruiter.lede}
          </p>

          <div className="no-print mt-9 flex flex-wrap gap-3">
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener"
              className="inline-flex h-11 items-center gap-2.5 rounded-full bg-cv-fg px-5 text-[14px] font-medium text-cv-bg transition-opacity hover:opacity-90"
            >
              <LinkedIn /> LinkedIn
            </a>
            <a href={profile.github} target="_blank" rel="noopener" className={outline}>
              <GitHub /> GitHub
            </a>
            <CopyEmail email={profile.email} label={["Copy email", "Copied ✓"]} className={outline}>
              <Mail />
            </CopyEmail>
          </div>
        </div>

        <figure className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-cv-line-2 bg-cv-card lg:mx-0">
          <img
            src="/photos/poland/warsaw-03.webp"
            width={1350}
            height={1800}
            alt="The Palace of Culture and Science in Warsaw, lit violet at night, with a person standing in the square in front of it."
            className="aspect-[3/4] w-full object-cover"
            fetchPriority="high"
          />
          <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3.5 pt-12">
            <Caps className="text-[10px] text-cv-fg/85">Warsaw · WAW</Caps>
            <Caps className="text-[10px] text-cv-fg/60">52.23°N 21.01°E</Caps>
          </figcaption>
        </figure>
      </div>

      <div className="mt-20 grid gap-12 md:mt-24 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
        <p className="text-[clamp(1.1rem,1.6vw,1.3rem)] font-light leading-[1.65] text-cv-fg/85">{profile.excites}</p>
        <dl className="divide-y divide-cv-line self-start">
          <Fact k="Graduating">
            {education.range.replace(/^Expected /, "")} · {profile.school}
          </Fact>
          <Fact k="Studying">
            {profile.degree}, {profile.concentration}
          </Fact>
          <Fact k="Based in">
            <span className="inline-flex items-center gap-1.5">
              <Pin size={13} className="text-cv-faint" />
              {profile.bases.map((b) => b.city).join(" · ")}
            </span>
          </Fact>
          <Fact k="Open to">
            <ul className="space-y-1">
              {profile.openTo.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </Fact>
        </dl>
      </div>

      <h2 id="impact-h" className="mt-20 md:mt-24">
        <Caps className="text-cv-faint">By the numbers</Caps>
      </h2>
      <ul aria-labelledby="impact-h" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {recruiter.impact.map((m) => (
          <li key={m.value}>
            <a
              href={m.href}
              className="group flex h-full flex-col rounded-2xl border border-cv-line bg-cv-card p-4 transition-colors hover:border-cv-line-2 hover:bg-white/[0.04] sm:p-5"
            >
              <span className="text-[clamp(1.6rem,2.6vw,2.1rem)] font-light leading-none tracking-[-0.04em] text-cv-fg">
                {m.value}
              </span>
              <span className="mt-3 text-[13px] leading-snug text-cv-muted">{m.label}</span>
              <span className="mt-auto flex items-center gap-1.5 pt-4 text-[12px] text-cv-accent">
                {m.source}
                <span aria-hidden className="no-print transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Fact({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-4 py-3.5 first:pt-0 sm:grid-cols-[140px_1fr]">
      <dt className="pt-[3px]">
        <Caps className="text-[10px] text-cv-faint">{k}</Caps>
      </dt>
      <dd className="text-[14px] leading-snug text-cv-fg">{children}</dd>
    </div>
  );
}
