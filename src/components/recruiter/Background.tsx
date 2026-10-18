import Link from "next/link";
import { education, layover, recruiter } from "@/data/site";
import { Bullets, Caps, Dot, SectionHead } from "./bits";
import { Logo } from "./Experience";
import { Pin } from "./icons";
import Plane from "../Plane";

/** Education and the rest of the person. */
export default function Background() {
  const beyond = [...recruiter.beyond, { k: "Interests", v: layover.extras.join(" · ") }];
  return (
    <section id="education" aria-labelledby="education-h" className="scroll-mt-28 pt-32 md:pt-40">
      <SectionHead id="education" n="06" kicker="Education" title="Northeastern, and off the clock" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <article className="rounded-2xl border border-cv-line bg-cv-card p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Caps className="text-[10.5px] text-cv-fg">{education.range}</Caps>
            <span aria-hidden className="h-px w-8 bg-cv-line-2" />
            <Caps className="flex items-center gap-1.5 text-[10.5px] text-cv-faint">
              <Pin size={11} /> {education.city}
            </Caps>
          </div>
          <div className="mt-5 flex items-center gap-4">
            <Logo src={education.logo} fallback="NU" />
            <h3 className="text-[1.6rem] font-light leading-tight tracking-[-0.025em]">
              <Dot>{education.school}</Dot>
            </h3>
          </div>
          <div className="mt-1.5 text-[14.5px] text-cv-fg/85">{education.degree}</div>
          <div className="mt-0.5 text-[14px] text-cv-muted">{education.concentration}</div>
          <Bullets items={education.bullets} className="mt-6 text-[14px]" />
        </article>

        <div className="flex flex-col rounded-2xl border border-cv-line bg-cv-card p-6 md:p-8">
          <Caps className="text-[10.5px] text-cv-faint">Off the clock</Caps>
          <dl className="mt-3 divide-y divide-cv-line">
            {beyond.map((b) => (
              <div key={b.k} className="py-4 last:pb-0">
                <dt className="text-[13px] font-medium text-cv-fg">{b.k}</dt>
                <dd className="mt-1 text-[14px] leading-relaxed text-cv-muted">{b.v}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/"
            className="no-print mt-auto inline-flex items-center gap-2 pt-7 text-[13.5px] text-cv-accent underline-offset-4 hover:underline"
          >
            <Plane size={12} /> The stamps, the mat and the photos are in the full site
          </Link>
        </div>
      </div>
    </section>
  );
}
