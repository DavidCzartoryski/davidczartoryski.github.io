import { education, profile, recruiter } from "@/data/site";
import { Label } from "./bits";

/** The first screen: the pitch, the facts a recruiter screens on, and the numbers. */
export default function Overview() {
  return (
    <section id="overview" aria-label="Overview" className="scroll-mt-24">
      <p className="text-[clamp(1.85rem,3.4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.035em]">
        {recruiter.headline}
      </p>
      <p className="mt-5 max-w-2xl text-[16.5px] leading-relaxed text-cv-muted">{recruiter.lede}</p>

      <dl className="mt-10 grid gap-px overflow-hidden rounded-xl bg-cv-line ring-1 ring-cv-line sm:grid-cols-2">
        <Fact k="Graduating">
          {education.range} · {profile.school}
        </Fact>
        <Fact k="Studying">
          {profile.degree}, {profile.concentration} concentration
        </Fact>
        <Fact k="Based in">{profile.bases.map((b) => b.city).join(" · ")}</Fact>
        <Fact k="Open to">
          <ul className="space-y-1">
            {profile.openTo.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </Fact>
      </dl>

      <h2 id="impact-h" className="mt-14">
        <Label className="text-cv-faint">By the numbers</Label>
      </h2>
      <ul className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-cv-line ring-1 ring-cv-line md:grid-cols-4">
        {recruiter.impact.map((m) => (
          <li key={m.value} className="bg-cv-bg">
            <a href={m.href} className="group flex h-full flex-col p-4 transition-colors hover:bg-cv-surface sm:p-5">
              <span className="text-[1.9rem] font-semibold leading-none tracking-[-0.04em] text-cv-fg sm:text-[2.1rem]">
                {m.value}
              </span>
              <span className="mt-3 text-[13px] leading-snug text-cv-muted">{m.label}</span>
              <span className="mt-auto flex items-center gap-1 pt-4 text-[12.5px] font-medium text-cv-accent">
                {m.source}
                <span aria-hidden className="no-print transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <figure className="mt-14 rounded-xl bg-cv-surface px-6 py-6 md:px-8 md:py-7">
        <figcaption>
          <Label className="text-cv-accent">The work that excites me</Label>
        </figcaption>
        <blockquote className="mt-3 text-[clamp(1.05rem,1.6vw,1.2rem)] leading-relaxed text-cv-fg">
          {profile.excites}
        </blockquote>
      </figure>
    </section>
  );
}

function Fact({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="bg-cv-bg px-5 py-4">
      <dt>
        <Label className="text-cv-faint">{k}</Label>
      </dt>
      <dd className="mt-1.5 text-[14.5px] leading-snug text-cv-fg">{children}</dd>
    </div>
  );
}
